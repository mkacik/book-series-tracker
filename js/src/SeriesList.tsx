import React from "react";
import { BookSeries } from "./generated/types";

type DeleteSeriesHandler = (asin: string) => void;

function SeriesListItem({
  series,
  deleteSeriesHandler,
}: {
  series: BookSeries;
  deleteSeriesHandler: DeleteSeriesHandler;
}) {
  const deleteSeries = (event: React.SyntheticEvent): void => {
    let warning =
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
      <button type="submit" onClick={deleteSeries}>
        delete
      </button>
    </li>
  );
}

export function SeriesList({
  series,
  deleteSeriesHandler,
}: {
  series: Array<BookSeries>;
  deleteSeriesHandler: DeleteSeriesHandler;
}) {
  if (series.length == 0) {
    return "No series tracked yet. Add series ASIN to start";
  }

  return (
    <ul>
      {series.map((item, index) => (
        <SeriesListItem
          series={item}
          deleteSeriesHandler={deleteSeriesHandler}
        />
      ))}
    </ul>
  );
}
