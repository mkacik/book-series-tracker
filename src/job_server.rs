use serde::Serialize;
use std::sync::Arc;
use tokio::sync::Semaphore;
use tokio::time::{sleep, Duration};

use bstmacros::GenJs;

use crate::common::now;
use crate::database::Database;
use crate::job_processor::scrape_and_save;

#[derive(sqlx::FromRow, Serialize, GenJs, Clone, Debug)]
pub struct Job {
    pub id: i32,
    pub params: String,
    pub status: String,
    pub errors: Option<String>,

    pub time_created: i64,
    pub time_started: Option<i64>,
    pub time_finished: Option<i64>,
}

#[derive(Serialize, GenJs, Clone, Debug)]
pub struct GetAllJobsResult {
    pub jobs: Vec<Job>,
}

pub struct JobServer {
    pub database: Arc<Database>,
    processing_permit: Semaphore,
}

impl JobServer {
    pub fn init(database: Arc<Database>, poll_interval: u64) -> Arc<JobServer> {
        let job_server = Arc::new(JobServer {
            database: database,
            processing_permit: Semaphore::new(1),
        });

        JobServer::start_polling(job_server.clone(), poll_interval);

        job_server
    }

    fn start_polling(job_server: Arc<JobServer>, poll_interval: u64) {
        tokio::spawn(async move {
            loop {
                match job_server.process_all().await {
                    Ok(_job_count) => {
                        sleep(Duration::new(poll_interval, 0)).await;
                    }
                    Err(_) => {
                        return;
                    }
                };
            }
        });
    }

    pub async fn process_all(&self) -> anyhow::Result<i32> {
        let mut job_count: i32 = 0;
        loop {
            match self.process_one().await {
                Ok(Some(_)) => {
                    job_count += 1;
                }
                Ok(None) => {
                    log::debug!("Processed {} jobs in this loop iteration", &job_count);
                    return Ok(job_count);
                }
                Err(e) => {
                    log::error!(
                        "Processed {} jobs before encountering fatal error",
                        &job_count
                    );
                    return Err(e);
                }
            };
        }
    }

    async fn process_one(&self) -> anyhow::Result<Option<&str>> {
        let _processing_permit = self.processing_permit.acquire().await.unwrap();
        let mut conn = self.database.acquire_db_conn().await?;

        let find_job_id_for_processing_result = sqlx::query!(
            "SELECT id, params FROM jobs WHERE status IN ('QUEUED', 'PROCESSING')
                ORDER BY time_created ASC LIMIT 1"
        )
        .fetch_optional(&mut *conn)
        .await?;
        let (job_id, params) = match find_job_id_for_processing_result {
            Some(result) => {
                let job_id: i32 = result.id.try_into().unwrap();
                let params: String = result.params.try_into().unwrap();
                (job_id, params)
            }
            None => return Ok(None),
        };

        log::debug!(
            "Starting processing for job {}, with params: {}",
            &job_id,
            &params
        );

        let time_started = now();
        sqlx::query!(
            "UPDATE jobs SET status = 'PROCESSING', time_started = ?1 WHERE id = ?2",
            time_started,
            job_id,
        )
        .execute(&mut *conn)
        .await?;

        let (status, errors) = match scrape_and_save(&self.database, params).await {
            Ok(_) => ("SUCCESSFUL", None),
            Err(e) => ("FAILED", Some(format!("{}", e))),
        };

        let time_finished = now();
        sqlx::query!(
            "UPDATE jobs SET status = ?1, errors = ?2, time_finished = ?3 WHERE id = ?4",
            status,
            errors,
            time_finished,
            job_id,
        )
        .execute(&mut *conn)
        .await?;

        log::debug!(
            "Finished processing of job {} with status :{}",
            &job_id,
            &status
        );

        Ok(Some(status))
    }

    pub async fn add_job(&self, params: String) -> anyhow::Result<i32> {
        let mut conn = self.database.acquire_db_conn().await?;

        let time_created = now();
        let result = sqlx::query_scalar!(
            "INSERT INTO jobs (params, status, time_created)
                    VALUES (?1, ?2, ?3) RETURNING id",
            params,
            "QUEUED",
            time_created,
        )
        .fetch_one(&mut *conn)
        .await?;
        let job_id: i32 = result.try_into().unwrap();

        Ok(job_id)
    }

    pub async fn get_jobs(&self) -> anyhow::Result<GetAllJobsResult> {
        let mut conn = self.database.acquire_db_conn().await?;

        let jobs = sqlx::query_as::<_, Job>("SELECT * FROM jobs ORDER BY time_created DESC")
            .fetch_all(&mut *conn)
            .await?;

        Ok(GetAllJobsResult { jobs: jobs })
    }
}
