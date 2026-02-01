use crate::database::Database;
use crate::scraper::job::Job;
use crate::series::BookSeries;

pub async fn enqueue_all_series(db: &Database) -> anyhow::Result<()> {
    let all_series = BookSeries::fetch_all(db).await?;
    for series in all_series {
        Job::add(db, series.asin).await?;
    }

    Ok(())
}
