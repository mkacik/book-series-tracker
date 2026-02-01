use anyhow;
use chrono::Month;
use log;
use regex::Regex;
use std::collections::HashMap;
use std::error::Error;
use std::time::Duration;
use thirtyfour::prelude::*;
use thirtyfour::support::sleep;

use crate::books::Book;
use crate::common::now;
use crate::database::Database;
use crate::series::BookSeries;

const POST_CLICK_WAIT_SECONDS: u64 = 10;

struct ScrapeSeriesPageResult {
    series: BookSeries,
    books: Vec<Book>,
}

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

async fn scrape_series_page(
    driver: &WebDriver,
    url: String,
    series_asin: String,
    sleep_seconds: u64,
) -> Result<ScrapeSeriesPageResult, Box<dyn Error + Send + Sync>> {
    driver.goto(url).await?;
    // 0. Sleep to let remote content load
    sleep(Duration::new(sleep_seconds, 0)).await;

    // 1. Click on "Show All", if present, by id: seriesAsinListShowAll_textSection
    match driver
        .find(By::Id("seriesAsinListShowAll_textSection"))
        .await
    {
        Ok(elem_show_all_section) => {
            let elem_show_all_link = elem_show_all_section.query(By::Tag("a")).first().await?;
            let _ = elem_show_all_link.scroll_into_view().await;
            sleep(Duration::new(sleep_seconds, 0)).await;

            let _ = elem_show_all_link.click().await;

            // 1a. Sleep to let remote content load
            sleep(Duration::new(sleep_seconds, 0)).await;
        }
        Err(_) => {}
    }

    // 2. Extract series title by id: collection-titler
    let elem_series_name = driver.find(By::Id("collection-title")).await?;
    let series_name = sanitize_string(elem_series_name.inner_html().await?);

    // 3. Find all children by class name: series-childAsin-item
    let elem_all_books = driver
        .query(By::ClassName("series-childAsin-item"))
        .all_from_selector()
        .await?;
    log::debug!(
        "Found {} books for series: {}",
        elem_all_books.len(),
        &series_name
    );

    let mut books: Vec<Book> = Vec::new();
    // 4. For each child:
    for elem_book in elem_all_books.iter() {
        // 4a. Find release date, by class name: a-color-success. If missing, book already has been
        // released, and date is not available on this page.
        let release_date = match elem_book.find(By::ClassName("a-color-success")).await {
            Ok(elem_release_date) => {
                let maybe_release_date = elem_release_date.inner_html().await?;
                log::debug!("Book release date: '{}'", &maybe_release_date);
                let release_date = parse_date(maybe_release_date).unwrap();

                Some(release_date)
            }
            Err(_) => None,
        };

        // 4b. Find ordinal by class name: series-childAsin-count
        let elem_ordinal = elem_book
            .find(By::ClassName("series-childAsin-count"))
            .await?;
        let ordinal_string = sanitize_string(strip_tags(elem_ordinal.inner_html().await?));
        let ordinal: u32 = ordinal_string.parse().unwrap();
        log::debug!("Book ordinal: '{}'", &ordinal);

        // 4c. Find title by class name: itemBookTitle or id itemBookTitle_$ordinal
        let elem_title = elem_book.find(By::ClassName("itemBookTitle")).await?;
        let title = sanitize_string(strip_tags(elem_title.inner_html().await?));
        log::debug!("Book title: '{}'", &title);

        // 4d. Find asin by parsing it out of title href
        let link = elem_title.attr("href").await?.unwrap();
        let asin = extract_asin(sanitize_string(link));
        log::debug!("Book asin: '{}'", &asin);

        // 4e. Find authors by class name: series-childAsin-item-details-contributor
        // watch out for Amazon formatting, it adds commas to the names in right places, so just
        // join them afterwards.
        let elem_authors = elem_book
            .query(By::ClassName("series-childAsin-item-details-contributor"))
            .all_from_selector()
            .await?;
        log::debug!("Found {} authors for book: {}", &elem_authors.len(), &title);

        let mut authors_vec = Vec::new();
        for elem_author in elem_authors.iter() {
            let author = sanitize_string(elem_author.inner_html().await?);
            authors_vec.push(author);
        }
        let authors: String = authors_vec.join(", ");
        log::debug!("Book authors: '{}'", &authors);

        let book = Book {
            asin: asin,
            series_asin: series_asin.clone(),
            ordinal: ordinal,
            title: title,
            author: authors,
            release_date: release_date,
            time_first_seen: now(),
        };
        books.push(book);
    }

    Ok(ScrapeSeriesPageResult {
        series: BookSeries {
            name: series_name,
            asin: series_asin,
            time_first_seen: now(),
        },
        books: books,
    })
}

