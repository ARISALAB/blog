document.addEventListener('DOMContentLoaded', async () => {
    const postsContainer = document.getElementById('postsContainer');

    try {
        // Η URL για το Netlify Function
        const response = await fetch('/.netlify/functions/server/api/posts'); // Κάνουμε GET αίτημα στον server
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
                
                // Χειρισμός της ημερομηνίας:
                const postDate = post.date ? new Date(post.date).toLocaleDateString() : 'Άγνωστη ημερομηνία';

                postCard.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                    <small>Δημοσιεύτηκε στις: ${postDate}</small>
                `;
                postsContainer.appendChild(postCard);
            });

        } else {
            postsContainer.innerHTML = '<p>Σφάλμα κατά τη φόρτωση των άρθρων.</p>';
            let errorData = { message: 'Άγνωστο σφάλμα.' };
            try {
                errorData = await response.json();
            } catch (jsonError) {
                console.warn('Απάντηση server δεν ήταν JSON:', await response.text());
                errorData.message = `Σφάλμα: ${response.status} ${response.statusText || ''}`;
            }
            console.error('Σφάλμα φόρτωσης άρθρων από server:', errorData.message);
        }
    } catch (error) {
        console.error('Σφάλμα σύνδεσης με τον server:', error);
        postsContainer.innerHTML = '<p>Αδυναμία σύνδεσης με τον server για φόρτωση άρθρων.</p>';
    }
});
