CREATE TABLE reads (
  username TEXT NOT NULL,
  book_asin TEXT NOT NULL,
  PRIMARY KEY (username, book_asin)
);
