const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const serverless = require('serverless-http');
// const cloudinary = require('cloudinary').v2; // <--- ΣΧΟΛΙΑΣΕ ΑΥΤΗ
// const dotenv = require('dotenv'); // <--- ΣΧΟΛΙΑΣΕ ΑΥΤΗ

// dotenv.config(); // <--- ΣΧΟΛΙΑΣΕ ΑΥΤΗ

const app = express();

let db;
const dbPath = path.resolve('/tmp', 'blog.db');

// Ρύθμιση Cloudinary - ΣΧΟΛΙΑΣΕ ΑΥΤΟ ΤΟ BLOCK ΠΡΟΣΩΡΙΝΑ
/*
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
*/

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
                image_url TEXT,  // Κρατήστε το image_url για την ώρα, δεν πειράζει
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
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
    console.log('Incoming request path:', req.path);
    console.log('Incoming request URL:', req.url);
    next();
});

// API Routes
app.post('/.netlify/functions/server/api/posts', async (req, res) => {
    console.log('POST /.netlify/functions/server/api/posts route hit!');
    try {
        await initializeDb();
        console.log('Database initialized successfully for POST request.');
        const { title, content /*, imageBase64 */ } = req.body; // <--- imageBase64 προσωρινά εκτός

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        let imageUrl = null; // Θα είναι πάντα null τώρα

        // ΣΧΟΛΙΑΣΕ ΟΛΟ ΤΟ CLOUDINARY UPLOAD BLOCK ΠΡΟΣΩΡΙΝΑ
        /*
        if (imageBase64) {
            try {
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: "blog_images"
                });
                imageUrl = uploadResult.secure_url;
                console.log('Image uploaded to Cloudinary:', imageUrl);
            } catch (uploadErr) {
                console.error('Error uploading image to Cloudinary:', uploadErr.message);
                return res.status(500).json({ message: 'Failed to upload image.', error: uploadErr.message });
            }
        }
        */

        const stmt = db.prepare('INSERT INTO posts (title, content, image_url) VALUES (?, ?, ?)');
        stmt.run(title, content, imageUrl, function(err) {
            if (err) {
                console.error('Error inserting post:', err.message);
                return res.status(500).json({ message: 'Failed to publish post.' });
            }
            res.status(201).json({ message: 'Post published successfully!', postId: this.lastID, imageUrl: imageUrl });
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
        await initializeDb();
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

app.all('*', (req, res) => {
    console.log('Caught by ALL route:', req.method, req.path);
    res.status(404).json({ message: `Route not found by Express for ${req.method} ${req.path}`, fullPath: req.url });
});

module.exports.handler = serverless(app);
