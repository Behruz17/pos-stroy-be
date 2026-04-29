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

  // Создать корректировку остатка и/или цены
  create: async ({ product_id, new_quantity, new_price, reason, created_by }) => {
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

      // Валидация количества
      if (new_quantity !== undefined && new_quantity < 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Quantity cannot be negative' };
      }

      // Валидация цены
      if (new_price !== undefined && new_price < 0) {
        await connection.rollback();
        connection.release();
        return { error: 'Price cannot be negative' };
      }

      // Проверка типа товара для изменения цены
      if (new_price !== undefined && product.type !== 'batch') {
        await connection.rollback();
        connection.release();
        return { error: 'Price adjustment only available for batch products' };
      }

      const adjustment = new_quantity !== undefined ? new_quantity - currentQuantity : 0;

      // Если изменения не требуются
      if ((new_quantity === undefined || adjustment === 0) && new_price === undefined) {
        await connection.rollback();
        connection.release();
        return { error: 'No adjustments needed' };
      }

      // Обновить остаток в таблице stock (только если указано new_quantity)
      if (new_quantity !== undefined) {
        await connection.execute(
          'INSERT INTO stock (product_id, quantity) VALUES (?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)',
          [product_id, new_quantity]
        );
      }

      // Для партионных товаров обработать партии
      if (product.type === 'batch') {
        // Обработка изменения количества
        if (new_quantity !== undefined && adjustment !== 0) {
          if (adjustment > 0) {
            // Увеличение - создать новую партию с добавленным количеством
            const batchCode = `ADJUST-${product_id}-${Date.now()}`;
            await connection.execute(
              'INSERT INTO stock_items (product_id, quantity, batch_code, selling_price, status) VALUES (?, ?, ?, ?, ?)',
              [product_id, adjustment, batchCode, new_price || null, 1]
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

        // Обработка изменения цены
        if (new_price !== undefined) {
          // Проверить есть ли активные партии
          const [existingBatches] = await connection.execute(
            'SELECT id FROM stock_items WHERE product_id = ? AND status = 1',
            [product_id]
          );

          if (existingBatches.length > 0) {
            // Обновить цену во всех активных партиях
            await connection.execute(
              'UPDATE stock_items SET selling_price = ? WHERE product_id = ? AND status = 1',
              [new_price, product_id]
            );
          } else {
            // Если партий нет - создать базовую с quantity = 0
            const batchCode = `PRICE-ADJ-${product_id}-${Date.now()}`;
            await connection.execute(
              'INSERT INTO stock_items (product_id, quantity, batch_code, selling_price, status) VALUES (?, 0, ?, ?, 1)',
              [product_id, batchCode, new_price]
            );
          }
        }
      }

      // Получить текущую цену из партий (только для batch товаров)
      let currentPrice = null;
      if (product.type === 'batch' && new_price !== undefined) {
        const [priceRows] = await connection.execute(
          'SELECT selling_price FROM stock_items WHERE product_id = ? AND status = 1 LIMIT 1',
          [product_id]
        );
        currentPrice = priceRows.length > 0 ? priceRows[0].selling_price : null;
      }

      // Создать запись о корректировке
      const finalQuantity = new_quantity !== undefined ? new_quantity : currentQuantity;
      const finalAdjustment = new_quantity !== undefined ? adjustment : null;
      
      const [adjustmentResult] = await connection.execute(
        'INSERT INTO stock_adjustments (product_id, previous_quantity, new_quantity, adjustment, previous_price, new_price, price_adjustment, reason, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [product_id, currentQuantity, finalQuantity, finalAdjustment, currentPrice, new_price || null, new_price ? (new_price - (currentPrice || 0)) : null, reason || null, created_by, 1]
      );

      await connection.commit();
      connection.release();

      return {
        id: adjustmentResult.insertId,
        product_id,
        product_name: product.name,
        previous_quantity: currentQuantity,
        new_quantity: finalQuantity,
        adjustment: finalAdjustment,
        previous_price: currentPrice,
        new_price: new_price || null,
        price_adjustment: new_price ? (new_price - (currentPrice || 0)) : null,
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
