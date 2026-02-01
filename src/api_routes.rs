use rocket::http::ContentType;
use rocket::State;
use serde_json::to_string as to_json_string;
use std::sync::Arc;

use crate::books::Book;
use crate::database::Database;
use crate::job_server::JobServer;
use crate::series::BookSeries;
use crate::user::User;

#[get("/books")]
pub async fn books_get_controller(
    db: &State<Arc<Database>>,
    user: &User,
) -> Option<(ContentType, String)> {
    match Book::fetch_by_user(db, user).await {
        Ok(result) => match to_json_string(&result) {
            Ok(json) => Some((ContentType::JSON, json)),
            Err(_) => None,
        },
        Err(_) => None,
    }
}

#[get("/jobs")]
pub async fn jobs_get_controller(
    job_server: &State<Arc<JobServer>>,
    _user: &User,
) -> Option<(ContentType, String)> {
    match job_server.get_jobs().await {
        Ok(result) => match to_json_string(&result) {
            Ok(json) => Some((ContentType::JSON, json)),
            Err(_) => None,
        },
        Err(_) => None,
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
pub async fn jobs_post_controller(
    db: &State<Arc<Database>>,
    job_server: &State<Arc<JobServer>>,
    _user: &User,
) -> Option<&'static str> {
    match enqueue_all(db, job_server).await {
        Ok(_) => Some(""),
        Err(_) => None,
    }
}

#[delete("/jobs")]
pub async fn jobs_delete_controller(
    job_server: &State<Arc<JobServer>>,
    _user: &User,
) -> Option<&'static str> {
    match job_server.delete_all_jobs().await {
        Ok(_) => Some(""),
        Err(_) => None,
    }
}
