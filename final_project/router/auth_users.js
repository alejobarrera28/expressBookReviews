const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    // Filter the users array for any user with the same username
    let userswithsamename = users.filter((user) => {
        return user.username === username;
    });
    // Return true if any user with the same username is found, otherwise false
    if (userswithsamename.length > 0) {
        return true;
    } else {
        return false;
    }
}

const authenticatedUser = (username, password) => {
    // Filter the users array for any user with the same username and password
    let validusers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    // Return true if any valid user is found, otherwise false
    if (validusers.length > 0) {
        return true;
    } else {
        return false;
    }
}

//only registered users can login
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }

    // Authenticate user
    if (authenticatedUser(username, password)) {
        // Generate JWT access token
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        // Store access token and username in session
        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send("User successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});


// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const { review } = req.query; // Review is received from query parameters
    const username = req.session.authorization.username;

    if (!review) {
        return res.status(400).json({ message: "Review content is required" });
    }

    // Find the book by ISBN
    let book = books.find(book => book.isbn === isbn);
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Initialize reviews if not present
    if (!book.reviews) {
        book.reviews = {};
    }

    // Add or update review
    book.reviews[username] = review;
    return res.status(200).json({ message: "Review added/updated successfully" });
});


// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    // Find the book by ISBN
    let book = books.find(book => book.isbn === isbn);
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Check if the reviews object exists
    if (!book.reviews) {
        return res.status(404).json({ message: "No reviews found for this book" });
    }

    // Check if the user has a review for this book
    if (!book.reviews[username]) {
        return res.status(404).json({ message: "Review not found for this user" });
    }

    // Delete the review
    delete book.reviews[username];

    // If there are no reviews left, you might want to delete the reviews object
    if (Object.keys(book.reviews).length === 0) {
        delete book.reviews;
    }

    return res.status(200).json({ message: "Review deleted successfully" });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
