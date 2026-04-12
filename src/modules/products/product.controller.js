const productService = require('./product.service');

const productController = {
  getAll: async (req, res) => {
    try {
      const products = await productService.getAll();
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await productService.getById(id);

      if (product.error) {
        return res.status(404).json({ error: product.error });
      }

      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, manufacturer, notification_threshold, product_code } = req.body;
      const image = req.file ? `/uploads/products/${req.file.filename}` : null;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const product = await productService.create({
        name,
        manufacturer,
        image,
        notification_threshold,
        product_code
      });

      if (product.error) {
        return res.status(400).json({ error: product.error });
      }

      res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, manufacturer, notification_threshold, product_code } = req.body;
      const image = req.file ? `/uploads/products/${req.file.filename}` : undefined;

      const product = await productService.update(id, {
        name,
        manufacturer,
        image,
        notification_threshold,
        product_code
      });

      if (product.error) {
        if (product.error === 'Product not found') {
          return res.status(404).json({ error: product.error });
        }
        return res.status(400).json({ error: product.error });
      }

      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await productService.remove(id);

      if (result.error) {
        if (result.error === 'Product not found') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = productController;
