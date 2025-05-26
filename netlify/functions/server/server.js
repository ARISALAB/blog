const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

let db;
const dbPath = path.resolve('/tmp', 'blog.db'); // Βεβαιώσου ότι χρησιμοποιεί /tmp

function initializeDb() {
    return new Promise((resolve, reject) => {
        if (db) {
            console.log('Database already initialized.');
            return resolve(db);
        }
        console.log('Attempting to initialize database...');
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('CRITICAL: Error connecting to database:', err.message);
                db = null;
                return reject(err);
            }
            console.log('Successfully connected to the SQLite database.');
            db.run(`CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                date DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('CRITICAL: Error creating table:', err.message);
                    db = null;
                    return reject(err);
                }
                console.log('Posts table ensured to exist.');
                resolve(db);
            });
        });
    });
}

// Middlewares
app.use(cors());
app.use(express.json());

// Προσθέτουμε αυτό το middleware για να δούμε το path (για debugging)
app.use((req, res, next) => {
    console.log('Incoming request path:', req.path);
    console.log('Incoming request URL:', req.url);
    next();
});

// API Routes
// ΑΛΛΑΞΕ ΑΥΤΑ ΤΑ PATHS (όπως κάναμε την προηγούμενη φορά):
app.post('/.netlify/functions/server/api/posts', async (req, res) => {
    console.log('POST /.netlify/functions/server/api/posts route hit!');
    try {
        await initializeDb(); // <-- Η κλήση μέσα στην async function
        console.log('Database initialized successfully for POST request.');
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
        console.error('Unhandled error in POST route execution:', err);
        res.status(500).json({ message: 'A server error occurred.', error: err.message });
    }
});

app.get('/.netlify/functions/server/api/posts', async (req, res) => {
    console.log('GET /.netlify/functions/server/api/posts route hit!');
    try {
        await initializeDb(); // <-- Η κλήση μέσα στην async function
        console.log('Database initialized successfully for GET request.');
        db.all('SELECT * FROM posts ORDER BY date DESC', [], (err, rows) => {
            if (err) {
                console.error('Error fetching posts:', err.message);
                return res.status(500).json({ message: 'Failed to fetch posts.' });
            }
            res.status(200).json(rows);
        });
    } catch (err) {
        console.error('Unhandled error in GET route execution:', err);
        res.status(500).json({ message: 'Database initialization failed.', error: err.message });
    }
});

// Αυτό το route θα "πιάσει" όλα τα αιτήματα που δεν ταιριάζουν
app.all('*', (req, res) => {
    console.log('Caught by ALL route:', req.method, req.path);
    res.status(404).json({ message: `Route not found by Express for ${req.method} ${req.path}`, fullPath: req.url });
});

module.exports.handler = serverless(app);
