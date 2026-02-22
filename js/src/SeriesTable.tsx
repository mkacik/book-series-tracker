import React from "react";
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

function RefreshButton({
  series,
  refreshJobs,
}: {
  series: BookSeries;
  refreshJobs: () => void;
}) {
  const scheduleJob = async () => {
    const warning = `Do you want to tigger scrape for "${series.name}"?`;
    if (confirm(warning) !== true) {
      return;
    }

    const url = `${BackendRoute.Series}/${series.asin}`;
    const fetchHelper = FetchHelper.withAlert("Error while submitting job.");
    await fetchHelper.fetch<AddSeriesResult>(
      new Request(url, { method: "POST" }),
      (result) => {
        refreshJobs();
        alert(
          `Submitted job ${result.job_id}. Go to Jobs tab to check progress.`,
        );
      },
    );
  };

  return <UI.ReloadButton onClick={scheduleJob} />;
}

function DeleteButton({
  series,
  refreshSeries,
}: {
  series: BookSeries;
  refreshSeries: () => void;
}) {
  if (series.subscribers > 0) {
    return <UI.DeleteButton disabled onClick={() => {}} />;
  }

  const deleteSeries = async () => {
    const warning =
      `Do you really want to stop tracking "${series.name}" series? This will ` +
      "delete all its books from calendar for all users. If you re-add the series " +
      "later, you will have to mark books as read by hand again.";
    if (confirm(warning) !== true) {
      return;
    }

    const secondWarning =
      "Seriously, this action is not reversible, do you really want to proceed " +
      `with deletion of "${series.name}"?`;
    if (confirm(secondWarning) !== true) {
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

function SeriesRow({
  series,
  refreshSeries,
  refreshJobs,
}: {
  series: BookSeries;
  refreshSeries: () => void;
  refreshJobs: () => void;
}) {
  return (
    <UI.Table.Tr>
      <UI.Table.Td w="1%">
        <SubscribeButton series={series} refreshSeries={refreshSeries} />
      </UI.Table.Td>

      <UI.Table.Td>
        <UI.Flex gap="xs" align="center">
          <UI.Text size="lg" c={series.subscribed ? undefined : "dimmed"}>
            <b>{series.name}</b>
          </UI.Text>
          <UI.Text size="md" c={series.subscribed ? undefined : "dimmed"}>
            by {series.author}
          </UI.Text>
        </UI.Flex>
      </UI.Table.Td>

      <UI.Table.Td>{series.count}</UI.Table.Td>

      <UI.Table.Td>
        <UI.Anchor
          ff="monospace"
          href={"https://www.amazon.com/dp/" + series.asin}
        >
          {series.asin}
        </UI.Anchor>
      </UI.Table.Td>

      <UI.Table.Td>
        <UI.Flex gap="xs">
          <RefreshButton series={series} refreshJobs={refreshJobs} />
          <DeleteButton series={series} refreshSeries={refreshSeries} />
        </UI.Flex>
      </UI.Table.Td>
    </UI.Table.Tr>
  );
}

export function SeriesTable({
  series,
  refreshSeries,
  refreshJobs,
}: {
  series: Array<BookSeries>;
  refreshSeries: () => void;
  refreshJobs: () => void;
}) {
  if (series.length == 0) {
    return "No series tracked yet. Add series ASIN to start.";
  }

  return (
    <UI.Table fz="md" stickyHeader highlightOnHover>
      <UI.Table.Thead>
        <UI.Table.Tr>
          <UI.Table.Th></UI.Table.Th>
          <UI.Table.Th>Series</UI.Table.Th>
          <UI.Table.Th>Book count</UI.Table.Th>
          <UI.Table.Th>ASIN</UI.Table.Th>
          <UI.Table.Th w="1%"></UI.Table.Th>
        </UI.Table.Tr>
      </UI.Table.Thead>
      <UI.Table.Tbody>
        {series.map((item, index) => (
          <SeriesRow
            key={index}
            series={item}
            refreshSeries={refreshSeries}
            refreshJobs={refreshJobs}
          />
        ))}
      </UI.Table.Tbody>
    </UI.Table>
  );
}
