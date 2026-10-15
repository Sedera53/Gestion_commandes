const express = require('express');
const path = require('path');
require('dotenv').config();

const productController = require('./controllers/productController');
const orderController = require('./controllers/orderController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// Routes API REST (MVC)
app.get('/api/products', productController.getProducts);
app.post('/api/products', productController.createProduct);
app.put('/api/products/:id', productController.updateProduct);
app.delete('/api/products/:id', productController.deleteProduct);

app.get('/api/orders', orderController.getOrders);
app.post('/api/orders', orderController.createOrder);
app.patch('/api/orders/:id/status', orderController.updateOrderStatus);

app.listen(PORT, () => {
    console.log(`Serveur MVC PostgreSQL démarré sur http://localhost:${PORT}`);
});
