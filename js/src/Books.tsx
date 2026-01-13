import React from "react";
import { useState } from "react";
import { Book } from "./generated/types";

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
      <span>by {book.author}</span>
      <span>
        link:{" "}
        <a href={"https://www.amazon.com/gp/product/" + book.asin}>
          {book.asin}
        </a>
      </span>
    </div>
  );
}

export function Books({ books }: { books: Array<Book> }) {
  if (books.length == 0) {
    return "No upcoming books yet.";
  }

  return (
    <>
      {books.map((book, index) => (
        <BookCard key={index} book={book} />
      ))}
    </>
  );
}
