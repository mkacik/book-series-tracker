import React from "react";
import { BookSeries } from "./generated/types";

type DeleteSeriesHandler = (asin: string) => void;
type AddSeriesHandler = (asin: string) => void;

function render_series(
  series: BookSeries,
  deleteSeriesHandler: DeleteSeriesHandler,
) {
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
    <li key={"series_" + series.asin}>
      {series.name}{" "}
      <a href={"https://www.amazon.com/dp/" + series.asin}>{series.asin}</a>{" "}
      <button type="submit" onClick={deleteSeries}>
        delete
      </button>
    </li>
  );
}

function render_all_series(
  all_series: Array<BookSeries>,
  deleteSeriesHandler: DeleteSeriesHandler,
) {
  if (all_series.length == 0) {
    return "No series tracked yet. Add series ASIN to start";
  }

  return (
    <ul>
      {all_series.map((item, index) =>
        render_series(item, deleteSeriesHandler),
      )}
    </ul>
  );
}

export function Series({
  series,
  addSeriesHandler,
  deleteSeriesHandler,
}: {
  series: Array<BookSeries>;
  addSeriesHandler: AddSeriesHandler;
  deleteSeriesHandler: DeleteSeriesHandler;
}) {
  const addSeries = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    const target = event.target as typeof event.target & {
      asin: { value: string };
    };
    let asin = target.asin.value;
    (event.target as HTMLFormElement).reset();
    addSeriesHandler(asin);
  };

  return (
    <>
      <form onSubmit={addSeries}>
        <input type="text" name="asin" required={true} />{" "}
        <button type="submit">Add series</button>
      </form>
      {render_all_series(series, deleteSeriesHandler)}
    </>
  );
}
