const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();
const { v4: uuidv4 } = require('uuid');

//Pre created user
let users = [
  {
    username: "Jon",
    password: "Jon123",
  }
];

// Function to check if the username is valid
const isValid = (username) => {
  let usersWithSameName = users.filter((user) => user.username === username);
  return usersWithSameName.length > 0;
};

// Function to check if username and password match
const authenticatedUser = (username, password) => {
  let validUsers = users.filter((user) => user.username === username && user.password === password);
  return validUsers.length > 0;
};

// Endpoint for user login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in" });
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = {
      accessToken, username
    };
    return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

regd_users.post("/logout", (req, res) => {
  // Check if the user is logged in
  if (req.session.authorization) {
      // Destroy the session
      req.session.destroy((err) => {
          if (err) {
              return res.status(500).json({ message: "Error logging out." });
          }
          return res.status(200).send("User successfully logged out.");
      });
  } else {
      return res.status(403).json({ message: "User is not logged in." });
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
    const { review } = req.query; // Extract the review from the query parameter
    const username = req.session.authorization?.username; // Get the username from the session

    if (!username) {
        return res.status(403).json({ message: "User not logged in." });
    }
    if(!review){
      return res.status(204).json({message: "Empty review"});
    }
    // Find the book by its ISBN
    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found." });
    }
    // Check if the user has already reviewed this book
    const existingReview = Object.entries(book.reviews).find(([key, value]) => value.username === username);
    if (existingReview) {
        // Modify the existing review
        const reviewId = existingReview[0]; // Get the review ID
        book.reviews[reviewId].review = review; // Update the review content
        return res.status(200).json({ message: "Review updated successfully.", reviews: book.reviews });
    } else {
        // Add a new review
        const reviewId = uuidv4(); // Generate a new unique ID
        book.reviews[reviewId] = { username, review };
        return res.status(200).json({ message: "Review added successfully.", reviews: book.reviews });
    }
});

regd_users.get('/auth/review', (req, res) => {
  const username = req.session.authorization?.username; // Get the username from the session

  // Check if the user is logged in
  if (!username) {
      return res.status(403).json({ message: "User not logged in." });
  }
  const userReviews = [];

  // Iterate through each book to find reviews by the logged-in user
  for (const [isbn, book] of Object.entries(books)) {
      for (const [reviewId, review] of Object.entries(book.reviews)) {
          if (review.username === username) {
              userReviews.push({
                  isbn,
                  reviewId,
                  author: book.author,
                  title: book.title,
                  review: review.review
              });
          }
      }
  }

  // Check if the user has any reviews
  if (userReviews.length === 0) {
      return res.status(404).json({ message: "No reviews found for this user." });
  }

  // Return the user's reviews
  return res.status(200).json({ reviews: userReviews });
});

regd_users.delete("/auth/review/:isbn/:reviewId" , (req,res)=>{
  const isbn = req.params.isbn;
    const reviewId = req.params.reviewId; // Extract the review ID from the query parameter
    const username = req.session.authorization?.username; // Get the username from the session
    if (!username) {
        return res.status(403).json({ message: "User not logged in." });
    }
    // Find the book by its ISBN
    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found." });
    }
    // Check if the review exists and belongs to the user
    const review = book.reviews[reviewId];
    if (!review) {
        return res.status(404).json({ message: "Review not found." });
    }
    if (review.username !== username) {
        return res.status(403).json({ message: "You can only delete your own reviews." });
    }
    // Delete the review
    delete book.reviews[reviewId];
    return res.status(200).json({ message: "Review deleted successfully.", reviews: book.reviews });
})

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