fn get_amazon_series_url(series_asin: &str) -> String {
    format!("https://www.amazon.com/dp/{}", series_asin).to_string()
}

fn sanitize_string(input: String) -> String {
    let mut trimmed = input.trim();
    trimmed = match trimmed.strip_suffix(",") {
        None => trimmed,
        Some(s) => s,
    };

    trimmed.trim().to_string()
}

// URL format: "/gp/product/B0DLX35C16?ref_=dbs_m_mng_rwt_calw_tkin_24&storeType=ebooks"
fn extract_asin(url: String) -> String {
    let url_parts: Vec<&str> = url.split("?").collect();
    let path = url_parts.first().unwrap();
    let path_parts: Vec<&str> = path.split("/").collect();
    let asin = path_parts.last().unwrap();

    asin.to_string()
}

fn parse_date(string: String) -> Result<String, Box<dyn Error + Send + Sync>> {
    let parts: Vec<&str> = string.split(" ").collect();

    if parts.len() != 3 {
        return Err("Incorrect date")?;
    }

    let (maybe_month, maybe_day, maybe_year) = (parts[0], parts[1], parts[2]);

    let month: u32 = maybe_month.parse::<Month>()?.number_from_month();
    let day: u32 = maybe_day[0..maybe_day.len() - 1].parse()?;
    let year: u32 = maybe_year.parse()?;
    if (day > 31) || (year > 2100) {
        return Err("Incorrect date")?;
    }
    let date = format!("{}-{:0>2}-{:0>2}", year, month, day);

    Ok(date)
}

// I can grab some elements by id/class name, but the formatting inside changes day by day.
// To avoid trying to guess the next step of page editors, I will just strip all tags away of
// whatever html is there, hoping to get at equivalent of innerText of innermost elements.
fn strip_tags(string: String) -> String {
    let re = Regex::new(r"<[^>]+>").unwrap();

    re.replace_all(&string, "").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env::current_dir;
    use tokio;

    #[test]
    fn test_parse_date_err() {
        assert!(parse_date("".to_string()).is_err());
        assert!(parse_date("Not a date".to_string()).is_err());
        assert!(parse_date("November 66, 15670".to_string()).is_err());
    }

    #[test]
    fn test_parse_date_ok() {
        let cases = vec![
            ("November 10, 2024", "2024-11-10"),
            ("January 19, 2025", "2025-01-19"),
            ("February 31, 2023", "2023-02-31"),
        ];

        for (input, expected_result) in cases.into_iter() {
            let result = parse_date(String::from(input));
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), expected_result);
        }
    }

    #[test]
    fn test_sanitize_string_author() {
        let author = "\n                J.N. Chaney (Author)\n                ,\n            ";
        assert_eq!(sanitize_string(author.to_string()), "J.N. Chaney (Author)");
    }

    #[test]
    fn test_sanitize_string() {
        assert_eq!(sanitize_string(String::from("    25     \n")), "25");
    }

    #[test]
    fn test_strip_tags() {
        let cases = vec![
            (
                "<h3 class=\"a-text-normal\">Fist of Orion (Backyard Starship Book 25)</h3>",
                "Fist of Orion (Backyard Starship Book 25)",
            ),
            (
                "<h3 class=\"a-text-normal\"><b>Fist of Orion</b> (Backyard Starship Book 25)</h3>",
                "Fist of Orion (Backyard Starship Book 25)",
            ),
            (
                "Fist of Orion (Backyard Starship Book 25)",
                "Fist of Orion (Backyard Starship Book 25)",
            ),
        ];

        for (input, expected_result) in cases.into_iter() {
            let result = strip_tags(String::from(input));
            assert_eq!(result, expected_result);
        }
    }

    #[test]
    fn test_extract_asin() {
        let link = "/gp/product/B0DLX35C16?ref_=dbs_m_mng_rwt_calw_tkin_24&storeType=ebooks";
        assert_eq!(extract_asin(link.to_string()), "B0DLX35C16");
    }

    #[tokio::test]
    #[ignore = "requires geckodriver running"]
    async fn test_scrape_series_page() {
        let caps = DesiredCapabilities::firefox();
        let driver = match WebDriver::new("http://localhost:4444", caps).await {
            Ok(val) => val,
            Err(err) => panic!("{}", err),
        };

        let cwd = current_dir().unwrap();

        let url = format!("file:///{}/sanitizer/output.html", cwd.display());
        let series_asin = "TESTASIN";

        let maybe_result =
            scrape_series_page(&driver, url.to_string(), series_asin.to_string(), 0).await;

        driver.quit().await.unwrap();

        assert!(maybe_result.is_ok());
        let result = maybe_result.unwrap();

        assert_eq!(result.series.name, "Backyard Starship");
        assert_eq!(result.series.asin, series_asin);
        assert_eq!(result.books.len(), 31);
    }
}
