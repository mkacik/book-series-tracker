import React from "react";
import { useState } from "react";
import { Book, GetAllBooksResult } from "./generated/types";

enum View {
  List,
  Calendar,
}

function formatReleaseDate(book: Book) {
  let year = book.year;
  let month = book.month.toString().padStart(2, "0");
  let day = book.day.toString().padStart(2, "0");
  return `${year}-${month}-${day}`
}

function BookCard({ book }: { book: Book }) {
  return (
    <div className="card">
      <h3>{formatReleaseDate(book)}: {book.title}</h3>
      <span>autor: {book.author}</span>
      <span>link: <a href={"https://www.amazon.com/gp/product/" + book.asin}>{book.asin}</a></span>
    </div>
  )
}

function BooksAsList({books}: {books: Array<Book>}) {
  return <>
    {books.map((book, index) => <BookCard key={index} book={book} />)}
  </>;
}

function BooksAsCalendar({books}: {books: Array<Book>}) {
  return <span>Coming soon...</span>;
}

export function Books({ books }: { books: GetAllBooksResult }) {
  const [view, setView] = useState<View>(View.List);

  const toggleView = (): void => {
    (view == View.List) ? setView(View.Calendar) : setView(View.List);
  };

  if (books == null) {
    return null;
  }

  let bookList = books.books;
  if (bookList.length == 0) {
    return "No upcoming books yet.";
  }

  return (
    <>
    <button onClick={() => toggleView()}>
      view as {(view == View.List) ? "calendar" : "list"}
    </button>
    {view == View.List ? <BooksAsList books={bookList} /> : <BooksAsCalendar books={bookList} />}
    </>
  );
}
