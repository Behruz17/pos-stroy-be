const db = require('../../config/db');

const stockAdjustmentService = {
  // Получить все корректировки остатков
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT sa.*, p.name as product_name, u.name as user_name
      FROM stock_adjustments sa
      LEFT JOIN products p ON sa.product_id = p.id AND p.status = 1
      LEFT JOIN users u ON sa.created_by = u.id AND u.status = 1
      WHERE sa.status = 1
      ORDER BY sa.created_at DESC
    `);
    return rows;
  },

  // Получить корректировки по товару
  getByProductId: async (productId) => {
    const [rows] = await db.execute(`
      SELECT sa.*, u.name as user_name
      FROM stock_adjustments sa
      LEFT JOIN users u ON sa.created_by = u.id AND u.status = 1
      WHERE sa.product_id = ? AND sa.status = 1
      ORDER BY sa.created_at DESC
    `, [productId]);
    return rows;
  },

  // Создать корректировку остатка
  create: async ({ product_id, new_quantity, reason, created_by }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Проверить существование товара
      const [productRows] = await connection.execute(
        'SELECT id, name, type FROM products WHERE id = ? AND status = 1',
        [product_id]
      );

      if (productRows.length === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Product not found' };
      }

      const product = productRows[0];

      // Получить текущий остаток
      const [currentStockRows] = await connection.execute(
        'SELECT quantity FROM stock WHERE product_id = ?',
        [product_id]
      );
      const currentQuantity = currentStockRows.length > 0 ? parseFloat(currentStockRows[0].quantity) : 0;

      // Валидация
      if (new_quantity < 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Quantity cannot be negative' };
      }

      const adjustment = new_quantity - currentQuantity;

      // Если изменение не требуется
      if (adjustment === 0) {
        await connection.rollback();
        connection.release();
        return { error: 'No adjustment needed - quantity is already correct' };
      }

      // Обновить остаток в таблице stock
      await connection.execute(
        'INSERT INTO stock (product_id, quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)',
        [product_id, new_quantity]
      );

      // Для партионных товаров обработать партии
      if (product.type === 'batch') {
        if (adjustment > 0) {
          // Увеличение - создать новую партию с добавленным количеством
          const batchCode = `ADJUST-${product_id}-${Date.now()}`;
          await connection.execute(
            'INSERT INTO stock_items (product_id, quantity, batch_code, status) VALUES (?, ?, ?, ?)',
            [product_id, adjustment, batchCode, 1]
          );
        } else {
          // Уменьшение - списать из самых старых партий
          const remainingToReduce = Math.abs(adjustment);
          const [batchRows] = await connection.execute(
            'SELECT id, quantity FROM stock_items WHERE product_id = ? AND status = 1 ORDER BY created_at ASC',
            [product_id]
          );

          let toReduce = remainingToReduce;
          for (const batch of batchRows) {
            if (toReduce <= 0) break;

            const batchQuantity = parseFloat(batch.quantity);
            const reduction = Math.min(batchQuantity, toReduce);

            await connection.execute(
              'UPDATE stock_items SET quantity = quantity - ? WHERE id = ?',
              [reduction, batch.id]
            );

            // Деактивировать партию, если количество стало 0
            const [updatedBatch] = await connection.execute(
              'SELECT quantity FROM stock_items WHERE id = ?',
              [batch.id]
            );

            if (updatedBatch.length > 0 && parseFloat(updatedBatch[0].quantity) <= 0) {
              await connection.execute(
                'UPDATE stock_items SET status = 0 WHERE id = ?',
                [batch.id]
              );
            }

            toReduce -= reduction;
          }
        }
      }

      // Создать запись о корректировке
      const [adjustmentResult] = await connection.execute(
        'INSERT INTO stock_adjustments (product_id, previous_quantity, new_quantity, adjustment, reason, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [product_id, currentQuantity, new_quantity, adjustment, reason || null, created_by, 1]
      );

      await connection.commit();
      connection.release();

      return {
        id: adjustmentResult.insertId,
        product_id,
        product_name: product.name,
        previous_quantity: currentQuantity,
        new_quantity,
        adjustment,
        reason,
        created_by
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  // Удалить корректировку (мягкое удаление)
  remove: async (id) => {
    const [result] = await db.execute(
      'UPDATE stock_adjustments SET status = 0 WHERE id = ? AND status = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return { error: 'Stock adjustment not found' };
    }

    return { success: true };
  }
};

module.exports = stockAdjustmentService;
