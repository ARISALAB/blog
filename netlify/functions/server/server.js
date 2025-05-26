const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const serverless = require('serverless-http');
const cloudinary = require('cloudinary').v2; // <--- ΕΝΕΡΓΟΠΟΙΗΣΕ ΑΥΤΗ ΤΗ ΓΡΑΜΜΗ
const dotenv = require('dotenv'); // <--- ΕΝΕΡΓΟΠΟΙΗΣΕ ΑΥΤΗ ΤΗ ΓΡΑΜΜΗ

dotenv.config(); // <--- ΕΝΕΡΓΟΠΟΙΗΣΕ ΑΥΤΗ ΤΗ ΓΡΑΜΜΗ

const app = express();

let db;
const dbPath = path.resolve('/tmp', 'blog.db');

// Ρύθμιση Cloudinary - ΕΝΕΡΓΟΠΟΙΗΣΕ ΑΥΤΟ ΤΟ BLOCK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ... (η initializeDb function μένει ως έχει, αφού τη διορθώσαμε) ...

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ... (τα console.log middleware μένουν ως έχουν) ...

// API Routes
app.post('/.netlify/functions/server/api/posts', async (req, res) => {
    console.log('POST /.netlify/functions/server/api/posts route hit!');
    try {
        await initializeDb();
        console.log('Database initialized successfully for POST request.');
        const { title, content, imageBase64 } = req.body; // <--- ΕΝΕΡΓΟΠΟΙΗΣΕ imageBase64

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        let imageUrl = null;
        // ΕΝΕΡΓΟΠΟΙΗΣΕ ΟΛΟ ΤΟ CLOUDINARY UPLOAD BLOCK
        if (imageBase64) {
            try {
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: "blog_images" // Μπορείς να ορίσεις έναν φάκελο στο Cloudinary
                });
                imageUrl = uploadResult.secure_url;
                console.log('Image uploaded to Cloudinary:', imageUrl);
            } catch (uploadErr) {
                console.error('Error uploading image to Cloudinary:', uploadErr.message);
                // Εάν αποτύχει το ανέβασμα εικόνας, δεν πρέπει να εμποδίσει τη δημοσίευση του άρθρου χωρίς εικόνα
                // Μπορείς να το χειριστείς πιο κομψά εδώ, π.χ. να επιστρέψεις σφάλμα ή απλά να το αγνοήσεις.
                // Προς το παρόν, ας το επιστρέψουμε ως σφάλμα για να το δούμε.
                return res.status(500).json({ message: 'Failed to upload image.', error: uploadErr.message });
            }
        }

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

// ... (το app.get παραμένει ως έχει) ...

module.exports.handler = serverless(app);
