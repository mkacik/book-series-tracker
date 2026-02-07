use serde::Serialize;
use ts_rs::TS;

use crate::common::TS_FILE;
use crate::database::Database;
use crate::user::User;

#[derive(sqlx::FromRow, Serialize, TS, Debug)]
pub struct Book {
    pub asin: String,
    pub series_asin: String,
    pub ordinal: u32, // # in series, not an id
    pub title: String,
    pub author: String,
    pub release_date: Option<String>,
    #[ts(as = "i32")]
    pub time_first_seen: i64,
}

#[derive(sqlx::FromRow, Serialize, TS, Debug)]
#[ts(export_to = TS_FILE, rename="Book")]
pub struct BookWithStatus {
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub book: Book,
    pub read_date: Option<String>,
}

#[derive(Serialize, TS, Debug)]
#[ts(export_to = TS_FILE)]
pub struct GetAllBooksResult {
    pub books: Vec<BookWithStatus>,
}

impl Book {
    pub async fn save(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "INSERT OR IGNORE INTO books (
          asin, series_asin, ordinal, title, author, release_date, time_first_seen
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            self.asin,
            self.series_asin,
            self.ordinal,
            self.title,
            self.author,
            self.release_date,
            self.time_first_seen,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn fetch_by_asin(db: &Database, asin: &str) -> anyhow::Result<Book> {
        let mut conn = db.acquire_db_conn().await?;
        let series = sqlx::query_as::<_, Book>("SELECT * FROM books WHERE asin = ?1")
            .bind(asin)
            .fetch_one(&mut *conn)
            .await?;

        Ok(series)
    }

    pub async fn fetch_by_user(db: &Database, user: &User) -> anyhow::Result<GetAllBooksResult> {
        let mut conn = db.acquire_db_conn().await?;

        let books = sqlx::query_as::<_, BookWithStatus>(
            "SELECT
              books.*,
              read_date
            FROM books
            JOIN subscriptions USING (series_asin)
            LEFT JOIN read_state ON (
              books.asin = read_state.book_asin
              AND subscriptions.username = read_state.username)
            WHERE subscriptions.username = ?1",
        )
        .bind(&user.username)
        .fetch_all(&mut *conn)
        .await?;

        Ok(GetAllBooksResult { books: books })
    }

    pub async fn fetch_by_series_asin(
        db: &Database,
        series_asin: &str,
    ) -> anyhow::Result<Vec<Book>> {
        let mut conn = db.acquire_db_conn().await?;
        let books = sqlx::query_as::<_, Book>("SELECT * FROM books WHERE series_asin = ?1")
            .bind(series_asin)
            .fetch_all(&mut *conn)
            .await?;

        Ok(books)
    }
}
