import { Job } from "./generated/types";

export function isJobProcessing(job: Job) {
  return ["QUEUED", "PROCESSING"].includes(job.status);
}
