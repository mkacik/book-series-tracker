use serde::Serialize;

use crate::database::Database;
use crate::user::User;

#[derive(sqlx::FromRow, Serialize)]
pub struct ReadState {
    username: String,
    book_asin: String,
}

impl ReadState {
    pub async fn add(db: &Database, user: &User, book_asin: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "INSERT INTO read_state (username, book_asin) VALUES(?1, ?2)",
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
            "DELETE FROM read_state WHERE username = ?1 AND book_asin = ?2",
            user.username,
            book_asin,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn update(
        db: &Database,
        user: &User,
        book_asin: &str,
        read_date: &str,
    ) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "UPDATE read_state SET read_date = ?1 WHERE username = ?2 AND book_asin = ?3",
            read_date,
            user.username,
            book_asin,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
