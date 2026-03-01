#[macro_use]
extern crate rocket;

use clap::{Parser, Subcommand};
use rocket::fs::{relative, FileServer};
use std::env;
use std::sync::Arc;

mod books;
mod common;
mod controllers;
mod credentials;
mod crypto;
mod database;
mod gatekeeper;
mod genjs;
mod passwords;
mod reads;
mod response;
mod scraper;
mod series;
mod subscriptions;
mod user;

use crate::controllers::series::enqueue_all_series;
use crate::crypto::init_crypto;
use crate::database::Database;
use crate::gatekeeper::GateKeeper;
use crate::passwords::Command as PasswordsCommand;
use crate::scraper::server::JobServer;

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

fn spawn_thread_for_daily_scrape(database: Arc<Database>) {
    let user = None;
    tokio::spawn(async move {
        loop {
            common::sleep_seconds(86400).await;
            let _ = enqueue_all_series(&database, user).await;
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

            spawn_thread_for_daily_scrape(database.clone());

            let _rocket = rocket::build()
                .mount(
                    "/",
                    routes![
                        controllers::index::index,
                        controllers::index::not_found,
                        controllers::index::catch_all,
                    ],
                )
                .mount(
                    "/api",
                    routes![
                        controllers::books::get_all,
                        controllers::books::mark_read,
                        controllers::books::mark_read_on_date,
                        controllers::books::mark_unread,
                        controllers::jobs::get_all,
                        controllers::login::me,
                        controllers::login::login,
                        controllers::login::logout,
                        controllers::series::get_all,
                        controllers::series::scrape_all,
                        controllers::series::add,
                        controllers::series::remove,
                        controllers::series::subscribe,
                        controllers::series::unsubscribe,
                    ],
                )
                .mount("/static", FileServer::from(relative!("www/static")))
                .manage(database)
                .manage(job_server)
                .attach(GateKeeper {})
                .launch()
                .await?;
        }
    };

    Ok(())
}
