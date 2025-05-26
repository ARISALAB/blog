// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('postForm');
    const postsContainer = document.getElementById('postsContainer');

    // Function to fetch and display posts
    async function fetchPosts() {
        try {
            const response = await fetch('/.netlify/functions/server/api/posts');
            if (!response.ok) {
                // Try to parse JSON error message if available
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const posts = await response.json();
            postsContainer.innerHTML = ''; // Clear existing posts

            if (posts.length === 0) {
                postsContainer.innerHTML = '<p>Δεν υπάρχουν ακόμα άρθρα. Γίνε ο πρώτος που θα δημοσιεύσει!</p>';
                return;
            }

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post-item');

                let imageUrlHtml = '';
                if (post.image_url) {
                    imageUrlHtml = `<img src="<span class="math-inline">\{post\.image\_url\}" alt\="</span>{post.title}" class="post-image">`;
                }

                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <span class="math-inline">\{imageUrlHtml\} <p\></span>{post.content}</p>
                    <small>${new Date(post.date).toLocaleString()}</small>
                `;
                postsContainer.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            postsContainer.innerHTML = '<p>Σφάλμα φόρτωσης άρθρων. Παρακαλώ δοκιμάστε ξανά αργότερα.</p>';
        }
    }

    // Handle form submission
    postForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        const imageFile = document.getElementById('postImage').files[0]; // Get the selected file

        if (!title || !content) {
            alert('Ο τίτλος και το περιεχόμενο είναι υποχρεωτικά.');
            return;
        }

        let imageBase64 = null;
        if (imageFile) {
            // Check file size (e.g., max 5MB)
            if (imageFile.size > 5 * 1024 * 1024) { // 5 MB
                alert('Το μέγεθος της εικόνας δεν πρέπει να υπερβαίνει τα 5MB.');
                return;
            }
            // Check file type (optional, already handled by accept="image/*")
            if (!imageFile.type.startsWith('image/')) {
                alert('Παρακαλώ επιλέξτε ένα αρχείο εικόνας.');
                return;
            }

            try {
                // Read file as Base64
                imageBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result); // reader.result will be the Base64 string
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile); // Reads the contents of the specified Blob or File.
                });
            } catch (error) {
                console.error('Error reading image file:', error);
                alert('Σφάλμα ανάγνωσης αρχείου εικόνας. Δοκιμάστε ξανά.');
                return;
            }
        }

        try {
            const response = await fetch('/.netlify/functions/server/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content, imageBase64 }), // Send image as Base64
            });

            if (!response.ok) {
                const errorData = await response.json(); // Attempt to read JSON error from server
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            }

            alert('Άρθρο δημοσιεύτηκε επιτυχώς!');
            postForm.reset(); // Clear form fields
            fetchPosts(); // Refresh posts list to show the new post
        } catch (error) {
            console.error('Σφάλμα σύνδεσης με τον server:', error);
            alert('Αποτυχία δημοσίευσης άρθρου: ' + error.message);
        }
    });

    // Initial fetch of posts when the page loads
    fetchPosts();
});
