import React from "react";
import { Book, BookSeries } from "./generated/types";
import { BooksSection } from "./BooksSection";
import { SeriesSection } from "./SeriesSection";

export function BooksPage({
  books,
  series,
  refreshBooksAndSeries,
  refreshJobs,
}: {
  books: Array<Book>;
  series: Array<BookSeries>;
  refreshBooksAndSeries: () => void;
  refreshJobs: () => void;
}) {
  return (
    <>
      <BooksSection books={books} />
      <SeriesSection
        series={series}
        refreshBooksAndSeries={refreshBooksAndSeries}
        refreshJobs={refreshJobs}
      />
    </>
  );
}
