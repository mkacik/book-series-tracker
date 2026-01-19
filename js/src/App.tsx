import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  AddSeriesResult,
  Book,
  BookSeries,
  GetAllBooksResult,
  GetAllSeriesResult,
  GetAllJobsResult,
  Job,
} from "./generated/types";
import { SectionHeader } from "./common";
import { isJobProcessing } from "./JobList";
import {
  BackendRoute,
  Route,
  RouteLink,
  RouteNotFound,
  usePathname,
} from "./Navigation";
import { BooksPage } from "./BooksPage";
import { JobsPage } from "./JobsPage";

function SiteHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="header">
      <h1>Book Series Tracker</h1>
      <span className="header-filler" />
      {children}
    </header>
  );
}

function AccountSection({ user }: { user: string | null }) {
  if (user === null) {
    return (
      <span>
        <a href="login">Login</a>
      </span>
    );
  }
  return (
    <span>
      Hi {user}! <a href="logout">Logout</a>
    </span>
  );
}

function App() {
  // UI state
  const route = usePathname();

  // logged-in user
  const [user, setUser] = useState<string | null>(null);

  const fetchUser = () => {
    fetch(BackendRoute.User)
      .then((response) => response.json())
      .then((result) => {
        const user = result as { username: string };
        setUser(user.username);
      });
  };

  // backend data
  const [books, setBooks] = useState<Array<Book>>([]);
  const [series, setSeries] = useState<Array<BookSeries>>([]);
  const [jobs, setJobs] = useState<Array<Job>>([]);

  const fetchBooksAndSeries = () => {
    fetch(BackendRoute.Books)
      .then((response) => response.json())
      .then((result) => {
        const booksResult = result as GetAllBooksResult;
        setBooks(booksResult.books);
      });

    fetch(BackendRoute.Series)
      .then((response) => response.json())
      .then((result) => {
        const seriesResult = result as GetAllSeriesResult;
        setSeries(seriesResult.series);
      });
  };

  const fetchJobs = () => {
    fetch(BackendRoute.Jobs)
      .then((response) => response.json())
      .then((result) => {
        const jobsResult = result as GetAllJobsResult;
        const newJobs = jobsResult.jobs;

        // on any job state transition to done, refetch series and books. Don't need
        // to compare job by job, count of processing jobs is enough.
        if (jobs != null) {
          const oldProcessingCount = jobs.filter(isJobProcessing).length;
          const newProcessingCount = newJobs.filter(isJobProcessing).length;
          if (oldProcessingCount > newProcessingCount) {
            fetchBooksAndSeries();
          }
        }

        setJobs(newJobs);
      });
  };

  useEffect(() => {
    fetchUser();
    fetchBooksAndSeries();
    fetchJobs();
  }, []);

  useEffect(() => {
    if (jobs.length === 0) {
      return;
    }

    let intervalID = null;
    const shouldRefresh = jobs.some(isJobProcessing);

    if (shouldRefresh) {
      intervalID = setInterval(fetchJobs, 5000);
    }

    return () => {
      if (intervalID != null) {
        clearInterval(intervalID);
      }
    };
  }, [jobs]);

  const getPageContent = () => {
    switch (route) {
      case Route.Books:
        return (
          <BooksPage
            books={books}
            series={series}
            refreshBooksAndSeries={fetchBooksAndSeries}
            refreshJobs={fetchJobs}
          />
        );
      case Route.Jobs:
        return <JobsPage jobs={jobs} refreshJobs={fetchJobs} />;
      default:
        return <RouteNotFound />;
    }
  };

  return (
    <div>
      <SiteHeader>
        <AccountSection user={user} />
      </SiteHeader>
      <div>
        <RouteLink route={Route.Books}>Books</RouteLink>
        <RouteLink route={Route.Jobs}>Jobs</RouteLink>
      </div>
      <hr />
      <div>{getPageContent()}</div>
    </div>
  );
}

const domContainer = document.querySelector("#root");
const root = createRoot(domContainer);
root.render(<App />);
