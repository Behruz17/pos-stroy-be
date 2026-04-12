const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const supplierRoutes = require('../modules/suppliers/supplier.routes');
const productRoutes = require('../modules/products/product.routes');
const customerRoutes = require('../modules/customers/customer.routes');
const stockReceiptRoutes = require('../modules/stock_receipts/stock_receipt.routes');
const salesRoutes = require('../modules/sales/sales.routes');
const returnsRoutes = require('../modules/returns/returns.routes');
const supplierPaymentRoutes = require('../modules/supplier_payments/supplier_payment.routes');
const customerPaymentRoutes = require('../modules/customer_payments/customer_payment.routes');
const expenseRoutes = require('../modules/expenses/expense.routes');
const customerOperationsRoutes = require('../modules/customer_operations/customer_operations.routes');
const supplierOperationsRoutes = require('../modules/supplier_operations/supplier_operations.routes');
const debtorsRoutes = require('../modules/debtors/debtors.routes');
const debtorOperationsRoutes = require('../modules/debtor_operations/debtor_operations.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/stock-receipts', stockReceiptRoutes);
router.use('/sales', salesRoutes);
router.use('/returns', returnsRoutes);
router.use('/supplier-payments', supplierPaymentRoutes);
router.use('/customer-payments', customerPaymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/customer-operations', customerOperationsRoutes);
router.use('/supplier-operations', supplierOperationsRoutes);
router.use('/debtors', debtorsRoutes);
router.use('/debtor-operations', debtorOperationsRoutes);

module.exports = router;
