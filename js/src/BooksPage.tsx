import React from "react";
import { Book, BookSeries } from "./generated/types";
import { BackendRoute } from "./Navigation";
import { AppSettings, useAppSettingsContext } from "./AppSettings";

import * as UI from "./UI";

function sortByOrdinal(a: Book, b: Book) {
  return a.ordinal - b.ordinal;
}

function ReadCheckbox({
  book,
  refreshBooks,
}: {
  book: Book;
  refreshBooks: () => void;
}) {
  const toggleRead = async () => {
    const route = book.read ? BackendRoute.MarkUnread : BackendRoute.MarkRead;
    const url = `${route}/${book.asin}`;
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      alert("Error while changing book read status.");
    }
    refreshBooks();
  };

  return <UI.Checkbox checked={book.read} onChange={toggleRead} />;
}

function BookSection({
  book,
  refreshBooks,
}: {
  book: Book;
  refreshBooks: () => void;
}) {
  const title =
    book.release_date !== null
      ? `${book.release_date}: ${book.title}`
      : book.title;

  return (
    <UI.Flex direction="column">
      <UI.Flex gap="xs" align="center">
        <ReadCheckbox book={book} refreshBooks={refreshBooks} />
        <UI.Title order={4}>{title}</UI.Title>
      </UI.Flex>
      <UI.Flex gap="0.2em" align="center">
        by {book.author}, ASIN:
        <UI.Anchor href={"https://www.amazon.com/gp/product/" + book.asin}>
          {book.asin}
        </UI.Anchor>
      </UI.Flex>
    </UI.Flex>
  );
}

function SeriesSection({
  seriesName,
  books,
  refreshBooks,
}: {
  seriesName: string;
  books: Array<Book>;
  refreshBooks: () => void;
}) {
  if (books.length === 0) {
    return null;
  }

  return (
    <>
      <UI.Title order={3}>{seriesName}</UI.Title>
      <UI.Flex direction="column" gap="sm" ml="lg">
        {books.toSorted(sortByOrdinal).map((book) => (
          <BookSection
            key={book.asin}
            book={book}
            refreshBooks={refreshBooks}
          />
        ))}
      </UI.Flex>
    </>
  );
}

function isReleased(book: Book): boolean {
  if (book.release_date === null) {
    return true;
  }
  const now = new Date();
  const releaseDate = new Date(book.release_date);
  return now > releaseDate;
}

function includeBook(book: Book, settings: AppSettings) {
  if (settings.hideReadBooks && book.read) {
    return false;
  }

  switch (settings.releaseDateFilter) {
    case "released":
      return isReleased(book);
    case "unreleased":
      return !isReleased(book);
    default:
      return true;
  }
}

function BookList({
  books,
  series,
  refreshBooks,
}: {
  books: Array<Book>;
  series: Array<BookSeries>;
  refreshBooks: () => void;
}) {
  if (books.length == 0) {
    return "No tracked books yet.";
  }

  const settings = useAppSettingsContext();

  const booksBySeries: Map<string, Array<Book>> = new Map();

  for (const book of books) {
    if (!includeBook(book, settings)) {
      continue;
    }

    const series_asin = book.series_asin;
    if (booksBySeries.has(series_asin)) {
      booksBySeries.get(series_asin)!.push(book);
      continue;
    }
    booksBySeries.set(series_asin, [book]);
  }

  return (
    <>
      {series
        .filter((series) => series.subscribed)
        .map((series) => (
          <SeriesSection
            key={series.asin}
            seriesName={series.name}
            books={booksBySeries.get(series.asin) || []}
            refreshBooks={refreshBooks}
          />
        ))}
    </>
  );
}

export function BooksPage({
  books,
  series,
  refreshBooks,
}: {
  books: Array<Book>;
  series: Array<BookSeries>;
  refreshBooks: () => void;
}) {
  return (
    <UI.Section title="Books">
      <BookList books={books} series={series} refreshBooks={refreshBooks} />
    </UI.Section>
  );
}
