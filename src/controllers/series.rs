use regex::Regex;
use rocket::State;
use std::sync::Arc;

use crate::database::Database;
use crate::response::ApiResponse;
use crate::scraper::job::{Job, JobParams};
use crate::series::{AddSeriesResult, BookSeries};
use crate::subscriptions::Subscription;
use crate::user::User;

#[get("/series")]
pub async fn get_all(db: &State<Arc<Database>>, user: &User) -> ApiResponse {
    match BookSeries::fetch_by_user(db, user).await {
        Ok(result) => ApiResponse::from_object(result),
        Err(error) => ApiResponse::from_error(error),
    }
}

#[post("/series/<asin>")]
pub async fn add(db: &State<Arc<Database>>, user: &User, asin: &str) -> ApiResponse {
    if !looks_like_asin(asin) {
        return ApiResponse::BadRequest {
            message: format!("'{}' does not look like asin", asin),
        };
    }

    let params = JobParams::Series {
        asin: asin.to_string(),
    };
    match Job::add(db, params, Some(user)).await {
        Ok(job_id) => ApiResponse::from_object(AddSeriesResult { job_id: job_id }),
        Err(error) => ApiResponse::from_error(error),
    }
}

#[delete("/series/<asin>")]
pub async fn remove(db: &State<Arc<Database>>, asin: &str) -> ApiResponse {
    if BookSeries::fetch_by_asin(db, asin).await.is_err() {
        return ApiResponse::BadRequest {
            message: String::from("Series does not exist!"),
        };
    }

    match BookSeries::delete_by_asin(db, asin).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}

#[post("/series/subscribe/<asin>")]
pub async fn subscribe(db: &State<Arc<Database>>, user: &User, asin: &str) -> ApiResponse {
    if BookSeries::fetch_by_asin(db, asin).await.is_err() {
        return ApiResponse::BadRequest {
            message: String::from("Series does not exist!"),
        };
    }

    match Subscription::add(db, user, asin).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}

#[post("/series/unsubscribe/<asin>")]
pub async fn unsubscribe(db: &State<Arc<Database>>, user: &User, asin: &str) -> ApiResponse {
    if BookSeries::fetch_by_asin(db, asin).await.is_err() {
        return ApiResponse::BadRequest {
            message: String::from("Series does not exist!"),
        };
    }

    match Subscription::remove(db, user, asin).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}

#[post("/series/all")]
pub async fn scrape_all(db: &State<Arc<Database>>, user: &User) -> ApiResponse {
    match enqueue_all_series(db, Some(user)).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}

pub async fn enqueue_all_series(db: &Database, user: Option<&User>) -> anyhow::Result<()> {
    let all_series = BookSeries::fetch_all(db).await?;
    for series in all_series {
        let params = JobParams::Series { asin: series.asin };
        Job::add(db, params, user).await?;
    }

    Ok(())
}

pub fn looks_like_asin(asin: &str) -> bool {
    let re = Regex::new(r"^B[A-Z0-9]{9}$").unwrap();

    re.is_match(asin)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_looks_like_asin() {
        assert!(looks_like_asin("B09FSCHFGK"));

        assert!(!looks_like_asin(" B09FSCHFGK "));
        assert!(!looks_like_asin("some other text"));
    }
}
