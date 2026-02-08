use chrono::NaiveDate;
use rocket::State;
use std::sync::Arc;

use crate::books::Book;
use crate::database::Database;
use crate::reads::ReadState;
use crate::response::ApiResponse;
use crate::user::User;

#[get("/books")]
pub async fn get_all(db: &State<Arc<Database>>, user: &User) -> ApiResponse {
    match Book::fetch_by_user(db, user).await {
        Ok(result) => ApiResponse::from_object(result),
        Err(error) => ApiResponse::from_error(error),
    }
}

#[post("/books/mark_read/<asin>")]
pub async fn mark_read(db: &State<Arc<Database>>, user: &User, asin: &str) -> ApiResponse {
    if Book::fetch_by_asin(db, asin).await.is_err() {
        return ApiResponse::BadRequest {
            message: String::from("Book does not exist!"),
        };
    }

    match ReadState::add(db, user, asin).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}

#[post("/books/mark_read/<asin>/<date>")]
pub async fn mark_read_on_date(
    db: &State<Arc<Database>>,
    user: &User,
    asin: &str,
    date: &str,
) -> ApiResponse {
    if !is_valid_date(date) {
        return ApiResponse::BadRequest {
            message: String::from("Incorrect date format!"),
        };
    }

    if Book::fetch_by_asin(db, asin).await.is_err() {
        return ApiResponse::BadRequest {
            message: String::from("Book does not exist!"),
        };
    }

    match ReadState::update(db, user, asin, date).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}

#[post("/books/mark_unread/<asin>")]
pub async fn mark_unread(db: &State<Arc<Database>>, user: &User, asin: &str) -> ApiResponse {
    if Book::fetch_by_asin(db, asin).await.is_err() {
        return ApiResponse::BadRequest {
            message: String::from("Book does not exist!"),
        };
    }

    match ReadState::remove(db, user, asin).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}

fn is_valid_date(date: &str) -> bool {
    match NaiveDate::parse_from_str(date, "%Y-%m-%d") {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_valid_date() {
        assert!(is_valid_date("2025-01-02"));

        assert!(!is_valid_date("2025-02-31"));
        assert!(!is_valid_date(" 2025-01-02 "));
        assert!(!is_valid_date("2025-01-02 some string"));
        assert!(!is_valid_date("2025-01-02 09:15:46"));
    }
}
