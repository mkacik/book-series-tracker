import React from "react";
import { useState } from "react";
import { BookSeries, AddSeriesResult } from "./generated/types";
import { BackendRoute } from "./Navigation";
import { FetchHelper } from "./FetchHelper";

import * as UI from "./UI";

function SubscribeButton({
  series,
  refreshSeries,
}: {
  series: BookSeries;
  refreshSeries: () => void;
}) {
  const toggleSubscription = async () => {
    const route = series.subscribed
      ? BackendRoute.Unsubscribe
      : BackendRoute.Subscribe;
    const url = `${route}/${series.asin}`;
    const fetchHelper = FetchHelper.withAlert(
      "Error while subscribing to series.",
    );
    await fetchHelper.fetch(new Request(url, { method: "POST" }), (_result) =>
      refreshSeries(),
    );
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

  const deleteSeries = async () => {
    const warning =
      `Do you really want to stop tracking "${series.name}" series? This will ` +
      "delete all its books from calendar. If you re-add the series later, books " +
      "released in the meantime will not be visible in the tracker.";
    if (confirm(warning) != true) {
      return;
    }

    const url = `${BackendRoute.Series}/${series.asin}`;
    const fetchHelper = FetchHelper.withAlert("Error while deleting series.");
    await fetchHelper.fetch(new Request(url, { method: "DELETE" }), (_result) =>
      refreshSeries(),
    );
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
    <UI.Flex gap="sm" align="center">
      <SubscribeButton series={series} refreshSeries={refreshSeries} />

      <UI.Text size="lg" c={series.subscribed ? undefined : "dimmed"}>
        <b>{series.name}</b> ({series.count} books)
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
  const [asin, setAsin] = useState<string>("");

  const addSeries = async () => {
    const url = `${BackendRoute.Series}/${asin}`;
    const fetchHelper = FetchHelper.withAlert("Error while submitting job.");
    await fetchHelper.fetch<AddSeriesResult>(
      new Request(url, { method: "POST" }),
      (result) => {
        setAsin("");
        refreshJobs();
        alert(
          `Submitted job ${result.job_id}. Go to Jobs tab to check progress.`,
        );
      },
    );
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
        <UI.Button onClick={addSeries} variant="outline">
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
      <AddSeriesForm refreshJobs={refreshJobs} />
      <UI.Space h="xs" />
      <SeriesList series={series} refreshSeries={refreshBooksAndSeries} />
    </UI.Section>
  );
}
