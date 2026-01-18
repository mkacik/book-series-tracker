#[macro_use]
extern crate rocket;

use clap::{Parser, Subcommand};
use rocket::fs::{relative, FileServer};
use rocket_dyn_templates::Template;
use std::env;
use std::sync::Arc;

mod api_routes;
mod books;
mod common;
mod credentials;
mod crypto;
mod database;
mod genjs;
mod job_processor;
mod job_server;
mod login;
mod passwords;
mod routes;
mod user;

use crate::crypto::init_crypto;
use crate::database::Database;
use crate::job_server::JobServer;
use crate::passwords::Command as PasswordsCommand;

#[derive(Parser)]
#[command(about)]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Generate TypeScript bindings for structs annottated with TS macros
    Genjs {},

    /// Manage users and passwords
    Passwords {
        #[command(subcommand)]
        command: PasswordsCommand,
    },

    /// Starts the server
    Server {
        /// how frequently server should wake up to check for jobs to process
        #[clap(long, default_value_t = 30)]
        poll_interval_s: u64,
    },
}

fn spawn_thread_for_daily_scrape(database: Arc<Database>, job_server: Arc<JobServer>) {
    tokio::spawn(async move {
        loop {
            common::sleep_seconds(86400).await;
            let _ = api_routes::enqueue_all(&database, &job_server).await;
        }
    });
}

#[rocket::main]
async fn main() -> anyhow::Result<()> {
    if init_crypto().is_err() {
        return Err(anyhow::anyhow!("Error initializing crypto, aborting"));
    }

    let args = Args::parse();
    match args.command {
        Command::Genjs {} => {
            genjs::export_js_types();
        }

        Command::Passwords { command } => {
            let database = Database::init().await;
            passwords::manage_passwords(database, command).await;
        }

        Command::Server { poll_interval_s } => {
            let database = Arc::new(Database::init().await);
            let job_server = JobServer::init(database.clone(), poll_interval_s);

            spawn_thread_for_daily_scrape(database.clone(), job_server.clone());

            let _rocket = rocket::build()
                .mount(
                    "/",
                    routes![
                        routes::index,
                        routes::catchall,
                        routes::login,
                        login::login,
                        login::logout,
                    ],
                )
                .mount(
                    "/api",
                    routes![
                        api_routes::me,
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
                .attach(Template::fairing())
                .manage(database)
                .manage(job_server)
                .launch()
                .await?;
        }
    };

    Ok(())
}
