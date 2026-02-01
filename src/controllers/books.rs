use rocket::State;
use std::sync::Arc;

use crate::books::Book;
use crate::database::Database;
use crate::response::ApiResponse;
use crate::user::User;

#[get("/books")]
pub async fn get_all(db: &State<Arc<Database>>, user: &User) -> ApiResponse {
    match Book::fetch_by_user(db, user).await {
        Ok(result) => ApiResponse::from_object(result),
        Err(error) => ApiResponse::from_error(error),
    }
}
