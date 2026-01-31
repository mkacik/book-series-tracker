use serde::Serialize;

use crate::database::Database;
use crate::user::User;

#[derive(sqlx::FromRow, Serialize)]
pub struct Subscription {
    username: String,
    series_asin: String,
}

impl Subscription {
    pub async fn add(db: &Database, user: &User, series_asin: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "INSERT INTO subscriptions (username, series_asin) VALUES(?1, ?2)",
            user.username,
            series_asin,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn remove(db: &Database, user: &User, series_asin: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "DELETE FROM subscriptions WHERE username = ?1 AND series_asin = ?2",
            user.username,
            series_asin,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
