# Application de Gestion de Commandes - MVC & PostgreSQL

Ce projet implémente une application web complète (Gestion Produits CRUD avec `id` SERIAL et `uid` comme référence unique, pagination, suppression logique `is_active = 1/0` & Commandes/Suivi) en Node.js avec l'architecture **MVC (Modèle-Vue-Contrôleur)** et une base de données **PostgreSQL**.

Assurez-vous d'avoir installé sur votre machine :
Node.js (version 16 ou plus récente)
PostgreSQL

## Base de données PostgreSQL

Exécutez le script SQL suivant pour configurer vos tables et insérer un jeu de données initial :

```sql
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    is_active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL
);

INSERT INTO products (uid, name, price, stock, is_active) VALUES 
('P1', 'Laptop Pro 15', 1200.00, 10, 1),
('P2', 'Souris Ergonomique', 45.50, 25, 1),
('P3', 'Clavier Mécanique', 89.99, 15, 1),
('P4', 'Écran 27 Pouces 4K', 350.00, 8, 1),
('P5', 'Casque Audio Bluetooth', 129.99, 20, 1),
('P6', 'Webcam HD 1080p', 75.00, 12, 1),
('P7', 'Hub USB-C Multiport', 39.99, 30, 1)
;
```

## Instructions pour lancer l'application

1. Configurez vos identifiants PostgreSQL dans le fichier `.env`.
    DB_USER=postgres
    DB_PASSWORD=root  --mot de passe du bdd
    DB_HOST=localhost
    DB_PORT=5432  --port du postgres
    DB_NAME=gestion_commandes_db --Nom de base de donne
    PORT=3000  --Port utiliser par l'application

   
3. Installez les dépendances :
   ```bash
   npm install
   ```
4. Lancez le serveur :
   ```bash
   npm start
   ```
5. Ouvrez votre navigateur sur **`http://localhost:3000`**.
