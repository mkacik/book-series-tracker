CREATE TABLE read_state (
  username TEXT NOT NULL,
  book_asin TEXT NOT NULL,
  read_date TEXT NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (username, book_asin)
);

INSERT INTO read_state (username, book_asin) SELECT * FROM reads;

DROP TABLE reads;
