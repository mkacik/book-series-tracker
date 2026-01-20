import React from "react";
import { Book, BookSeries } from "./generated/types";
import { BookList } from "./BookList";
import { SeriesList } from "./SeriesList";
import { BackendRoute } from "./Navigation";
import { useUserContext } from "./User";

import * as UI from "./UI";

function AddSeriesForm({
  addSeriesHandler,
}: {
  addSeriesHandler: (asin: string) => void;
}) {
  const addSeries = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    const target = event.target as typeof event.target & {
      asin: { value: string };
    };
    const asin = target.asin.value;
    (event.target as HTMLFormElement).reset();
    addSeriesHandler(asin);
  };

  return (
    <form onSubmit={addSeries}>
      <input type="text" name="asin" required={true} />{" "}
      <button type="submit">Add series</button>
    </form>
  );
}

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
  const user = useUserContext();

  const addSeries = (asin: string): void => {
    fetch(BackendRoute.Series, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ asin: asin }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.job_id != null) {
          refreshJobs();
          alert(
            "Successfully submitted job " +
              result.job_id +
              ". Go to Jobs tab to check progress.",
          );
        } else {
          alert("Error while submitting job: " + result.error);
        }
      });
  };

  const deleteSeries = (asin: string): void => {
    fetch(BackendRoute.Series, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ asin: asin }),
    }).then((response) => {
      if (response.ok) {
        refreshBooksAndSeries();
      }
    });
  };

  return (
    <>
      <UI.Section title="Upcoming Books">
        <BookList books={books} />
      </UI.Section>
      <UI.Section title="Tracked Series">
        {user.isLoggedIn() && <AddSeriesForm addSeriesHandler={addSeries} />}
        <SeriesList
          series={series}
          deleteSeriesHandler={deleteSeries}
          showDeleteButton={user.isLoggedIn()}
        />
      </UI.Section>
    </>
  );
}
