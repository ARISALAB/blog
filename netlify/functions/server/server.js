const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const serverless = require('serverless-http');
const cloudinary = require('cloudinary').v2; // <--- ΠΡΟΣΘΕΣΕ ΑΥΤΗ ΤΗ ΓΡΑΜΜΗ
const dotenv = require('dotenv'); // <--- ΠΡΟΣΘΕΣΕ ΑΥΤΗ ΤΗ ΓΡΑΜΜΗ για environment variables

// Φόρτωση environment variables από το .env αρχείο (για τοπική ανάπτυξη)
dotenv.config();

const app = express();

let db;
const dbPath = path.resolve('/tmp', 'blog.db');

// Ρύθμιση Cloudinary - Χρησιμοποιούμε environment variables!
cloudinary.config({
 CLOUDINARY_CLOUD_NAME=dirse2a8b
CLOUDINARY_API_KEY=985799893533169
CLOUDINARY_API_SECRET=ZwaMOpEbXRUbq3ENVBcewFTLzhU
});

// ... (η initializeDb function μένει ως έχει, με την προσθήκη image_url) ...

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Αυξάνουμε το όριο για εικόνες

// ... (τα console.log middleware μένουν ως έχουν) ...

// API Routes
app.post('/.netlify/functions/server/api/posts', async (req, res) => {
    console.log('POST /.netlify/functions/server/api/posts route hit!');
    try {
        await initializeDb();
        console.log('Database initialized successfully for POST request.');
        const { title, content, imageBase64 } = req.body; // <--- imageBase64 για την εικόνα

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        let imageUrl = null;
        if (imageBase64) {
            try {
                // Ανεβάζουμε την εικόνα στο Cloudinary
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: "blog_images" // Μπορείς να ορίσεις έναν φάκελο στο Cloudinary
                });
                imageUrl = uploadResult.secure_url;
                console.log('Image uploaded to Cloudinary:', imageUrl);
            } catch (uploadErr) {
                console.error('Error uploading image to Cloudinary:', uploadErr.message);
                return res.status(500).json({ message: 'Failed to upload image.', error: uploadErr.message });
            }
        }

        const stmt = db.prepare('INSERT INTO posts (title, content, image_url) VALUES (?, ?, ?)'); // <--- ΠΡΟΣΘΕΣΕ image_url
        stmt.run(title, content, imageUrl, function(err) { // <--- ΠΡΟΣΘΕΣΕ imageUrl
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

// ... (το app.get παραμένει ως έχει ή μπορεί να επιστρέψει και το image_url) ...
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
            res.status(200).json(rows); // Αυτό θα επιστρέψει τώρα και το image_url
        });
    } catch (err) {
        console.error('Unhandled error in GET route execution:', err);
        res.status(500).json({ message: 'Database initialization failed.', error: err.message });
    }
});

// ... (το app.all('*') παραμένει ως έχει) ...

module.exports.handler = serverless(app);
