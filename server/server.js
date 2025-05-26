const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors'); // Εισαγωγή του cors

const app = express();
const PORT = process.env.PORT || 3000;

// Δημιουργία και σύνδεση με τη βάση δεδομένων SQLite
const dbPath = path.resolve(__dirname, 'blog.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Δημιουργία πίνακα posts αν δεν υπάρχει
        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Posts table ensured.');
            }
        });
    }
});

// Middlewares
app.use(cors()); // Ενεργοποίηση του CORS
app.use(express.json()); // Για να μπορεί ο server να διαβάζει JSON δεδομένα από τα requests
app.use(express.static(path.join(__dirname, '../public'))); // Εξυπηρέτηση των static αρχείων (HTML, CSS, JS) από τον φάκελο public

// API Routes

// 1. POST /api/posts: Δημιουργία νέου άρθρου
app.post('/api/posts', (req, res) => {
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
});

// 2. GET /api/posts: Ανάκτηση όλων των άρθρων
app.get('/api/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            console.error('Error fetching posts:', err.message);
            return res.status(500).json({ message: 'Failed to fetch posts.' });
        }
        res.status(200).json(rows);
    });
});

// Catch-all για το front-end routing αν χρειαστεί (π.χ. για Single Page Applications)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Εκκίνηση του server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to start.`);
});
