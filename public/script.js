document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Αποτρέπει την προεπιλεγμένη υποβολή της φόρμας

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    try {
        // Η URL για το Netlify Function
        const response = await fetch('/.netlify/functions/server/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });

        if (response.ok) {
            alert('Το άρθρο δημοσιεύτηκε επιτυχώς!');
            document.getElementById('postForm').reset(); // Καθαρίζει τη φόρμα
        } else {
            // Προσπαθούμε να διαβάσουμε το σφάλμα ως JSON, αλλά χειριζόμαστε και μη-JSON απαντήσεις
            let errorData = { message: 'Άγνωστο σφάλμα.' };
            try {
                errorData = await response.json();
            } catch (jsonError) {
                console.warn('Απάντηση server δεν ήταν JSON:', await response.text());
                errorData.message = `Σφάλμα: ${response.status} ${response.statusText || ''}`;
            }
            alert(`Σφάλμα κατά τη δημοσίευση: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Σφάλμα σύνδεσης με τον server:', error);
        alert('Αδυναμία σύνδεσης με τον server. Παρακαλώ δοκιμάστε ξανά.');
    }
});
