import React from "react";
import { Job } from "./generated/types";
import { JobsTable } from "./JobsTable";

import * as UI from "./UI";

export function JobsPage({ jobs }: { jobs: Array<Job> }) {
  return (
    <UI.Section title="Jobs">
      <JobsTable jobs={jobs} />
    </UI.Section>
  );
}
