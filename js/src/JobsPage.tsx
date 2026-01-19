import React from "react";
import { Job } from "./generated/types";
import { SectionHeader } from "./common";
import { JobList } from "./JobList";
import { BackendRoute } from "./Navigation";

export function JobsPage({
  jobs,
  refreshJobs,
}: {
  jobs: Array<Job>;
  refreshJobs: () => void;
}) {
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
    <>
      <SectionHeader sectionName={"Jobs"} />
      <button type="submit" onClick={triggerScrapeForAllSeries}>
        Start scrape for all tracked series
      </button>
      <JobList jobs={jobs} />
    </>
  );
}
