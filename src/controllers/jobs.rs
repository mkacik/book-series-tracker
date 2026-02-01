use rocket::State;
use std::sync::Arc;

use crate::database::Database;
use crate::job_server::JobServer;
use crate::response::ApiResponse;
use crate::series::BookSeries;
use crate::user::User;

#[get("/jobs")]
pub async fn get_all(job_server: &State<Arc<JobServer>>, _user: &User) -> ApiResponse {
    match job_server.get_jobs().await {
        Ok(result) => ApiResponse::from_object(result),
        Err(error) => ApiResponse::from_error(error),
    }
}

pub async fn enqueue_all(db: &Database, job_server: &JobServer) -> anyhow::Result<()> {
    let all_series = BookSeries::fetch_all(db).await?;
    for series in all_series {
        job_server.add_job(series.asin).await?;
    }

    Ok(())
}

#[post("/jobs")]
pub async fn scrape_all_series(
    db: &State<Arc<Database>>,
    job_server: &State<Arc<JobServer>>,
    _user: &User,
) -> ApiResponse {
    match enqueue_all(db, job_server).await {
        Ok(_) => ApiResponse::Success,
        Err(error) => ApiResponse::from_error(error),
    }
}
