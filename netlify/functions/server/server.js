const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const serverless = require('serverless-http'); // Εισαγωγή του serverless-http

const app = express();

// ΣΗΜΑΝΤΙΚΗ ΣΗΜΕΙΩΣΗ ΓΙΑ SQLITE ΣΕ NETLIFY FUNCTIONS:
// Η βάση δεδομένων SQLite σε αρχείο (blog.db) ΔΕΝ είναι ιδανική για μόνιμη αποθήκευση
// σε serverless περιβάλλοντα όπως το Netlify Functions / AWS Lambda.
// Το filesystem του function είναι πρόσκαιρο (ephemeral), που σημαίνει
// ότι τα δεδομένα που αποθηκεύονται σε blog.db θα χαθούν όταν το function "κοιμάται"
// (π.χ. μετά από λίγη ώρα αδράνειας) και ξαναξυπνήσει (cold start).
// Για ένα PRODUCTION blog, θα χρειαστείτε μια εξωτερική βάση δεδομένων
// (π.χ. MongoDB Atlas, PostgreSQL στο Render/Supabase/ElephantSQL, FaunaDB κ.λπ.).
// Αυτή η υλοποίηση είναι για επίδειξη του Netlify Functions και τοπική ανάπτυξη.

// Δημιουργία και σύνδεση με τη βάση δεδομένων SQLite
// Χρησιμοποιούμε /tmp για writable filesystem σε Lambda/Netlify Functions
const dbPath = path.resolve('/tmp', 'blog.db');
let db = null; // Θα αρχικοποιούμε τη βάση δεδομένων όταν το function καλείται

// Συνάρτηση για αρχικοποίηση της βάσης δεδομένων
function initializeDb() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error connecting to database:', err.message);
                db = null; // Επαναφορά db σε null σε περίπτωση σφάλματος
                return reject(err);
            }
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
                    db = null;
                    return reject(err);
                }
                console.log('Posts table ensured.');
                resolve(db);
            });
        });
    });
}

// Middlewares
app.use(cors()); // Ενεργοποίηση του CORS
app.use(express.json()); // Για να μπορεί ο server να διαβάζει JSON δεδομένα από τα requests

// API Routes

// 1. POST /api/posts: Δημιουργία νέου άρθρου
app.post('/api/posts', async (req, res) => {
    try {
        await initializeDb(); // Σιγουρευόμαστε ότι η βάση δεδομένων είναι αρχικοποιημένη
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

// 2. GET /api/posts: Ανάκτηση όλων των άρθρων
app.get('/api/posts', async (req, res) => {
    try {
        await initializeDb(); // Σιγουρευόμαστε ότι η βάση δεδομένων είναι αρχικοποιημένη
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

// Η Express εφαρμογή μας ως Netlify Function
// Το "/server" στο URL /.netlify/functions/server προέρχεται από το όνομα του φακέλου "server"
module.exports.handler = serverless(app);

// Σημείωση: Δεν χρειάζεται app.listen() εδώ, καθώς το Netlify χειρίζεται την εκκίνηση του function.
// ... (ο υπάρχων κώδικας του server.js) ...

// Πρόσθεσε αυτό για debugging:
app.use((req, res, next) => {
    console.log('Incoming request path:', req.path);
    console.log('Incoming request URL:', req.url);
    next(); // Προχωράει στο επόμενο middleware/route
});

// Αυτό το route θα "πιάσει" όλα τα αιτήματα που δεν ταιριάζουν με τις προηγούμενες routes
app.all('*', (req, res) => {
    console.log('Caught by ALL route:', req.method, req.path);
    res.status(404).json({ message: `Route not found for ${req.method} ${req.path}`, fullPath: req.url });
});

// Εξαγωγή της Express εφαρμογής ως serverless function
module.exports.handler = serverless(app);
