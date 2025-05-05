use sqlx::FromRow;

use crate::database::Database;

#[derive(Debug, FromRow)]
pub struct Credentials {
    pub username: String,
    pub pwhash: String,
}

#[allow(dead_code)]
impl Credentials {
    pub async fn create(db: &Database, username: &str, pwhash: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "INSERT INTO credentials (username, pwhash) VALUES (?1, ?2)",
            username,
            pwhash,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn delete_by_username(db: &Database, username: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM credentials WHERE username = ?1", username)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<Credentials>> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, Credentials>(
            "SELECT username, pwhash FROM credentials ORDER BY username",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn fetch_by_username(
        db: &Database,
        username: &str,
    ) -> anyhow::Result<Option<Credentials>> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, Credentials>(
            "SELECT username, pwhash FROM credentials WHERE username = ?1",
        )
        .bind(username)
        .fetch_optional(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "UPDATE credentials SET pwhash = ?2 WHERE username = ?1",
            self.username,
            self.pwhash,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
