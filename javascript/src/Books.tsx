import React from "react";
import { useState } from "react";
import { Book, GetAllBooksResult } from "./generated/types";

function formatReleaseDate(book: Book) {
  let year = book.year;
  let month = book.month.toString().padStart(2, "0");
  let day = book.day.toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function BookCard({ book }: { book: Book }) {
  return (
    <div className="card">
      <h3>
        {formatReleaseDate(book)}: {book.title}
      </h3>
      <span>autor: {book.author}</span>
      <span>
        link:{" "}
        <a href={"https://www.amazon.com/gp/product/" + book.asin}>
          {book.asin}
        </a>
      </span>
    </div>
  );
}

function BooksAsList({ books }: { books: Array<Book> }) {
  return (
    <>
      {books.map((book, index) => (
        <BookCard key={index} book={book} />
      ))}
    </>
  );
}

export function Books({ books }: { books: GetAllBooksResult }) {
  if (books == null) {
    return null;
  }

  let bookList = books.books;
  if (bookList.length == 0) {
    return "No upcoming books yet.";
  }

  let calendarLink = `${window.location.origin}/calendar`;

  return <>
    <button onClick={() => { location.href = calendarLink }}>
      Open calendar ICS file
    </button>
    <button onClick={() => navigator.clipboard.writeText(calendarLink)}>
      Save subscription calendar link to clipboard
    </button>
    <BooksAsList books={bookList} />
  </>
}
