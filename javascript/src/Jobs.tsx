import React from "react";
import { Job, GetAllJobsResult } from "./generated/types";

export function isJobProcessing(job: Job) {
  return ["QUEUED", "PROCESSING"].includes(job.status);
}

export function isJobSuccessful(job: Job) {
  return job.status == "SUCCESSFUL";
}

function formatTimestamp(ts: number) {
  if (ts == null) {
    return "";
  }

  let date = new Date(ts);
  return date
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d\d\dZ$/, "");
}

function JobRow({ job }: { job: Job }) {
  let duration_ms =
    job.time_started && job.time_finished
      ? (job.time_finished - job.time_started) / 1000
      : "";

  return (
    <tr>
      <td>{job.id}</td>
      <td>{job.params}</td>
      <td>{job.status}</td>
      <td>{duration_ms}</td>
      <td>{job.errors}</td>
      <td>{formatTimestamp(job.time_created)}</td>
      <td>{formatTimestamp(job.time_started)}</td>
      <td>{formatTimestamp(job.time_finished)}</td>
    </tr>
  );
}

export function Jobs({ jobs }: { jobs: GetAllJobsResult }) {
  if (jobs == null) {
    return null;
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Params</th>
            <th>Status</th>
            <th>Duration (s)</th>
            <th>Errors</th>
            <th>Time Job Created</th>
            <th>Time Processing Started</th>
            <th>Time Processing Finished</th>
          </tr>
        </thead>
        <tbody>
          {jobs.jobs.map((job, index) => (
            <JobRow key={index} job={job} />
          ))}
        </tbody>
      </table>
    </>
  );
}
