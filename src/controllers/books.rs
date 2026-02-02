use rocket::State;
use std::sync::Arc;

use crate::books::Book;
use crate::database::Database;
use crate::reads::ReadStatus;
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

    match ReadStatus::add(db, user, asin).await {
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

    match ReadStatus::remove(db, user, asin).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}
