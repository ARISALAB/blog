document.addEventListener('DOMContentLoaded', async () => {
    const postsContainer = document.getElementById('postsContainer');

    try {
        const response = await fetch('/api/posts'); // Κάνουμε GET αίτημα στον server
        if (response.ok) {
            const posts = await response.json(); // Παίρνουμε τα άρθρα ως JSON
            
            if (posts.length === 0) {
                postsContainer.innerHTML = '<p>Δεν υπάρχουν ακόμη άρθρα. Γίνε ο πρώτος που θα δημοσιεύσει!</p>';
                return;
            }

            postsContainer.innerHTML = ''; // Καθαρίζουμε το "Φόρτωση άρθρων..."

            posts.forEach(post => {
                const postCard = document.createElement('div');
                postCard.classList.add('post-card');
                postCard.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                    <small>Δημοσιεύτηκε στις: ${new Date(post.date).toLocaleDateString()}</small>
                `;
                postsContainer.appendChild(postCard);
            });

        } else {
            postsContainer.innerHTML = '<p>Σφάλμα κατά τη φόρτωση των άρθρων.</p>';
        }
    } catch (error) {
        console.error('Σφάλμα σύνδεσης με τον server:', error);
        postsContainer.innerHTML = '<p>Αδυναμία σύνδεσης με τον server για φόρτωση άρθρων.</p>';
    }
});