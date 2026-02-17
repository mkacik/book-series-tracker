use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::common::now;
use crate::database::Database;
use crate::user::User;

#[derive(Deserialize, Serialize)]
#[serde(tag = "variant")]
pub enum JobParams {
    Book { asin: String, parent: i32 },
    Series { asin: String },
}

#[derive(sqlx::FromRow, Serialize, TS, Clone, Debug)]
#[ts(export_to = "types.ts")]
pub struct Job {
    pub id: i32,
    /* Params struct may change over time and should not prevent serialization,
    if old version is encountered. Params string will only be deserialized during
    job processing, for display in UI we need only json string */
    pub params: String,
    pub status: String,
    pub errors: Option<String>,
    pub username: Option<String>,

    #[ts(as = "i32")]
    pub time_created: i64,
    #[ts(as = "Option<i32>")]
    pub time_started: Option<i64>,
    #[ts(as = "Option<i32>")]
    pub time_finished: Option<i64>,
}

#[derive(Serialize, TS, Clone, Debug)]
#[ts(export_to = "types.ts")]
pub struct GetAllJobsResult {
    pub jobs: Vec<Job>,
}

impl Job {
    pub async fn fetch_all(db: &Database) -> anyhow::Result<GetAllJobsResult> {
        let mut conn = db.acquire_db_conn().await?;

        let jobs = sqlx::query_as::<_, Job>("SELECT * FROM jobs ORDER BY time_created DESC")
            .fetch_all(&mut *conn)
            .await?;

        Ok(GetAllJobsResult { jobs: jobs })
    }

    pub async fn fetch_next(db: &Database) -> anyhow::Result<Option<Job>> {
        let mut conn = db.acquire_db_conn().await?;

        // this function is only called from JobServer. If job is seen with PROCESSING
        // state, it means server closed mid-processing, so need to restart the job
        // instead of fetching next QUEUED
        let job = sqlx::query_as::<_, Job>(
            "SELECT * FROM jobs WHERE status IN ('QUEUED', 'PROCESSING')
                ORDER BY time_created ASC LIMIT 1",
        )
        .fetch_optional(&mut *conn)
        .await?;

        Ok(job)
    }

    pub async fn add(
        db: &Database,
        job_params: JobParams,
        user: Option<&User>,
    ) -> anyhow::Result<i32> {
        let mut conn = db.acquire_db_conn().await?;

        let params = serde_json::to_string(&job_params)?;
        let maybe_existing_job = sqlx::query!(
            "SELECT id FROM jobs WHERE status = 'QUEUED' AND params = ?1",
            params
        )
        .fetch_optional(&mut *conn)
        .await?;
        if let Some(job) = maybe_existing_job {
            let job_id: i32 = job.id.try_into().unwrap();
            return Ok(job_id);
        };

        let time_created = now();
        let username: Option<&str> = match user {
            Some(user) => Some(&user.username),
            None => None,
        };
        let result = sqlx::query_scalar!(
            "INSERT INTO jobs (status, params, username, time_created)
                    VALUES ('QUEUED', ?1, ?2, ?3) RETURNING id",
            params,
            username,
            time_created,
        )
        .fetch_one(&mut *conn)
        .await?;
        let job_id: i32 = result.try_into().unwrap();

        Ok(job_id)
    }

    pub async fn mark_as_processing(&mut self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let status = "PROCESSING";
        let time_started = now();
        sqlx::query!(
            "UPDATE jobs SET status = ?1, time_started = ?2 WHERE id = ?3",
            status,
            time_started,
            self.id,
        )
        .execute(&mut *conn)
        .await?;

        self.status = status.to_string();
        self.time_started = Some(time_started);

        Ok(())
    }

    pub async fn mark_as_successful(&mut self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let status = "SUCCESSFUL";
        let time_finished = now();
        sqlx::query!(
            "UPDATE jobs SET status = ?1, time_finished = ?2 WHERE id = ?3",
            status,
            time_finished,
            self.id,
        )
        .execute(&mut *conn)
        .await?;

        self.status = status.to_string();
        self.time_finished = Some(time_finished);

        Ok(())
    }

    pub async fn mark_as_failed(&mut self, db: &Database, errors: String) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let status = "FAILED";
        let time_finished = now();
        sqlx::query!(
            "UPDATE jobs SET status = ?1, time_finished = ?2, errors = ?3 WHERE id = ?4",
            status,
            time_finished,
            errors,
            self.id,
        )
        .execute(&mut *conn)
        .await?;

        self.status = status.to_string();
        self.time_finished = Some(time_finished);
        self.errors = Some(errors);

        Ok(())
    }
}
