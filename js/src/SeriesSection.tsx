import React from "react";
import { useState } from "react";
import { BookSeries } from "./generated/types";
import { useUserContext } from "./User";
import { BackendRoute } from "./Navigation";

import * as UI from "./UI";

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
  const deleteSeries = (): void => {
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
    <UI.ListItem>
      <UI.Flex gap="0.4rem">
        {series.name}
        <UI.Anchor href={"https://www.amazon.com/dp/" + series.asin}>
          {series.asin}
        </UI.Anchor>
        {showDeleteButton && <UI.DeleteButton onClick={deleteSeries} />}
      </UI.Flex>
    </UI.ListItem>
  );
}

function SeriesList({
  series,
  deleteSeriesHandler,
  showDeleteButton,
}: {
  series: Array<BookSeries>;
  deleteSeriesHandler: DeleteSeriesHandler;
  showDeleteButton: boolean;
}) {
  if (series.length == 0) {
    return "No series tracked yet. Add series ASIN to start.";
  }

  return (
    <UI.List>
      {series.map((item, index) => (
        <SeriesListItem
          key={index}
          series={item}
          deleteSeriesHandler={deleteSeriesHandler}
          showDeleteButton={showDeleteButton}
        />
      ))}
    </UI.List>
  );
}

function AddSeriesForm({ refreshJobs }: { refreshJobs: () => void }) {
  const [asin, setAsin] = useState("");

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
        const jobId = result.job_id;
        if (jobId !== undefined && jobId != null) {
          setAsin("");
          refreshJobs();
          alert(`Submitted job ${jobId}. Go to Jobs tab to check progress.`);
        } else {
          alert("Error while submitting job: " + result.error);
        }
      })
      .catch((error) => {
        alert("Error while submitting job: " + error);
      });
  };

  return (
    <UI.Flex direction="column" gap="xs">
      <UI.Title order={4}>Start tracking new book series</UI.Title>
      <UI.Flex gap="0.4rem">
        <UI.TextInput
          value={asin}
          onChange={(event) => setAsin(event.currentTarget.value)}
          placeholder="Series ASIN"
        />
        <UI.Button onClick={() => addSeries(asin)} variant="outline">
          add
        </UI.Button>
      </UI.Flex>
    </UI.Flex>
  );
}

export function SeriesSection({
  series,
  refreshBooksAndSeries,
  refreshJobs,
}: {
  series: Array<BookSeries>;
  refreshBooksAndSeries: () => void;
  refreshJobs: () => void;
}) {
  const user = useUserContext();

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
      } else {
        alert(
          "Error while deleting series, check if server is running and try again.",
        );
      }
    });
  };

  return (
    <UI.Section title="Tracked Series">
      <SeriesList
        series={series}
        deleteSeriesHandler={deleteSeries}
        showDeleteButton={user.isLoggedIn()}
      />
      {user.isLoggedIn() && <AddSeriesForm refreshJobs={refreshJobs} />}
    </UI.Section>
  );
}
