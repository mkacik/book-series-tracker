import React from "react";
import { useState } from "react";
import { BookSeries, AddSeriesResult } from "./generated/types";
import { BackendRoute } from "./Navigation";
import { FetchHelper } from "./FetchHelper";
import { SeriesTable } from "./SeriesTable";

import * as UI from "./UI";

function ScrapeAllButton({ refreshJobs }: { refreshJobs: () => void }) {
  const triggerScrapeForAllSeries = async () => {
    if (confirm("Do you really want to trigger the scrape?") != true) {
      return;
    }

    const fetchHelper = FetchHelper.withAlert("Error while triggering scrape.");
    await fetchHelper.fetch(
      new Request(BackendRoute.ScrapeAll, { method: "POST" }),
      (_result) => refreshJobs(),
    );
  };

  return (
    <UI.Button ml="auto" variant="outline" onClick={triggerScrapeForAllSeries}>
      Start scrape for all series
    </UI.Button>
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
      <UI.Flex align="end">
        <AddSeriesForm refreshJobs={refreshJobs} />
        <ScrapeAllButton refreshJobs={refreshJobs} />
      </UI.Flex>
      <UI.Space h="xs" />
      <SeriesTable
        series={series}
        refreshSeries={refreshBooksAndSeries}
        refreshJobs={refreshJobs}
      />
    </UI.Section>
  );
}
