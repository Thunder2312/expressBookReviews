const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
let map = new Map();

const filteredBooks = Object.values(books).map(book => ({
  author: book.author,
  title: book.title,
  reviews: book.reviews
}));

public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username && password) {
    if (!isValid(username)) {
      users.push({ "username": username, "password": password });
      return res.status(200).json({ message: "User successfully registered. Now you can login" });
    } else {
      return res.status(404).json({ message: "User already exists!" });
    }
  }
  return res.status(404).json({ message: "Unable to register user." });
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  const promise = new Promise((resolve) => {
    resolve(filteredBooks); // Resolve with the filtered books
  });

  promise
    .then(result => {
      res.json(result); 
    })
    .catch(error => {
      res.status(500).json({ message: `An error occurred: ${error.message}` });
    });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const key = Number(req.params.isbn);
  const promise = new Promise((resolve) => {
    let bookKeys = Object.keys(books).map(Number);
    let book = books[key];

    if (bookKeys.includes(key)) {
      resolve({
        author: book.author,
        title: book.title,
        reviews: book.reviews,
      });
    } else {
      resolve(null); // Resolve with null if the book does not exist
    }
  });
  promise
    .then(bookDetails => {
      if (bookDetails) {
        res.send(`Author: ${bookDetails.author}, Title: ${bookDetails.title}, Reviews: ${JSON.stringify(bookDetails.reviews)}`);
      } else {
        res.status(404).send(`The ISBN does not exist.`);
      }
    })
    .catch(error => {
      res.status(500).send(`An error occurred: ${error.message}`);
    });
});

  
// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const authorName = req.params.author.toLowerCase().replace(/\s+/g, '');

  const promise = new Promise((resolve) => {
    const filteredBooks = Object.values(books).filter(book =>
      book.author.toLowerCase().replace(/\s+/g, '') === authorName);

    resolve(filteredBooks.map(book => ({
      title: book.title,
      reviews: book.reviews
    })));
  });

  promise
    .then(result => {
      if (result.length > 0) {
        res.json(result);
      } else {
        res.status(404).json({ message: "Author not found" });
      }
    })
    .catch(error => {
      res.status(500).json({ message: `An error occurred: ${error.message}` });
    });
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const titleName = req.params.title.replace(/_/g, ' ');

  const promise = new Promise((resolve) => {
    const titles = Object.values(books).filter(book => 
      book.title.toLowerCase() === titleName.toLowerCase()
    );
    // Resolve with the filtered results
    resolve(titles.map(book => ({
      author: book.author,
      reviews: book.reviews
    })));
  });
  promise
    .then(result => {
      if (result.length > 0) {
        res.json(result);
      } else {
        res.status(404).json({ message: "Title not found" });
      }
    })
    .catch(error => {
      res.status(500).json({ message: `An error occurred: ${error.message}` });
    });
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
  const key = Number(req.params.isbn);

  const promise = new Promise((resolve) => {
    let book = books[key];
    if (book) {
      resolve(book.reviews);
    } else {
      resolve(null); // Resolve with null if the book does not exist
    }
  });
  promise
    .then(reviews => {
      if (reviews !== null) {
        res.send(`Reviews: ${JSON.stringify(reviews)}`);
      } else {
        res.status(404).send(`The ISBN does not exist.`);
      }
    })
    .catch(error => {
      res.status(500).send(`An error occurred: ${error.message}`);
    });
});


module.exports.general = public_users;
