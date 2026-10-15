const pool = require('../config/database');

class ProductModel {
    static async findAll() {
        const result = await pool.query('SELECT * FROM products WHERE is_active = 1 ORDER BY id ASC');
        return result.rows;
    }

    static async findPaginated(page = 1, limit = 5) {
        const offset = (page - 1) * limit;
        const countResult = await pool.query('SELECT COUNT(*) FROM products WHERE is_active = 1');
        const total = parseInt(countResult.rows[0].count);

        const dataResult = await pool.query(
            'SELECT * FROM products WHERE is_active = 1 ORDER BY id ASC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        return {
            data: dataResult.rows,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit) || 1
        };
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM products WHERE id = $1 AND is_active = 1', [id]);
        return result.rows[0] || null;
    }

    static async findByUid(uid) {
        const result = await pool.query('SELECT * FROM products WHERE uid = $1 AND is_active = 1', [uid]);
        return result.rows[0] || null;
    }

    static async findAnyByUid(uid) {
        const result = await pool.query('SELECT * FROM products WHERE uid = $1', [uid]);
        return result.rows[0] || null;
    }

    static async create(uid, name, price, stock) {
        const existing = await this.findAnyByUid(uid);
        if (existing) {
            const result = await pool.query(
                'UPDATE products SET name = $1, price = $2, stock = $3, is_active = 1 WHERE uid = $4 RETURNING *',
                [name, price, stock, uid]
            );
            return result.rows[0];
        } else {
            const result = await pool.query(
                'INSERT INTO products (uid, name, price, stock, is_active) VALUES ($1, $2, $3, $4, 1) RETURNING *',
                [uid, name, price, stock]
            );
            return result.rows[0];
        }
    }

    static async update(id, name, price, stock) {
        const result = await pool.query(
            'UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 AND is_active = 1 RETURNING *',
            [name, price, stock, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        // Soft delete: set is_active = 0
        await pool.query('UPDATE products SET is_active = 0 WHERE id = $1', [id]);
    }

    static async updateStock(id, newStock) {
        await pool.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, id]);
    }
}

module.exports = ProductModel;
