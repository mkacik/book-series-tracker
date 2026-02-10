import React from "react";
import { Job } from "./generated/types";

import * as UI from "./UI";

function pad(num: number): string {
  return num.toString().padStart(2, "0");
}

function formatTimestamp(ts: number | null): string {
  if (ts == null) {
    return "";
  }

  const date = new Date(ts);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const time = date.toTimeString().replace(/ .*/, "");

  return `${year}-${month}-${day} ${time}`;
}

function JobStatus({ status }: { status: string }) {
  if (status === "FAILED") {
    return <UI.Text c="red">{status}</UI.Text>;
  }
  return <UI.Text>{status}</UI.Text>;
}

function JobRow({ job }: { job: Job }) {
  const duration_ms =
    job.time_started && job.time_finished
      ? (job.time_finished - job.time_started) / 1000
      : "";

  return (
    <UI.Table.Tr>
      <UI.Table.Td>{job.id}</UI.Table.Td>
      <UI.Table.Td>{job.params}</UI.Table.Td>
      <UI.Table.Td>{job.username ?? <i>scheduled</i>}</UI.Table.Td>
      <UI.Table.Td>
        <JobStatus status={job.status} />
      </UI.Table.Td>
      <UI.Table.Td>{duration_ms}</UI.Table.Td>
      <UI.Table.Td>{formatTimestamp(job.time_created)}</UI.Table.Td>
      <UI.Table.Td>{formatTimestamp(job.time_started)}</UI.Table.Td>
      <UI.Table.Td>{formatTimestamp(job.time_finished)}</UI.Table.Td>
      <UI.Table.Td>{job.errors}</UI.Table.Td>
    </UI.Table.Tr>
  );
}

export function JobsTable({ jobs }: { jobs: Array<Job> }) {
  return (
    <UI.Table stickyHeader>
      <UI.Table.Thead>
        <UI.Table.Tr>
          <UI.Table.Th>ID</UI.Table.Th>
          <UI.Table.Th>Params</UI.Table.Th>
          <UI.Table.Th>User</UI.Table.Th>
          <UI.Table.Th>Status</UI.Table.Th>
          <UI.Table.Th>Duration (s)</UI.Table.Th>
          <UI.Table.Th>Job Created At</UI.Table.Th>
          <UI.Table.Th>Processing Started At</UI.Table.Th>
          <UI.Table.Th>Processing Finished At</UI.Table.Th>
          <UI.Table.Th>Errors</UI.Table.Th>
        </UI.Table.Tr>
      </UI.Table.Thead>
      <UI.Table.Tbody>
        {jobs.map((job, index) => (
          <JobRow key={index} job={job} />
        ))}
      </UI.Table.Tbody>
    </UI.Table>
  );
}
