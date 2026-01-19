import React from "react";
import { Book, BookSeries } from "./generated/types";
import { SectionHeader } from "./common";
import { Books } from "./Books";
import { Series } from "./Series";
import { BackendRoute } from "./Navigation";

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
      <SectionHeader sectionName={"Upcoming Books"} />
      <Books books={books} />
      <SectionHeader sectionName={"Tracked Series"} />
      <Series
        series={series}
        addSeriesHandler={addSeries}
        deleteSeriesHandler={deleteSeries}
      />
    </>
  );
}
