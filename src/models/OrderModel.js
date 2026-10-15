const pool = require('../config/database');

class OrderModel {
    static async findAll() {
        const ordersRes = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        const orders = [];

        for (const row of ordersRes.rows) {
            const itemsRes = await pool.query(
                'SELECT oi.product_id as "productId", p.uid as "productUid", p.name, oi.unit_price as "unitPrice", oi.quantity FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
                [row.id]
            );
            orders.push({
                id: row.id,
                createdAt: row.created_at,
                totalAmount: parseFloat(row.total_amount),
                status: row.status,
                items: itemsRes.rows
            });
        }
        return orders;
    }

    static async findById(id) {
        const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) return null;
        const row = orderRes.rows[0];

        const itemsRes = await pool.query(
            'SELECT oi.product_id as "productId", p.uid as "productUid", p.name, oi.unit_price as "unitPrice", oi.quantity FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
            [id]
        );

        return {
            id: row.id,
            createdAt: row.created_at,
            totalAmount: parseFloat(row.total_amount),
            status: row.status,
            items: itemsRes.rows
        };
    }

    static async create(orderId, totalAmount, items) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                'INSERT INTO orders (id, total_amount, status) VALUES ($1, $2, $3)',
                [orderId, totalAmount, 'En attente']
            );

            for (const item of items) {
                await client.query(
                    'INSERT INTO order_items (order_id, product_id, unit_price, quantity) VALUES ($1, $2, $3, $4)',
                    [orderId, item.productId, item.unitPrice, item.quantity]
                );
                await client.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2',
                    [item.quantity, item.productId]
                );
            }

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async updateStatus(orderId, status) {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
    }
}

module.exports = OrderModel;
