const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

router.get('/', authMiddleware, productController.getAll);
router.get('/:id', authMiddleware, productController.getById);
router.post('/', authMiddleware, upload.single('image'), productController.create);
router.put('/:id', authMiddleware, upload.single('image'), productController.update);
router.delete('/:id', authMiddleware, productController.remove);

module.exports = router;
