import React from "react";
import { Job } from "./generated/types";
import { JobsTable } from "./JobsTable";
import { BackendRoute } from "./Navigation";

import * as UI from "./UI";

function ScrapeButton({ refreshJobs }: { refreshJobs: () => void }) {
  const triggerScrapeForAllSeries = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    if (confirm("Do you really want to trigger the scrape?") != true) {
      return;
    }

    fetch(BackendRoute.Jobs, {
      method: "POST",
    }).then((response) => {
      if (response.ok) {
        refreshJobs();
      }
    });
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
