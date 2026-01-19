import React from "react";
import { BookSeries } from "./generated/types";

type DeleteSeriesHandler = (asin: string) => void;

function SeriesListItem({
  series,
  deleteSeriesHandler,
  showDeleteButton,
}: {
  series: BookSeries;
  deleteSeriesHandler: DeleteSeriesHandler;
  showDeleteButton: boolean;
}) {
  const deleteSeries = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    const warning =
      `Do you really want to stop tracking "${series.name}" series? This will ` +
      "delete all its books from calendar. If you re-add the series later, books " +
      "released in the meantime will not be visible in the tracker.";
    if (confirm(warning) != true) {
      return;
    }
    deleteSeriesHandler(series.asin);
  };

  return (
    <li key={series.asin}>
      {series.name}{" "}
      <a href={"https://www.amazon.com/dp/" + series.asin}>{series.asin}</a>{" "}
      {showDeleteButton && (
        <button type="submit" onClick={deleteSeries}>
          delete
        </button>
      )}
    </li>
  );
}

export function SeriesList({
  series,
  deleteSeriesHandler,
  showDeleteButton,
}: {
  series: Array<BookSeries>;
  deleteSeriesHandler: DeleteSeriesHandler;
  showDeleteButton: boolean;
}) {
  if (series.length == 0) {
    return "No series tracked yet. Add series ASIN to start";
  }

  return (
    <ul>
      {series.map((item, index) => (
        <SeriesListItem
          key={index}
          series={item}
          deleteSeriesHandler={deleteSeriesHandler}
          showDeleteButton={showDeleteButton}
        />
      ))}
    </ul>
  );
}
