import React from "react";
import { useState } from "react";
import { BookSeries } from "./generated/types";
import { useUserContext } from "./User";
import { BackendRoute } from "./Navigation";

import * as UI from "./UI";

function SubscribeButton({
  series,
  refreshSeries,
}: {
  series: BookSeries;
  refreshSeries: () => void;
}) {
  const toggleSubscription = () => {
    const route = series.subscribed
      ? BackendRoute.Unsubscribe
      : BackendRoute.Subscribe;
    const url = `${route}/${series.asin}`;
    fetch(url, { method: "POST" }).then((response) => {
      if (response.ok) {
        refreshSeries();
      } else {
        alert("Error while subscribing to series.");
      }
    });
  };

  return (
    <UI.Switch
      size="sm"
      checked={series.subscribed}
      onChange={toggleSubscription}
    />
  );
}

function DeleteButton({
  series,
  refreshSeries,
}: {
  series: BookSeries;
  refreshSeries: () => void;
}) {
  if (series.subscribers > 0) {
    return null;
  }

  const deleteSeries = () => {
    const warning =
      `Do you really want to stop tracking "${series.name}" series? This will ` +
      "delete all its books from calendar. If you re-add the series later, books " +
      "released in the meantime will not be visible in the tracker.";
    if (confirm(warning) != true) {
      return;
    }

    fetch(BackendRoute.Series, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ asin: series.asin }),
    }).then((response) => {
      if (response.ok) {
        refreshSeries();
      } else {
        alert(
          "Error while deleting series, check if server is running and try again.",
        );
      }
    });
  };

  return <UI.DeleteButton onClick={deleteSeries} />;
}

function SeriesListItem({
  series,
  refreshSeries,
}: {
  series: BookSeries;
  refreshSeries: () => void;
}) {
  return (
    <UI.Flex gap="0.4em" align="center">
      <SubscribeButton series={series} refreshSeries={refreshSeries} />

      <UI.Text size="lg" c={series.subscribed ? undefined : "dimmed"}>
        {series.name}
      </UI.Text>

      <UI.Anchor href={"https://www.amazon.com/dp/" + series.asin}>
        {series.asin}
      </UI.Anchor>

      <DeleteButton series={series} refreshSeries={refreshSeries} />
    </UI.Flex>
  );
}

function SeriesList({
  series,
  refreshSeries,
}: {
  series: Array<BookSeries>;
  refreshSeries: () => void;
}) {
  if (series.length == 0) {
    return "No series tracked yet. Add series ASIN to start.";
  }

  return (
    <UI.Flex direction="column" gap="0.4em">
      <UI.Title order={4}>Subscribe to already tracked series</UI.Title>
      {series.map((item, index) => (
        <SeriesListItem
          key={index}
          series={item}
          refreshSeries={refreshSeries}
        />
      ))}
    </UI.Flex>
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

export function SeriesPage({
  series,
  refreshBooksAndSeries,
  refreshJobs,
}: {
  series: Array<BookSeries>;
  refreshBooksAndSeries: () => void;
  refreshJobs: () => void;
}) {
  return (
    <UI.Section title="Tracked Series">
      <SeriesList series={series} refreshSeries={refreshBooksAndSeries} />
      <UI.Space h="xs" />
      <AddSeriesForm refreshJobs={refreshJobs} />
    </UI.Section>
  );
}
