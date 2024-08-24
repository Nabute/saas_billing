// Route handler for retrieving a product by its ID
app.get('/product/:productId', (req, res) => {

    // Extracting the productId from the request parameters.
    // This value will be used in the SQL query to fetch the specific product.
    const productId = req.params.productId;

    // Constructing a parameterized SQL query to prevent SQL injection attacks.
    // The '?' placeholder will be replaced by the value in the 'productId' array.
    const query = 'SELECT * FROM products WHERE id = ?';

    // Executing the database query.
    // The 'query' function takes the SQL statement and an array of values that will be
    // safely substituted into the query at the corresponding '?' placeholders.
    db.query(query, [productId], (err, result) => {

        // Error handling: If there's an error during the query execution,
        // log the error for debugging purposes and send a 500 Internal Server Error response to the client.
        if (err) {
            console.error("Database query error:", err);

            // Send a 500 status code with a JSON response indicating an internal server error.
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Checking the result of the query.
        // If no product is found (result is empty), send a 404 Not Found response.
        if (result.length === 0) {

            // Send a 404 status code with a JSON response indicating that the product was not found.
            return res.status(404).json({ message: 'Product not found' });
        }

        // If the product is found, send a 200 OK response with the product data as a JSON object.
        res.status(200).json(result);
    });
});
