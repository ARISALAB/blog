// netlify/functions/server/server.js
const express = require('express');
const serverless = require('serverless-http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const router = express.Router(); // Δημιουργία router

// ... (η λογική σου initializeDb function) ...

app.use(cors());
app.use(express.json());

// Προσθέτουμε τα routes στον router
router.post('/api/posts', async (req, res) => {
    console.log('Received POST request for /api/posts via router');
    try {
        await initializeDb();
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }
        const stmt = db.prepare('INSERT INTO posts (title, content) VALUES (?, ?)');
        stmt.run(title, content, function(err) {
            if (err) {
                console.error('Error inserting post:', err.message);
                return res.status(500).json({ message: 'Failed to publish post.' });
            }
            res.status(201).json({ message: 'Post published successfully!', postId: this.lastID });
        });
        stmt.finalize();
    } catch (err) {
        res.status(500).json({ message: 'Database initialization failed.', error: err.message });
    }
});

router.get('/api/posts', async (req, res) => {
    console.log('Received GET request for /api/posts via router');
    try {
        await initializeDb();
        db.all('SELECT * FROM posts ORDER BY date DESC', [], (err, rows) => {
            if (err) {
                console.error('Error fetching posts:', err.message);
                return res.status(500).json({ message: 'Failed to fetch posts.' });
            }
            res.status(200).json(rows);
        });
    } catch (err) {
        res.status(500).json({ message: 'Database initialization failed.', error: err.message });
    }
});

// ΣΗΜΑΝΤΙΚΟ: Συνδέουμε τον router στην εφαρμογή.
// Το serverless-http θα αφαιρέσει το /.netlify/functions/server/, οπότε το router θα δει το /api/posts.
// Επομένως, το router δεν χρειάζεται να έχει το πλήρες path.
app.use('/api', router); // Mount the router at /api so it handles /api/posts

// Αν θέλεις ένα catch-all για debugging (όπως πριν)
app.all('*', (req, res) => {
    console.log('Caught by ALL route:', req.method, req.path);
    res.status(404).json({ message: `Route not found by Express for ${req.method} ${req.path}`, fullPath: req.url });
});


module.exports.handler = serverless(app);
