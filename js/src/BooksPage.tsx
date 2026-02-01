import React from "react";
import { Book, BookSeries } from "./generated/types";

import * as UI from "./UI";

function BookListItem({ book }: { book: Book }) {
  const title =
    book.release_date !== null
      ? `${book.release_date}: ${book.title}`
      : book.title;

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

function SeriesSection({
  seriesName,
  books,
}: {
  seriesName: string;
  books: Array<Book>;
}) {
  if (books.length === 0) {
    return null;
  }

  return (
    <>
      <UI.Title order={3}>{seriesName}</UI.Title>
      <UI.Flex direction="column" gap="sm" ml="lg">
        {books.toSorted().map((book, index) => (
          <BookListItem key={index} book={book} />
        ))}
      </UI.Flex>
    </>
  );
}

function BookList({
  books,
  series,
}: {
  books: Array<Book>;
  series: Array<BookSeries>;
}) {
  if (books.length == 0) {
    return "No upcoming books yet.";
  }

  const booksBySeries: Map<string, Array<Book>> = new Map();

  for (const book of books) {
    const series_asin = book.series_asin;
    if (booksBySeries.has(series_asin)) {
      booksBySeries.get(series_asin).push(book);
      continue;
    }
    booksBySeries.set(series_asin, [book]);
  }

  return (
    <>
      {series
        .filter((series) => series.subscribed)
        .map((series, index) => (
          <SeriesSection
            key={index}
            seriesName={series.name}
            books={booksBySeries.get(series.asin) || []}
          />
        ))}
    </>
  );
}

export function BooksPage({
  books,
  series,
}: {
  books: Array<Book>;
  series: Array<BookSeries>;
}) {
  return (
    <UI.Section title="Upcoming Books">
      <BookList books={books} series={series} />
    </UI.Section>
  );
}
