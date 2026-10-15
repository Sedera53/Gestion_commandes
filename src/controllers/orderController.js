const OrderModel = require('../models/OrderModel');
const ProductModel = require('../models/ProductModel');

const orderController = {
    async getOrders(req, res) {
        try {
            const orders = await OrderModel.findAll();
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createOrder(req, res) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: "La commande doit contenir au moins un produit." });
            }

            let totalAmount = 0;
            const parsedItems = [];

            for (const item of items) {
                const { productId, quantity } = item; // productId corresponds to primary key id (serial)
                if (!quantity || quantity <= 0) {
                    return res.status(400).json({ error: "La quantité doit être strictement positive." });
                }

                const product = await ProductModel.findById(productId);
                if (!product) {
                    return res.status(400).json({ error: `Le produit ID '${productId}' est inexistant.` });
                }

                if (product.stock < quantity) {
                    return res.status(400).json({ error: `Stock insuffisant pour '${product.name}' (Demandé: ${quantity}, Dispo: ${product.stock}).` });
                }

                parsedItems.push({
                    productId: product.id,
                    productUid: product.uid,
                    name: product.name,
                    unitPrice: product.price,
                    quantity: quantity
                });

                totalAmount += product.price * quantity;
            }

            const orderId = "CMD-" + Date.now().toString().slice(-6);
            await OrderModel.create(orderId, parseFloat(totalAmount.toFixed(2)), parsedItems);

            const newOrder = await OrderModel.findById(orderId);
            res.status(201).json({ message: "Commande créée avec succès", order: newOrder });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const order = await OrderModel.findById(id);
            if (!order) return res.status(404).json({ error: "Commande introuvable." });

            if (!["En attente", "Validée", "Annulée"].includes(status)) {
                return res.status(400).json({ error: "Statut invalide." });
            }

            if (status === "Annulée") {
                if (order.status === "Annulée") {
                    return res.status(400).json({ error: "Une commande déjà annulée ne peut pas l'être une seconde fois." });
                }
                for (const item of order.items) {
                    const product = await ProductModel.findById(item.productId);
                    if (product) {
                        await ProductModel.updateStock(item.productId, product.stock + item.quantity);
                    }
                }
            }

            await OrderModel.updateStatus(id, status);
            const updatedOrder = await OrderModel.findById(id);
            res.json({ message: `Statut mis à jour à : ${status}`, order: updatedOrder });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = orderController;
