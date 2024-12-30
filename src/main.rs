#[macro_use]
extern crate rocket;

use clap::{Parser, Subcommand};
use rocket::fs::{relative, FileServer};
use std::env;
use std::sync::Arc;

mod api_routes;
mod books;
mod calendar;
mod common;
mod database;
mod guards;
mod job_processor;
mod job_server;
mod js;
mod routes;

use crate::database::Database;
use crate::job_server::JobServer;

#[derive(Parser)]
#[command(about)]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Starts the server
    Server {
        /// how frequently server should wake up to check for jobs to process
        #[clap(long, default_value_t = 30)]
        poll_interval_s: u64,
    },
    /// Generate JavaScript type file from structs annotated with GenJs
    GenerateJs {},
}

fn spawn_thread_for_daily_scrape(
  database: Arc<Database>,
  job_server: Arc<JobServer>,
) {
  tokio::spawn(async move {
    loop {
      common::sleep_seconds(86400).await;
      let _ = api_routes::enqueue_all(&database, &job_server).await;
    }
  });
}

#[rocket::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    match &args.command {
        Command::Server { poll_interval_s } => {
            let database = Arc::new(Database::init().await);
            let job_server = JobServer::init(database.clone(), *poll_interval_s);

            spawn_thread_for_daily_scrape(database.clone(), job_server.clone());

            let _rocket = rocket::build()
                .mount(
                    "/",
                    routes![
                        routes::index_controller,
                        routes::jobs_controller,
                        routes::calendar_controller,
                        routes::favicon_controller,
                    ],
                )
                .mount(
                    "/api",
                    routes![
                        api_routes::books_get_controller,
                        api_routes::jobs_delete_controller,
                        api_routes::jobs_get_controller,
                        api_routes::jobs_post_controller,
                        api_routes::series_delete_controller,
                        api_routes::series_get_controller,
                        api_routes::series_post_controller,
                    ],
                )
                .mount("/static", FileServer::from(relative!("www/static")))
                .manage(database)
                .manage(job_server)
                .launch()
                .await?;
        }
        Command::GenerateJs {} => {
            js::export_js_types()?;
        }
    };

    Ok(())
}
