use rocket::State;
use std::sync::Arc;

use crate::database::Database;
use crate::response::ApiResponse;
use crate::scraper::job::Job;
use crate::user::User;

#[get("/jobs")]
pub async fn get_all(db: &State<Arc<Database>>, _user: &User) -> ApiResponse {
    match Job::fetch_all(db).await {
        Ok(result) => ApiResponse::from_object(result),
        Err(error) => ApiResponse::from_error(error),
    }
}
