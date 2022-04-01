// Integration tests for books route

process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

// isbn of sample book
let book_isbn;

beforeEach(async () => {
  let result = await db.query(
    `INSERT INTO
      books (isbn, amazon_url, author, language, pages, publisher, title, year
      VALUES(
        '1234321234',
        'https://amazon.com/test-book',
        'Lily',
        'English',
        403,
        'Publishers AB',
        'Test Book',
        2020
      )
      RETURNING isbn`
  );

  book_isbn = result.rows[0].isbn;
})

describe("POST /books", function () {
  test("Creates a new book", async () => {
    const response = await request(app)
      .post(`/books`)
      .send({
        isbn: '1234512345',
        amazon_url: 'https://amazon.com/new-book',
        author: 'latest author',
        language: 'english',
        pages: 895,
        publisher: 'new publisher',
        title: 'new book',
        year: 2021
      });
    
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevents creating book without required title", async function () {
    const response = await request(app)
      .post(`/books`)
      .send({ year: 2000 });
    
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /books", function () { 
  test("Gets a list of one book", async () => { 
    const response = await request(app)
      .get(`/books`);
    const books = response.body.books;

    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});

describe("GET /books/:isbn", function () { 
  test("Gets a single book based on isbn", async () => { 
    const response = await request(app)
      .get(`/books/${book_isbn}`);
    
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test("Responds with a 404 if can't find a book with that isbn", async () => {
    const response = await request(app)
      .get(`/books/0`);
    
    expect(response.statusCode).toBe(404);
  });
});

describe("PUT /books/:id", function () { 
  test("Updates a single book", async () => { 
    const reponse = await request(app)
      .put(`/books/${book_isbn}`)
      .send({
        isbn: '1234512345',
        amazon_url: 'https://amazon.com/new-book',
        author: 'latest author',
        language: 'english',
        pages: 895,
        publisher: 'new publisher',
        title: 'UPDATED book',
        year: 2021
      });
    
    expect(reponse.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("UPDATED book");
  });

  test("Prevents a bad book update", async () => { 
    const reponse = await request(app)
      .put(`/books/${book_isbn}`)
      .send({
        isbn: '1234512345',
        amazon_url: 'https://amazon.com/new-book',
        author: 'latest author',
        language: 'english',
        pages: 895,
        extra_field: "should break this update",
        publisher: 'new publisher',
        title: 'UPDATED book',
        year: 2021
      });
        
    expect(response.statusCode).toBe(400);
  });

  test("Responds with a 404 if book doesn't exist", async () => { 
    await request(app)
      .delete(`/books/${book_isbn}`);
    
    const response = await request(app)
      .delete(`/books/${book_isbn}`);
    
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /books/:id", function () { 
  test("Deletes a single book", async () => { 
    const reponse = await request(app)
      .delete(`/books/${book_isbn}`);
    
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

afterEach(async () => {
  await db.query("DELETE FROM books");
});

afterAll(async () => { 
  await db.end();
});
