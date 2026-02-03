use std::sync::Arc;
use tokio::sync::Semaphore;

use crate::common::sleep_seconds;
use crate::database::Database;
use crate::scraper::job::Job;
use crate::scraper::series::scrape_and_save;

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
                        sleep_seconds(poll_interval).await;
                    }
                    Err(error) => {
                        log::error!("{:?}", error);
                        std::process::exit(1);
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

    async fn process_one(&self) -> anyhow::Result<Option<()>> {
        let _processing_permit = self.processing_permit.acquire().await.unwrap();

        let mut job = match Job::fetch_next(&self.database).await? {
            Some(job) => job,
            None => return Ok(None),
        };

        log::debug!(
            "Starting processing for job {}, with params: {}",
            &job.id,
            &job.params
        );

        job.mark_as_processing(&self.database).await?;

        match scrape_and_save(&self.database, job.params.to_string()).await {
            Ok(_) => job.mark_as_successful(&self.database).await?,
            Err(error) => {
                let message = format!("{}", error);

                job.mark_as_failed(&self.database, message).await?
            }
        }

        log::debug!(
            "Finished processing of job {} with status :{}",
            &job.id,
            &job.status
        );

        Ok(Some(()))
    }
}
