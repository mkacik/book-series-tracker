use rocket::http::ContentType;
use rocket::serde::json::Json;
use rocket::State;
use serde::Deserialize;
use serde_json::to_string as to_json_string;
use std::sync::Arc;

use crate::books::{Book, BookSeries, AddSeriesResult};
use crate::common::validate_asin;
use crate::database::Database;
use crate::guards::LocalUser;
use crate::job_server::JobServer;

#[derive(Deserialize, Debug)]
pub struct BookSeriesRequest {
    asin: String,
}

#[get("/books")]
pub async fn books_get_controller(db: &State<Arc<Database>>) -> Option<(ContentType, String)> {
    match Book::fetch_all(db).await {
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
) -> Option<(ContentType, String)> {
    match job_server.get_jobs().await {
        Ok(result) => match to_json_string(&result) {
            Ok(json) => Some((ContentType::JSON, json)),
            Err(_) => None,
        },
        Err(_) => None,
    }
}

#[post("/jobs")]
pub async fn jobs_post_controller(
    db: &State<Arc<Database>>,
    job_server: &State<Arc<JobServer>>,
    _local_user: LocalUser,
) -> Option<&'static str> {
    let all_series = match BookSeries::fetch_all(db).await {
        Ok(get_all_series_result) => get_all_series_result.series,
        Err(_) => return None,
    };

    for series in all_series {
        let _ = job_server.add_job(series.asin).await;
    }

    Some("")
}

#[get("/series")]
pub async fn series_get_controller(db: &State<Arc<Database>>) -> Option<(ContentType, String)> {
    match BookSeries::fetch_all(db).await {
        Ok(result) => match to_json_string(&result) {
            Ok(json) => Some((ContentType::JSON, json)),
            Err(_) => None,
        },
        Err(_) => None,
    }
}

async fn validate_and_add_series(
  job_server: &JobServer,
  asin: &str
) -> AddSeriesResult {
  let asin = match validate_asin(asin.trim()) {
      Ok(asin) => asin,
      Err(e) => return  AddSeriesResult {
          job_id: None,
          error: Some(format!("{}", e)),
      },
  };

  match job_server.add_job(asin).await {
      Ok(job_id) => AddSeriesResult {
          job_id: Some(job_id),
          error: None,
      },
      Err(e) => AddSeriesResult {
            job_id: None,
            error: Some(format!("{}", e))
      },
  }
}

#[post("/series", format = "json", data = "<series>")]
pub async fn series_post_controller(
    job_server: &State<Arc<JobServer>>,
    series: Json<BookSeriesRequest>,
    _local_user: LocalUser,
) -> Option<(ContentType, String)> {
    let result = validate_and_add_series(job_server, &series.asin).await;

    match to_json_string(&result) {
      Ok(json) => Some((ContentType::JSON, json)),
      Err(_) => None,
    }
}

#[delete("/series", format = "json", data = "<series>")]
pub async fn series_delete_controller(
    db: &State<Arc<Database>>,
    series: Json<BookSeriesRequest>,
    _local_user: LocalUser,
) -> Option<&'static str> {
    let asin = match validate_asin(series.asin.trim()) {
        Ok(asin) => asin,
        Err(_) => return None,
    };

    match BookSeries::delete_by_asin(db, &asin).await {
        Ok(_) => Some(""),
        Err(_) => None,
    }
}
