import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Book,
  BookSeries,
  GetAllBooksResult,
  GetAllSeriesResult,
  GetAllJobsResult,
  Job,
} from "./generated/types";
import { User, UserContext } from "./User";
import { isJobProcessing } from "./Job";
import {
  BackendRoute,
  Route,
  RouteLink,
  RouteNotFound,
  usePathname,
} from "./Navigation";
import { BooksPage } from "./BooksPage";
import { SeriesPage } from "./SeriesPage";
import { JobsPage } from "./JobsPage";
import { LoginSection } from "./LoginSection";

import * as UI from "./UI";

function App() {
  const route = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Array<Book>>([]);
  const [series, setSeries] = useState<Array<BookSeries>>([]);
  const [jobs, setJobs] = useState<Array<Job>>([]);

  const fetchUser = () => {
    fetch(BackendRoute.User)
      .then((response) => response.json())
      .then((result) => {
        const user = result as { username: string };
        setUser(new User(user.username));
      })
      .catch((_error) => {
        setUser(new User(null));
      });
  };

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

  const showJobsPage = user !== null && user.isLoggedIn();

  const getPageContent = () => {
    if (user === null) {
      return "Loading...";
    }

    switch (route) {
      case Route.Books:
        return (
          <UserContext value={user}>
            <BooksPage books={books} />
          </UserContext>
        );
      case Route.Series:
        return (
          <UserContext value={user}>
            <SeriesPage
              series={series}
              refreshBooksAndSeries={fetchBooksAndSeries}
              refreshJobs={fetchJobs}
            />
          </UserContext>
        );
      case Route.Jobs:
        if (showJobsPage) {
          return <JobsPage jobs={jobs} refreshJobs={fetchJobs} />;
        }
      // break omitted: fallback to 404
      default:
        return <RouteNotFound />;
    }
  };

  return (
    <UI.Layout>
      <UI.Header>
        <UI.Title order={3}>Book Series Tracker</UI.Title>

        <RouteLink route={Route.Books}>Books</RouteLink>
        <RouteLink route={Route.Series}>Series</RouteLink>
        {showJobsPage && <RouteLink route={Route.Jobs}>Jobs</RouteLink>}

        <UI.Flex gap="sm" ml="auto" align="center">
          <LoginSection user={user} setUser={setUser} />
        </UI.Flex>
      </UI.Header>

      <UI.Main>{getPageContent()}</UI.Main>
    </UI.Layout>
  );
}

const domContainer = document.querySelector("#root");
const root = createRoot(domContainer);
root.render(<App />);
