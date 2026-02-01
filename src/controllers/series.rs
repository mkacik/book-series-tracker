use regex::Regex;
use rocket::State;
use std::sync::Arc;

use crate::database::Database;
use crate::job_server::JobServer;
use crate::response::ApiResponse;
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
pub async fn add(job_server: &State<Arc<JobServer>>, _user: &User, asin: &str) -> ApiResponse {
    if !looks_like_asin(asin) {
        return ApiResponse::BadRequest {
            message: format!("'{}' does not look like asin", asin),
        };
    }

    match job_server.add_job(String::from(asin)).await {
        Ok(job_id) => ApiResponse::from_object(AddSeriesResult { job_id: job_id }),
        Err(error) => ApiResponse::from_error(error),
    }
}

#[delete("/series/<asin>")]
pub async fn remove(db: &State<Arc<Database>>, _user: &User, asin: &str) -> ApiResponse {
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

pub fn looks_like_asin(asin: &str) -> bool {
    let re = Regex::new(r"^B[A-Z0-9]{9}$").unwrap();

    re.is_match(asin)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_looks_like_asin_ok() {
        assert!(looks_like_asin("B09FSCHFGK").is_ok());
        assert!(looks_like_asin(" B09FSCHFGK ").is_err());
        assert!(looks_like_asin("some other text").is_err());
    }
}
