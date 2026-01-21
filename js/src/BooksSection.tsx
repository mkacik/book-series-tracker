import React from "react";
import { Book } from "./generated/types";

import * as UI from "./UI";

function formatReleaseDate(book: Book) {
  const year = book.year;
  const month = book.month.toString().padStart(2, "0");
  const day = book.day.toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function BookListItem({ book }: { book: Book }) {
  const title = `${formatReleaseDate(book)}: ${book.title}`;
  return (
    <UI.Flex direction="column">
      <UI.Title order={4}>{title}</UI.Title>
      by {book.author}
      <UI.Anchor href={"https://www.amazon.com/gp/product/" + book.asin}>
        {book.asin}
      </UI.Anchor>
    </UI.Flex>
  );
}

function BookList({ books }: { books: Array<Book> }) {
  if (books.length == 0) {
    return "No upcoming books yet.";
  }

  return (
    <>
      {books.map((book, index) => (
        <BookListItem key={index} book={book} />
      ))}
    </>
  );
}

export function BooksSection({ books }: { books: Array<Book> }) {
  return (
    <UI.Section title="Upcoming Books">
      <BookList books={books} />
    </UI.Section>
  );
}
