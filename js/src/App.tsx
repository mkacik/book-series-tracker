import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  AddSeriesResult,
  Book,
  GetAllBooksResult,
  GetAllSeriesResult,
  GetAllJobsResult,
} from "./generated/types";
import { SectionHeader } from "./common";
import { Books } from "./Books";
import { Series } from "./Series";
import { Jobs, isJobSuccessful, isJobProcessing } from "./Jobs";

enum BackendRoute {
  User = "/api/me",
  Jobs = "/api/jobs",
  Books = "/api/books",
  Series = "/api/series",
}

enum Route {
  Default = "/",
  Jobs = "/jobs",
}

function SiteHeader() {
  return (
    <header className="header">
      <h1>Book Series Tracker</h1>
      <span className="header-filler" />
      <AccountSection />
    </header>
  );
}

function AccountSection() {
  const [username, setUsername] = useState<string | null>(null);

  const fetchUsername = () => {
    fetch(BackendRoute.User)
      .then((response) => response.json())
      .then((result) => {
        const user = result as { username: string };
        setUsername(user.username);
      });
  };

  useEffect(() => {
    fetchUsername();
  }, []);

  if (username === null) {
    return (
      <span>
        <a href="login">Login</a>
      </span>
    );
  }
  return (
    <span>
      Hi {username}! <a href="logout">Logout</a>
    </span>
  );
}

function Page({
  show,
  children,
}: {
  show: boolean;
  children?: React.ReactNode;
}) {
  return <>{show ? children : null}</>;
}

function getRouteFromURL(): Route {
  let path = window.location.pathname;

  if (path == Route.Jobs) {
    return Route.Jobs;
  }
  if (path != Route.Default) {
    let url = new URL(Route.Default, window.location.origin);
    history.replaceState({}, "", url);
  }
  return Route.Default;
}

function App() {
  // UI state
  const [route, setRoute] = useState<Route>(getRouteFromURL());

  // backend data
  const [books, setBooks] = useState<Array<Book>>([]);
  const [series, setSeries] = useState<GetAllSeriesResult>(null);
  const [jobs, setJobs] = useState<GetAllJobsResult>(null);

  const setActiveRoute = (newRoute: Route): void => {
    let url = new URL(newRoute, window.location.origin);
    history.pushState({}, "", url);
    setRoute(newRoute);
  };

  const fetchAndSetBooks = () => {
    fetch(BackendRoute.Books)
      .then((response) => response.json())
      .then((result) => {
        const booksResult = result as GetAllBooksResult;
        setBooks(booksResult.books);
      });
  };

  useEffect(() => {
    fetchAndSetBooks();
  }, []);

  const fetchAndSetSeries = () => {
    fetch(BackendRoute.Series)
      .then((response) => response.json())
      .then((result) => {
        setSeries(result as GetAllSeriesResult);
      });
  };

  const fetchAndSetJobs = () => {
    fetch(BackendRoute.Jobs)
      .then((response) => response.json())
      .then((result) => {
        const newJobs = result as GetAllJobsResult;

        // on any job state transition to successful, refetch series and books. Don't need
        // to compare job by job, count of successful jobs is enough.
        if (jobs != null) {
          const oldJobsSuccessCount = jobs.jobs.filter(isJobSuccessful).length;
          const newJobsSuccessCount =
            newJobs.jobs.filter(isJobSuccessful).length;
          if (newJobsSuccessCount > oldJobsSuccessCount) {
            fetchAndSetSeries();
            fetchAndSetBooks();
          }
        }

        setJobs(newJobs);
      });
  };

  if (series == null) {
    fetchAndSetSeries();
  }

  useEffect(() => {
    if (jobs == null) {
      fetchAndSetJobs();
      return () => {};
    }

    let intervalID = null;
    let shouldRefresh = jobs.jobs.some(isJobProcessing);

    if (shouldRefresh) {
      intervalID = setInterval(fetchAndSetJobs, 5000);
    }

    return () => {
      if (intervalID != null) {
        clearInterval(intervalID);
      }
    };
  }, [jobs, fetchAndSetJobs]);

  const addSeries = (asin: string): void => {
    fetch(BackendRoute.Series, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ asin: asin }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.job_id != null) {
          fetchAndSetJobs();
          alert(
            "Successfully submitted job " +
              result.job_id +
              ". Go to Jobs tab to check progress.",
          );
        } else {
          alert("Error while submitting job: " + result.error);
        }
      });
  };

  const deleteSeries = (asin: string): void => {
    fetch(BackendRoute.Series, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ asin: asin }),
    }).then((response) => {
      if (response.ok) {
        fetchAndSetBooks();
        fetchAndSetSeries();
      }
    });
  };

  const deleteAllJobs = (event: React.SyntheticEvent): void => {
    event.preventDefault();

    if (
      confirm(
        "Do you really want to delete all finished jobs from database?",
      ) != true
    ) {
      return;
    }

    fetch(BackendRoute.Jobs, {
      method: "DELETE",
    }).then((response) => {
      if (response.ok) {
        fetchAndSetJobs();
      }
    });
  };

  const triggerScrapeForAllSeries = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    if (confirm("Do you really want to trigger the scrape?") != true) {
      return;
    }

    fetch(BackendRoute.Jobs, {
      method: "POST",
    }).then((response) => {
      if (response.ok) {
        fetchAndSetJobs();
      }
    });
  };

  return (
    <div>
      <SiteHeader />
      <div>
        <button onClick={() => setActiveRoute(Route.Default)}>Books</button>
        <button onClick={() => setActiveRoute(Route.Jobs)}>Jobs</button>
      </div>
      <hr />
      <div>
        <Page show={route == Route.Default}>
          <SectionHeader sectionName={"Upcoming Books"} />
          <Books books={books} />
          <SectionHeader sectionName={"Tracked Series"} />
          <Series
            series={series}
            addSeriesHandler={addSeries}
            deleteSeriesHandler={deleteSeries}
          />
        </Page>
        <Page show={route == Route.Jobs}>
          <SectionHeader sectionName={"Jobs"} />
          <button type="submit" onClick={triggerScrapeForAllSeries}>
            Start scrape for all tracked series
          </button>
          <button type="submit" onClick={deleteAllJobs}>
            Delete job history from database
          </button>
          <Jobs jobs={jobs} />
        </Page>
      </div>
    </div>
  );
}

const domContainer = document.querySelector("#root");
const root = createRoot(domContainer);
root.render(<App />);
