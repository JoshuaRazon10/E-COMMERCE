const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'razon_ecommerce'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        console.warn('NOTE: Ensure XAMPP MySQL is running and razon_ecommerce database exists.');
        return;
    }
    console.log('Connected to MySQL Database.');
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// REST API Endpoint: Get all products
app.get('/api/products', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'products.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading product data:', err);
            return res.status(500).json({ error: 'Failed to retrieve products.' });
        }
        res.json(JSON.parse(data));
    });
});

// REST API Endpoint: Process Checkout
app.post('/api/checkout', (req, res) => {
    const { name, email, address, total, items } = req.body;

    if (!name || !email || !address || !items) {
        return res.status(400).json({ error: 'Missing required order details.' });
    }

    const query = 'INSERT INTO orders (customer_name, customer_email, customer_address, total_amount, items) VALUES (?, ?, ?, ?, ?)';
    const values = [name, email, address, total, JSON.stringify(items)];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error saving order to MySQL:', err);
            return res.status(500).json({ error: 'Failed to save order to database.' });
        }
        res.status(201).json({ message: 'Order placed successfully!', orderId: result.insertId });
    });
});

// Fallback to serving the HTML index for any unknown root level requests
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running beautifully on http://localhost:${PORT}`);
});
