use serde::Serialize;

use crate::database::Database;
use crate::user::User;

#[derive(sqlx::FromRow, Serialize)]
pub struct ReadStatus {
    username: String,
    book_asin: String,
}

impl ReadStatus {
    pub async fn add(db: &Database, user: &User, book_asin: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "INSERT INTO reads (username, book_asin) VALUES(?1, ?2)",
            user.username,
            book_asin,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn remove(db: &Database, user: &User, book_asin: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "DELETE FROM reads WHERE username = ?1 AND book_asin = ?2",
            user.username,
            book_asin,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
