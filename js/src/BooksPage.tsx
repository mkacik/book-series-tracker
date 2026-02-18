import React from "react";
import { useState } from "react";
import { Book, BookSeries } from "./generated/types";
import { BackendRoute } from "./Navigation";
import { AppSettings, useAppSettingsContext } from "./AppSettings";
import { FetchHelper } from "./FetchHelper";

import * as UI from "./UI";

function sortByOrdinal(a: Book, b: Book) {
  return a.ordinal - b.ordinal;
}

function MarkReadButton({
  book,
  refreshBooks,
}: {
  book: Book;
  refreshBooks: () => void;
}) {
  const markRead = async () => {
    const url = `${BackendRoute.MarkRead}/${book.asin}`;
    const fetchHelper = FetchHelper.withAlert(
      "Error while marking book as read.",
    );
    await fetchHelper.fetch(new Request(url, { method: "POST" }), (_result) =>
      refreshBooks(),
    );
  };

  return (
    <UI.Button size="compact-sm" onClick={markRead}>
      mark read
    </UI.Button>
  );
}

function ReadDate({
  book,
  refreshBooks,
}: {
  book: Book;
  refreshBooks: () => void;
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [readDate, setReadDate] = useState<string | null>(book.read_date);

  const updateReadDate = async () => {
    if (readDate == book.read_date) {
      setModalVisible(false);
      return;
    }
    const url = `${BackendRoute.MarkRead}/${book.asin}/${readDate}`;
    const fetchHelper = FetchHelper.withAlert(
      "Error while updating read date.",
    );
    await fetchHelper.fetch(new Request(url, { method: "POST" }), (_result) => {
      refreshBooks();
      setModalVisible(false);
    });
  };

  const markUnread = async () => {
    const url = `${BackendRoute.MarkUnread}/${book.asin}`;
    const fetchHelper = FetchHelper.withAlert(
      "Error while marking book as unread.",
    );
    await fetchHelper.fetch(new Request(url, { method: "POST" }), (_result) => {
      refreshBooks();
      setModalVisible(false);
    });
  };

  return (
    <>
      <UI.Flex gap="0.2rem" align="center">
        <UI.Text style={{ textWrap: "nowrap" }}>{book.read_date}</UI.Text>
        <UI.CalendarButton onClick={() => setModalVisible(true)} />
      </UI.Flex>

      <UI.Modal
        opened={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Change read date"
      >
        <UI.Space h="sm" />
        <UI.Center>
          <UI.DatePicker value={readDate} onChange={setReadDate} />
        </UI.Center>
        <UI.Space h="md" />
        <UI.Flex>
          <UI.Button variant="outline" onClick={markUnread}>
            mark unread
          </UI.Button>
          <UI.Button ml="auto" onClick={updateReadDate}>
            save
          </UI.Button>
        </UI.Flex>
      </UI.Modal>
    </>
  );
}

function BookRow({
  book,
  refreshBooks,
  isMobile,
  settings,
}: {
  book: Book;
  refreshBooks: () => void;
  isMobile: boolean;
  settings: AppSettings;
}) {
  return (
    <UI.Table.Tr>
      <UI.Table.Td pl="xl">{book.title}</UI.Table.Td>
      {!isMobile && (
        <>
          {!settings.hideBookAuthorColumn && (
            <UI.Table.Td>{book.author}</UI.Table.Td>
          )}
          <UI.Table.Td>
            <UI.Anchor
              ff="monospace"
              href={"https://www.amazon.com/gp/product/" + book.asin}
            >
              {book.asin}
            </UI.Anchor>
          </UI.Table.Td>
          <UI.Table.Td style={{ textWrap: "nowrap" }}>
            {book.release_date}
          </UI.Table.Td>
        </>
      )}
      <UI.Table.Td>
        {book.read_date === null ? (
          <MarkReadButton book={book} refreshBooks={refreshBooks} />
        ) : (
          <ReadDate book={book} refreshBooks={refreshBooks} />
        )}
      </UI.Table.Td>
    </UI.Table.Tr>
  );
}

function SeriesRows({
  series,
  books,
  refreshBooks,
  isMobile,
  settings,
}: {
  series: BookSeries;
  books: Array<Book>;
  refreshBooks: () => void;
  isMobile: boolean;
  settings: AppSettings;
}) {
  if (books.length === 0) {
    return null;
  }

  const sortedBooks = books.toSorted(sortByOrdinal);
  // FIXME: change this once series author is scraped
  const author = books[0].author!;

  return (
    <>
      <UI.Table.Tr>
        <UI.Table.Td colSpan={settings.hideBookAuthorColumn ? 1 : 2}>
          <UI.Text size="lg" fw={700}>
            {series.name}
          </UI.Text>
          <UI.Text>by {author}</UI.Text>
        </UI.Table.Td>

        {isMobile ? null : (
          <>
            <UI.Table.Td>
              <UI.Anchor
                fw={700}
                ff="monospace"
                href={"https://www.amazon.com/dp/" + series.asin}
              >
                {series.asin}
              </UI.Anchor>
            </UI.Table.Td>

            <UI.Table.Td colSpan={2}></UI.Table.Td>
          </>
        )}
      </UI.Table.Tr>

      {sortedBooks.map((book) => (
        <BookRow
          key={book.asin}
          book={book}
          refreshBooks={refreshBooks}
          isMobile={isMobile}
          settings={settings}
        />
      ))}
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
  if (settings.hideReadBooks && book.read_date !== null) {
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

function BooksTable({
  books,
  series,
  refreshBooks,
  isMobile,
}: {
  books: Array<Book>;
  series: Array<BookSeries>;
  refreshBooks: () => void;
  isMobile: boolean;
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
    <UI.Table fz="md" stickyHeader highlightOnHover>
      <UI.Table.Thead>
        <UI.Table.Tr>
          <UI.Table.Th>Title</UI.Table.Th>
          {!isMobile && (
            <>
              {!settings.hideBookAuthorColumn && (
                <UI.Table.Th>Author</UI.Table.Th>
              )}
              <UI.Table.Th>ASIN</UI.Table.Th>
              <UI.Table.Th>Released</UI.Table.Th>
            </>
          )}
          <UI.Table.Th w="1%">Read?</UI.Table.Th>
        </UI.Table.Tr>
      </UI.Table.Thead>
      <UI.Table.Tbody>
        {series
          .filter((series) => series.subscribed)
          .map((series) => (
            <SeriesRows
              key={series.asin}
              series={series}
              books={booksBySeries.get(series.asin) || []}
              refreshBooks={refreshBooks}
              isMobile={isMobile}
              settings={settings}
            />
          ))}
      </UI.Table.Tbody>
    </UI.Table>
  );
}

export function BooksPage({
  books,
  series,
  refreshBooks,
  isMobile,
}: {
  books: Array<Book>;
  series: Array<BookSeries>;
  refreshBooks: () => void;
  isMobile: boolean;
}) {
  return (
    <UI.Section title="Books">
      <BooksTable
        books={books}
        series={series}
        refreshBooks={refreshBooks}
        isMobile={isMobile}
      />
    </UI.Section>
  );
}
