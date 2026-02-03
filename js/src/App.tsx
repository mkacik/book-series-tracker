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
import { User } from "./User";
import { isJobProcessing } from "./Job";
import { BackendRoute, Route, RouteLink, usePathname } from "./Navigation";
import { BooksPage } from "./BooksPage";
import { SeriesPage } from "./SeriesPage";
import { JobsPage } from "./JobsPage";
import { LoginSection, LogoutSection } from "./LoginSection";
import {
  AppSettings,
  AppSettingsButton,
  AppSettingsContext,
  getAppSettingsProvider,
} from "./AppSettings";

import * as UI from "./UI";

function App() {
  const route = usePathname();
  const settingsProvider = getAppSettingsProvider();

  const [settings, setSettings] = useState<AppSettings>(
    settingsProvider.getSettings(),
  );

  const updateSettings = (settings: AppSettings) => {
    settingsProvider.saveSettings(settings);
    setSettings(settings);
  };

  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Array<Book>>([]);
  const [series, setSeries] = useState<Array<BookSeries>>([]);
  const [jobs, setJobs] = useState<Array<Job>>([]);

  const fetchUser = async () => {
    try {
      const response = await fetch(BackendRoute.User);
      if (!response.ok) {
        throw new Error();
      }

      const result = await response.json();
      if (!result.hasOwnProperty("username")) {
        throw new Error();
      }

      const user = result as { username: string };
      setUser(new User(user.username));
    } catch (_error) {
      setUser(new User(null));
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

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
    fetchBooksAndSeries();
    fetchJobs();
  }, [user]);

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

  const userLoggedIn = user !== null && user.isLoggedIn();

  const getPageContent = () => {
    if (user === null) {
      return <UI.PageLoading />;
    }

    if (!userLoggedIn) {
      return <LoginSection setUser={setUser} />;
    }

    switch (route) {
      case Route.Books:
        return (
          <BooksPage
            books={books}
            series={series}
            refreshBooks={fetchBooksAndSeries}
          />
        );
      case Route.Series:
        return (
          <SeriesPage
            series={series}
            refreshBooksAndSeries={fetchBooksAndSeries}
            refreshJobs={fetchJobs}
          />
        );
      case Route.Jobs:
        return <JobsPage jobs={jobs} refreshJobs={fetchJobs} />;
      // break omitted: fallback to 404
      default:
        return <UI.PageNotFound />;
    }
  };

  const routeLinks = userLoggedIn && (
    <>
      <RouteLink route={Route.Books}>Books</RouteLink>
      <RouteLink route={Route.Series}>Series</RouteLink>
      <RouteLink route={Route.Jobs}>Jobs</RouteLink>
    </>
  );

  return (
    <UI.Layout>
      <UI.Header>
        <UI.Title order={3}>Book Series Tracker</UI.Title>

        {routeLinks}

        <UI.Flex gap="sm" ml="auto" align="center">
          <AppSettingsButton
            settings={settings}
            updateSettings={updateSettings}
          />
          <LogoutSection user={user} setUser={setUser} />
        </UI.Flex>
      </UI.Header>

      <UI.Main>
        <AppSettingsContext value={settings}>
          {getPageContent()}
        </AppSettingsContext>
      </UI.Main>
    </UI.Layout>
  );
}

const domContainer = document.querySelector("#root");
const root = createRoot(domContainer);
root.render(<App />);
