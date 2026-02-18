import React from "react";
import { Job } from "./generated/types";
import { JobsTable } from "./JobsTable";
import { BackendRoute } from "./Navigation";
import { FetchHelper } from "./FetchHelper";

import * as UI from "./UI";

function ScrapeButton({ refreshJobs }: { refreshJobs: () => void }) {
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
    <span>
      <UI.Button variant="outline" onClick={triggerScrapeForAllSeries}>
        Start scrape for all tracked series
      </UI.Button>
    </span>
  );
}

export function JobsPage({
  jobs,
  refreshJobs,
}: {
  jobs: Array<Job>;
  refreshJobs: () => void;
}) {
  return (
    <UI.Section title="Jobs">
      <ScrapeButton refreshJobs={refreshJobs} />
      <JobsTable jobs={jobs} />
    </UI.Section>
  );
}
