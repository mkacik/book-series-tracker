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
import { GetUserResult, User } from "./User";
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

import { useMediaQuery } from "@mantine/hooks";
import { FetchHelper } from "./FetchHelper";

import * as UI from "./UI";

function App() {
  const isMobile = useMediaQuery(UI.IS_MOBILE_MEDIA_QUERY);
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

  const fetchHelper = new FetchHelper((_error) => {});

  const fetchUser = async () => {
    const onSuccess = (result: GetUserResult) =>
      setUser(new User(result.username));
    const onFailure = () => setUser(new User(null));

    await fetchHelper.fetch<GetUserResult>(
      new Request(BackendRoute.User),
      onSuccess,
      onFailure,
    );
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchBooksAndSeries = async () => {
    const promises = [
      fetchHelper.fetch<GetAllBooksResult>(
        new Request(BackendRoute.Books),
        (result) => setBooks(result.books),
      ),
      fetchHelper.fetch<GetAllSeriesResult>(
        new Request(BackendRoute.Series),
        (result) => setSeries(result.series),
      ),
    ];

    await Promise.all(promises);
  };

  const fetchJobs = async () => {
    await fetchHelper.fetch<GetAllJobsResult>(
      new Request(BackendRoute.Jobs),
      (result) => {
        const newJobs = result.jobs;

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
      },
    );
  };

  useEffect(() => {
    // user is only null while it is being initially fetched. In that case fetching
    // any data would fail either way, so only trigger data fetch once the user is
    // non null
    if (user !== null) {
      fetchBooksAndSeries();
      fetchJobs();
    }
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

    if (isMobile && route !== Route.Books) {
      return <UI.PageNotFound />;
    }

    switch (route) {
      case Route.Books:
        return (
          <BooksPage
            books={books}
            series={series}
            refreshBooks={fetchBooksAndSeries}
            isMobile={isMobile}
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

  const routeLinks = !isMobile && userLoggedIn && (
    <>
      <RouteLink route={Route.Books}>Books</RouteLink>
      <RouteLink route={Route.Series}>Series</RouteLink>
      <RouteLink route={Route.Jobs}>Jobs</RouteLink>
    </>
  );

  return (
    <UI.Layout isMobile={isMobile}>
      <UI.Header>
        <UI.Flex gap="0.4em" align="center">
          <UI.BooksIcon isMobile={isMobile} />
          <UI.Title order={3}>Book Series Tracker</UI.Title>
        </UI.Flex>

        {routeLinks}

        <UI.Flex gap="sm" ml="auto" align="center">
          <AppSettingsButton
            isMobile={isMobile}
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

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);
