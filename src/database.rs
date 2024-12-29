use sqlx::pool::PoolConnection;
use sqlx::sqlite::SqlitePool;
use sqlx::Sqlite;

pub async fn get_db_pool() -> SqlitePool {
    match SqlitePool::connect("db/bst.db").await {
        Ok(pool) => pool,
        Err(_) => panic!("Could not create db connection pool, aborting!"),
    }
}

pub type DatabaseConnection = PoolConnection<Sqlite>;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn init() -> Database {
        Database {
            pool: get_db_pool().await,
        }
    }

    pub async fn acquire_db_conn(&self) -> Result<DatabaseConnection, anyhow::Error> {
        let conn = self.pool.acquire().await?;

        Ok(conn)
    }
}
