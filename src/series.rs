use serde::Serialize;
use ts_rs::TS;

use crate::common::TS_FILE;
use crate::database::Database;
use crate::user::User;

#[derive(sqlx::FromRow, Serialize, TS, Debug)]
pub struct BookSeries {
    pub asin: String,
    pub name: String,
    pub time_first_seen: i64,
}

#[derive(sqlx::FromRow, Serialize, TS, Debug)]
#[ts(export_to = TS_FILE, rename="BookSeries")]
pub struct BookSeriesWithStatus {
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub series: BookSeries,
    pub subscribed: bool,
    pub subscribers: i32,
}

#[derive(Serialize, TS, Debug)]
#[ts(export_to = TS_FILE)]
pub struct GetAllSeriesResult {
    pub series: Vec<BookSeriesWithStatus>,
}

#[derive(Serialize, TS, Debug)]
#[ts(export_to = TS_FILE)]
pub struct AddSeriesResult {
    pub job_id: i32,
}

impl BookSeries {
    pub async fn save(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "INSERT OR IGNORE INTO series (asin, name, time_first_seen) VALUES (?1, ?2, ?3)",
            self.asin,
            self.name,
            self.time_first_seen
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn fetch_by_asin(db: &Database, asin: &str) -> anyhow::Result<BookSeries> {
        let mut conn = db.acquire_db_conn().await?;
        let series = sqlx::query_as::<_, BookSeries>("SELECT * FROM series WHERE asin = ?1")
            .bind(asin)
            .fetch_one(&mut *conn)
            .await?;

        Ok(series)
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<BookSeries>> {
        let mut conn = db.acquire_db_conn().await?;
        let series_list = sqlx::query_as::<_, BookSeries>("SELECT * FROM series ORDER BY name")
            .fetch_all(&mut *conn)
            .await?;

        Ok(series_list)
    }

    pub async fn fetch_by_user(db: &Database, user: &User) -> anyhow::Result<GetAllSeriesResult> {
        let mut conn = db.acquire_db_conn().await?;
        let series_list = sqlx::query_as::<_, BookSeriesWithStatus>(
            "SELECT
                  series.*,
                  MAX(IIF(subscriptions.username = ?1, 1, 0)) AS subscribed,
                  SUM(IIF(subscriptions.username IS NOT NULL, 1, 0)) AS subscribers
                FROM series
                LEFT JOIN subscriptions
                  ON (series.asin = subscriptions.series_asin)
                GROUP BY 1, 2, 3
                ORDER BY series.name",
        )
        .bind(&user.username)
        .fetch_all(&mut *conn)
        .await?;

        Ok(GetAllSeriesResult {
            series: series_list,
        })
    }

    pub async fn delete_by_asin(db: &Database, asin: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        // Yea, I know it's not really clean to do it from this class, and I'm not feeling
        // creative enough to restructure this again :D
        sqlx::query!("DELETE FROM books WHERE series_asin = ?1", asin)
            .execute(&mut *conn)
            .await?;

        sqlx::query!("DELETE FROM series WHERE asin = ?1", asin)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }
}
