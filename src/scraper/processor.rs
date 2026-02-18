use anyhow;
use std::collections::HashMap;
use std::error::Error;
use thirtyfour::prelude::*;

use crate::books::Book;
use crate::database::Database;
use crate::scraper::book::{scrape_book_page, ScrapeBookPageResult};
use crate::scraper::job::{Job, JobParams};
use crate::scraper::series::{scrape_series_page, ScrapeSeriesPageResult};
use crate::user::User;

const POST_CLICK_WAIT_SECONDS: u64 = 10;

pub async fn process(db: &Database, job: &Job) -> anyhow::Result<()> {
    let params = match serde_json::from_str::<JobParams>(&job.params) {
        Ok(params) => params,
        Err(_) => {
            return Err(anyhow::anyhow!(
                "Could not deserialize job params, version mismatch."
            ))
        }
    };

    match params {
        JobParams::Book { asin, .. } => process_book(db, &asin).await?,
        JobParams::Series { asin } => {
            process_series(db, &asin).await?;

            // TODO: figure out better way to pass user to child jobs
            let user: Option<User> = match &job.username {
                Some(username) => Some(User {
                    username: username.to_string(),
                }),
                None => None,
            };

            /* newly fetched books will have release date set, but ones previously
            released need dedicated scrape to fill in release date */
            let books = Book::fetch_by_series_asin(db, &asin).await?;
            for book in books.into_iter() {
                if book.release_date.is_none() {
                    let params = JobParams::Book {
                        asin: book.asin.to_string(),
                        parent: job.id,
                    };
                    Job::add(db, params, user.as_ref()).await?;
                }
            }
        }
    }

    Ok(())
}

async fn process_series(db: &Database, asin: &str) -> anyhow::Result<()> {
    let local_books: HashMap<String, Book> = Book::fetch_by_series_asin(db, asin)
        .await?
        .into_iter()
        .map(|book| (String::from(&book.asin), book))
        .collect();

    let result = match set_up_webdriver_and_scrape_series_page(asin).await {
        Ok(value) => value,
        Err(e) => return Err(anyhow::anyhow!(e)),
    };

    result.series.save(db).await?;

    for remote_book in result.books.iter() {
        if !local_books.contains_key(&remote_book.asin) {
            remote_book.save(db).await?;
        }
    }

    Ok(())
}

async fn process_book(db: &Database, asin: &str) -> anyhow::Result<()> {
    let release_date = match set_up_webdriver_and_scrape_book_page(asin).await {
        Ok(result) => result.release_date,
        Err(e) => return Err(anyhow::anyhow!(e)),
    };

    Book::update_release_date(&db, &asin, &release_date).await
}

async fn get_webdriver() -> Result<WebDriver, WebDriverError> {
    let mut capabilities = DesiredCapabilities::firefox();
    capabilities.set_headless()?;

    WebDriver::new("http://localhost:4444", capabilities).await
}

fn get_amazon_series_url(series_asin: &str) -> String {
    format!("https://www.amazon.com/dp/{}", series_asin).to_string()
}

async fn set_up_webdriver_and_scrape_series_page(
    asin: &str,
) -> Result<ScrapeSeriesPageResult, Box<dyn Error + Send + Sync>> {
    let driver = get_webdriver().await?;
    let url = get_amazon_series_url(&asin);
    let result = scrape_series_page(&driver, url, asin, POST_CLICK_WAIT_SECONDS).await;
    // regardless wether parsing was sucessful or not, need to clean up the browser window we used
    driver.quit().await?;

    result
}

fn get_amazon_book_url(series_asin: &str) -> String {
    format!("https://www.amazon.com/gp/product/{}", series_asin).to_string()
}

async fn set_up_webdriver_and_scrape_book_page(
    asin: &str,
) -> Result<ScrapeBookPageResult, Box<dyn Error + Send + Sync>> {
    let driver = get_webdriver().await?;
    let url = get_amazon_book_url(&asin);
    let result = scrape_book_page(&driver, url, POST_CLICK_WAIT_SECONDS).await;
    // regardless wether parsing was sucessful or not, need to clean up the browser window we used
    driver.quit().await?;

    result
}
