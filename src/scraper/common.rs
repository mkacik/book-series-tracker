use crate::database::Database;
use crate::scraper::job::Job;
use crate::series::BookSeries;
use crate::user::User;
use chrono::Month;
use std::error::Error;

pub async fn enqueue_all_series(db: &Database, user: Option<&User>) -> anyhow::Result<()> {
    let all_series = BookSeries::fetch_all(db).await?;
    for series in all_series {
        Job::add(db, series.asin, user).await?;
    }

    Ok(())
}

pub fn parse_date(string: String) -> Result<String, Box<dyn Error + Send + Sync>> {
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

#[cfg(test)]
mod tests {
    use super::*;

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
}
