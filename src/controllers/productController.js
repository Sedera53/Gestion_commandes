const ProductModel = require('../models/ProductModel');

const productController = {
    async getProducts(req, res) {
        try {
            const { page, limit } = req.query;
            if (page || limit) {
                const result = await ProductModel.findPaginated(page, limit);
                return res.json(result);
            }
            const products = await ProductModel.findAll();
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createProduct(req, res) {
        try {
            const { uid, name, price, stock } = req.body;
            if (!uid || !name || price === undefined || stock === undefined) {
                return res.status(400).json({ error: "Tous les champs sont obligatoires (UID, Nom, Prix, Stock)." });
            }
            const product = await ProductModel.create(uid, name, parseFloat(price), parseInt(stock));
            res.status(201).json({ message: "Produit créé avec succès", product });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const { name, price, stock } = req.body;
            const product = await ProductModel.findById(id);
            if (!product) return res.status(404).json({ error: "Produit introuvable." });

            const updated = await ProductModel.update(
                id,
                name || product.name,
                price !== undefined ? parseFloat(price) : product.price,
                stock !== undefined ? parseInt(stock) : product.stock
            );
            res.json({ message: "Produit mis à jour avec succès", product: updated });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await ProductModel.findById(id);
            if (!product) return res.status(404).json({ error: "Produit introuvable." });

            await ProductModel.delete(id);
            res.json({ message: "Produit supprimé avec succès" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = productController;
