use anyhow;
use std::collections::HashMap;
use std::error::Error;
use thirtyfour::prelude::*;

use crate::books::Book;
use crate::database::Database;
use crate::scraper::series::{scrape_series_page, ScrapeSeriesPageResult};

const POST_CLICK_WAIT_SECONDS: u64 = 10;

pub async fn scrape_and_save(db: &Database, asin: String) -> anyhow::Result<()> {
    let local_books: HashMap<String, Book> = Book::fetch_by_series_asin(db, &asin)
        .await?
        .into_iter()
        .map(|book| (String::from(&book.asin), book))
        .collect();

    let result = match set_up_and_scrape_series_page(asin).await {
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

async fn get_webdriver() -> Result<WebDriver, WebDriverError> {
    let mut capabilities = DesiredCapabilities::firefox();
    capabilities.set_headless()?;

    WebDriver::new("http://localhost:4444", capabilities).await
}

fn get_amazon_series_url(series_asin: &str) -> String {
    format!("https://www.amazon.com/dp/{}", series_asin).to_string()
}

async fn set_up_and_scrape_series_page(
    asin: String,
) -> Result<ScrapeSeriesPageResult, Box<dyn Error + Send + Sync>> {
    let driver = get_webdriver().await?;
    let url = get_amazon_series_url(&asin);
    let result = scrape_series_page(&driver, url, asin, POST_CLICK_WAIT_SECONDS).await;
    // regardless wether parsing was sucessful or not, need to clean up the browser window we used
    driver.quit().await?;

    result
}
