use sqlx::pool::PoolConnection;
use sqlx::sqlite::SqlitePool;
use sqlx::Sqlite;
use std::env;

const DATABASE_URL_ENV_VAR: &str = "DATABASE_URL";

fn get_fallback_database_url() -> String {
    let current_dir = env::current_dir().expect("Cannot read current exectuable path, aborting!");

    format!("sqlite:{}/db/bst.db", current_dir.display())
}

async fn get_db_pool() -> SqlitePool {
    let database_url = match env::var(DATABASE_URL_ENV_VAR) {
        Ok(value) => value,
        Err(_) => {
            let fallback_database_url = get_fallback_database_url();
            println!(
                "{} env variable unset, falling back to {}.",
                DATABASE_URL_ENV_VAR, fallback_database_url,
            );

            fallback_database_url
        }
    };

    match SqlitePool::connect(&database_url).await {
        Ok(pool) => pool,
        Err(_) => panic!(
            "Could not create db connection to {}, aborting!",
            database_url
        ),
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
