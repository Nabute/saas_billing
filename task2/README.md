# Product Retrieval API Endpoint (Task#2)

## Table of Contents
1. [Overview](#overview)
2. [Original Code](#original-code)
   - [Identified Issues](#identified-issues)
3. [Refactored Code](#refactored-code)
   - [Improvements](#improvements)
4. [Usage](#usage)
   - [Example Request](#example-request)
   - [Example Response](#example-response)
5. [Conclusion](#conclusion)

## Overview

This directory contains a refactored implementation of a RESTful API endpoint in Node.js and Express.js for retrieving a product by its ID from a database. The refactor addresses security, error handling, and response standards to ensure a robust and maintainable codebase.

## Original Code

The original implementation of the API endpoint had several issues:

```javascript
app.get('/product/:productId', (req, res) => {
    db.query(`SELECT * FROM products WHERE id=${req.params.productId}`, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
```

### Identified Issues

1. **SQL Injection Vulnerability**:
   - The original code directly interpolates the `productId` from the URL into the SQL query. This approach is highly vulnerable to SQL injection attacks, where an attacker could manipulate the query by injecting malicious SQL code.

2. **Poor Error Handling**:
   - The code uses `throw err;` to handle errors. This practice can cause the server to crash if an error occurs, leading to potential downtime and a poor user experience.

3. **Missing HTTP Status Codes**:
   - The original code always responds with a `200 OK` status, even if the product is not found. This does not adhere to RESTful API best practices, where specific status codes should indicate the outcome of the request.

## Refactored Code

The refactored code addresses the above issues by implementing the following improvements:

```javascript
app.get('/product/:productId', (req, res) => {
    const productId = req.params.productId;

    // Parameterized query to prevent SQL injection
    const query = 'SELECT * FROM products WHERE id = ?';
    
    db.query(query, [productId], (err, result) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.status(200).json(result);
    });
});
```

### Improvements

1. **SQL Injection Prevention**:
   - The refactored code uses a parameterized query, which separates SQL code from data. This approach ensures that any input provided by the user is treated as data rather than executable code, thus preventing SQL injection attacks.

2. **Robust Error Handling**:
   - Instead of crashing the server, the refactored code logs any errors encountered during the database query and returns a `500 Internal Server Error` response to the client. This ensures that the server remains operational even when an error occurs.

3. **Proper Use of HTTP Status Codes**:
   - The refactor includes checks to ensure that a `404 Not Found` status is returned when the specified product does not exist in the database. If the product is found, a `200 OK` status is returned along with the product data. This adheres to RESTful API best practices by clearly communicating the result of the request.

## Usage

To use this endpoint, send a GET request to the following URL, replacing `:productId` with the ID of the product you want to retrieve:

```
GET /product/:productId
```

### Example Request

```
GET /product/12345
```

### Example Response

If the product is found:

```json
{
    "id": 12345,
    "name": "Product Name",
    "price": 29.99,
    "description": "Product Description",
    "category": "Product Category"
}
```

If the product is not found:

```json
{
    "message": "Product not found"
}
```

If an error occurs:

```json
{
    "error": "Internal Server Error"
}
```

## Conclusion

This refactored API endpoint provides a more secure, reliable, and user-friendly way to retrieve products from the database. By addressing SQL injection vulnerabilities, improving error handling, and properly using HTTP status codes, the codebase is now better aligned with industry best practices for API development.