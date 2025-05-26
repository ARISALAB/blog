document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Αποτρέπει την προεπιλεγμένη υποβολή της φόρμας

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    try {
        const response = await fetch('/api/posts', {
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
            const errorData = await response.json();
            alert(`Σφάλμα κατά τη δημοσίευση: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Σφάλμα σύνδεσης με τον server:', error);
        alert('Αδυναμία σύνδεσης με τον server. Παρακαλώ δοκιμάστε ξανά.');
    }
});