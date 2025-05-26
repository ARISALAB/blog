exports.handler = async function(event, context) {
    console.log("Test function executed!"); // Αυτό πρέπει να εμφανιστεί στα logs
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello from Netlify Test Function!" })
    };
};
