use std::error::Error;
use std::time::Duration;
use thirtyfour::prelude::*;
use thirtyfour::support::sleep;

use crate::scraper::common::parse_date;

pub struct ScrapeBookPageResult {
    pub release_date: String,
}

pub async fn scrape_book_page(
    driver: &WebDriver,
    url: String,
    sleep_seconds: u64,
) -> Result<ScrapeBookPageResult, Box<dyn Error + Send + Sync>> {
    driver.goto(url).await?;

    // 0. Sleep to let remote content load
    sleep(Duration::new(sleep_seconds, 0)).await;

    // 1. Find wrapper for "Product details". also, fuck'em for reusing element ids.
    let section = driver
        .find(By::Id("detailBulletsWrapper_feature_div"))
        .await?;

    // 2. Actual book data is stored in a list with no annotations
    let items = section.find_all(By::Tag("li")).await?;

    // 3. Fourth list item denotes publication date
    let item = &items[3];

    // 4. Publication date is stored in last span
    let spans = item.find_all(By::Tag("span")).await?;
    let span = match spans.last() {
        Some(value) => value,
        None => return Err("Publication date span missing.".into()),
    };

    let maybe_release_date = span.inner_html().await?;
    log::debug!("Book release date: '{}'", &maybe_release_date);
    let release_date = parse_date(maybe_release_date)?;

    let result = ScrapeBookPageResult {
        release_date: release_date,
    };

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env::current_dir;
    use tokio;

    #[tokio::test]
    #[ignore = "requires geckodriver running; run with --ignored --test-threads=1"]
    async fn test_scrape_book_page() {
        let mut caps = DesiredCapabilities::firefox();
        caps.set_browser_connection_enabled(false).unwrap();

        let driver = match WebDriver::new("http://localhost:4444", caps).await {
            Ok(val) => val,
            Err(err) => panic!("{}", err),
        };

        let cwd = current_dir().unwrap();

        let url = format!("file:///{}/sanitizer/book_out.html", cwd.display());

        let maybe_result = scrape_book_page(&driver, url.to_string(), 0).await;

        driver.quit().await.unwrap();

        assert!(maybe_result.is_ok());
        let result = maybe_result.unwrap();

        assert_eq!(result.release_date, "2021-09-19");
    }
}
