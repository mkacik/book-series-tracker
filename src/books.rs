use serde::Serialize;

use crate::database::Database;

use bstmacros::GenJs;

#[derive(sqlx::FromRow, Serialize, GenJs, Debug)]
pub struct BookSeries {
    pub asin: String,
    pub name: String,
    pub time_first_seen: i64,
}

#[derive(sqlx::FromRow, Serialize, GenJs, Debug)]
pub struct Book {
    pub asin: String,
    pub series_asin: String,
    pub ordinal: u32, // # in series, not an id
    pub title: String,
    pub author: String,
    pub day: u32,
    pub month: u32,
    pub year: u32,
    pub time_first_seen: i64,
}

#[derive(Serialize, GenJs, Debug)]
pub struct GetAllSeriesResult {
    pub series: Vec<BookSeries>,
}

#[derive(Serialize, GenJs, Debug)]
pub struct GetAllBooksResult {
    pub books: Vec<Book>,
}

#[derive(Serialize, GenJs, Debug)]
pub struct AddSeriesResult {
    pub job_id: Option<i32>,
    pub error: Option<String>,
}

impl Book {
    pub async fn save(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "INSERT OR IGNORE INTO books (
          asin, series_asin, ordinal, title, author, day, month, year, time_first_seen
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            self.asin,
            self.series_asin,
            self.ordinal,
            self.title,
            self.author,
            self.day,
            self.month,
            self.year,
            self.time_first_seen,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<GetAllBooksResult> {
        let mut conn = db.acquire_db_conn().await?;
        let books =
            sqlx::query_as::<_, Book>("SELECT * FROM books ORDER BY year ASC, month ASC, day ASC")
                .fetch_all(&mut *conn)
                .await?;

        Ok(GetAllBooksResult { books: books })
    }
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

    pub async fn fetch_all(db: &Database) -> anyhow::Result<GetAllSeriesResult> {
        let mut conn = db.acquire_db_conn().await?;
        let series = sqlx::query_as::<_, BookSeries>("SELECT * FROM series ORDER BY name")
            .fetch_all(&mut *conn)
            .await?;

        Ok(GetAllSeriesResult { series: series })
    }

    pub async fn delete_by_asin(db: &Database, asin: &str) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!("DELETE FROM series WHERE asin = ?1", asin)
            .execute(&mut *conn)
            .await?;

        // Yea, I know it's not really clean to do it from this class, and I'm not feeling
        // creative enough to restructure this again :D
        sqlx::query!("DELETE FROM books WHERE series_asin = ?1", asin)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }
}
