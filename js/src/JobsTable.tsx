import React from "react";
import { useState } from "react";
import { Job } from "./generated/types";

import * as UI from "./UI";

function pad(num: number): string {
  return num.toString().padStart(2, "0");
}

function Timestamp({ ts }: { ts: number | null }) {
  if (ts == null) {
    return "";
  }

  const date = new Date(ts);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const time = date.toTimeString().replace(/ .*/, "");

  return (
    <>
      <span style={{ whiteSpace: "nowrap" }}>
        {year}-{month}-{day}
      </span>{" "}
      {time}
    </>
  );
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
      <UI.Table.Td>
        <Timestamp ts={job.time_created} />
      </UI.Table.Td>
      <UI.Table.Td>
        <Timestamp ts={job.time_started} />
      </UI.Table.Td>
      <UI.Table.Td>
        <Timestamp ts={job.time_finished} />
      </UI.Table.Td>
      <UI.Table.Td>{job.errors ?? "-"}</UI.Table.Td>
    </UI.Table.Tr>
  );
}

const JOBS_PER_PAGE = 100;

export function JobsTable({ jobs }: { jobs: Array<Job> }) {
  const [page, setPage] = useState<number>(1);
  const pageCount = Math.ceil(jobs.length / JOBS_PER_PAGE);

  const firstIndex = JOBS_PER_PAGE * (page - 1);
  const slice = jobs.slice(firstIndex, firstIndex + JOBS_PER_PAGE);
  return (
    <>
      <UI.Pagination total={pageCount} value={page} onChange={setPage} />
      <UI.Table stickyHeader highlightOnHover>
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
          {slice.map((job, index) => (
            <JobRow key={index} job={job} />
          ))}
        </UI.Table.Tbody>
      </UI.Table>
    </>
  );
}
