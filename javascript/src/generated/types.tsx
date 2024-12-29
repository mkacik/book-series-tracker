export type Book = {
  asin: string;
  series_asin: string;
  ordinal: number;
  title: string;
  author: string;
  day: number;
  month: number;
  year: number;
  time_first_seen: number;
};

export type GetAllBooksResult = {
  books: Book[];
};

export type BookSeries = {
  asin: string;
  name: string;
  time_first_seen: number;
};

export type GetAllSeriesResult = {
  series: BookSeries[];
};

export type AddSeriesResult = {
  job_id: number;
  error: string;
};

export type Job = {
  id: number;
  params: string;
  status: string;
  errors: string;
  time_created: number;
  time_started: number;
  time_finished: number;
};

export type GetAllJobsResult = {
  jobs: Job[];
};