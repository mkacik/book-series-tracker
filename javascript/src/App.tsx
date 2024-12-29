import React from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AddSeriesResult,
  GetAllBooksResult,
  GetAllSeriesResult,
  GetAllJobsResult,
} from "./generated/types";
import { SectionHeader } from "./common";
import { Books } from "./Books";
import { Series } from "./Series";
import { Jobs } from "./Jobs";
import logoImg from "./images/logo.png";

enum BackendRoute {
  Jobs = "/api/jobs",
  Books = "/api/books",
  Series = "/api/series",
}

enum Route {
  Default = "/",
  Jobs = "/jobs",
}

function SiteHeader() {
  // <img src={logoImg} width="200" height="auto" alt="Logo" />
  return (
    <header>
      <hgroup>
        <h1>Book Series Tracker</h1>
      </hgroup>
    </header>
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
  // navigation
  const [route, setRoute] = useState<Route>(getRouteFromURL());

  const setActiveRoute = (newRoute: Route): void => {
    let url = new URL(newRoute, window.location.origin);
    history.pushState({}, "", url);
    setRoute(newRoute);
  };

  // backend data
  const [books, setBooks] = useState<GetAllBooksResult>(null);
  const [series, setSeries] = useState<GetAllSeriesResult>(null);
  const [jobs, setJobs] = useState<GetAllJobsResult>(null);

  const fetchAndSetBooks = () => {
    fetch(BackendRoute.Books)
      .then((response) => response.json())
      .then((result) => {
        setBooks(result as GetAllBooksResult);
      });
  };

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
        setJobs(result as GetAllJobsResult);
      });
  };

  if (books == null) {
    fetchAndSetBooks();
  }

  if (series == null) {
    fetchAndSetSeries();
  }

  if (jobs == null) {
    fetchAndSetJobs();
  }

  const addSeries = (asin: string): void => {
    fetch(BackendRoute.Series, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ asin: asin }),
    }).then((response) => response.json())
      .then((result) => {
        if (result.job_id != null) {
          fetchAndSetJobs();
          alert("Successfully submitted job " + result.job_id +
            ". Go to Jobs tab to check progress.");
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
      console.log(response);
      if (response.ok) {
        fetchAndSetBooks();
        fetchAndSetSeries();
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
      console.log(response);
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
          <Jobs jobs={jobs} />
        </Page>
      </div>
    </div>
  );
}

const domContainer = document.querySelector("#root");
const root = createRoot(domContainer);
root.render(<App />);
