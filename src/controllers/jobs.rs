use rocket::State;
use std::sync::Arc;

use crate::database::Database;
use crate::response::ApiResponse;
use crate::scraper::job::Job;

#[get("/jobs")]
pub async fn get_all(db: &State<Arc<Database>>) -> ApiResponse {
    match Job::fetch_all(db).await {
        Ok(result) => ApiResponse::from_object(result),
        Err(error) => ApiResponse::from_error(error),
    }
}
