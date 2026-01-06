use clap::Subcommand;
use std::io;

use crate::credentials::Credentials;
use crate::crypto::{hash_password, verify_password};
use crate::database::Database;

#[derive(Subcommand)]
pub enum Command {
    /// Set new credential for a user, creating user if necessary
    Set { username: String },
    /// Removes username from database
    Remove { username: String },
    /// Lists users with active credentials
    ListUsernames,
}

pub async fn manage_passwords(db: Database, command: Command) {
    match command {
        Command::Set { username } => {
            set_password(db, username).await;
        }
        Command::Remove { username } => {
            remove_password(db, username).await;
        }
        Command::ListUsernames => {
            list_usernames(db).await;
        }
    };
}

async fn set_password(db: Database, username: String) {
    let password = match read_password() {
        Ok(value) => value,
        Err(e) => {
            println!("Something went wrong: {}", e);
            return;
        }
    };

    let hash = match hash_password(&password) {
        Ok(value) => value,
        Err(_) => {
            println!("Something went wrong: Hashing password failed.");
            return;
        }
    };

    if verify_password(&hash, &password).is_err() {
        println!(
            "Something went wrong: Password can't be verified, something went seriously fucky."
        );
        return;
    }

    match save_credentials(db, username, hash).await {
        Ok(_) => println!("Password successfully set."),
        Err(e) => println!("Something went wrong: {}", e),
    }
}

fn read_password() -> anyhow::Result<String> {
    println!("Type in new password:");
    let mut password = String::new();
    io::stdin().read_line(&mut password)?;

    println!("Repeat the password:");
    let mut repeat = String::new();
    io::stdin().read_line(&mut repeat)?;

    if password != repeat {
        return Err(anyhow::anyhow!("Provided passwords differ, aborting!"));
    }

    let trimmed = match password.ends_with("\n") {
        true => password[0..password.len() - 1].to_string(),
        false => password,
    };

    Ok(trimmed)
}

async fn save_credentials(db: Database, username: String, pwhash: String) -> anyhow::Result<()> {
    match Credentials::fetch_by_username(&db, &username).await {
        Ok(None) => Credentials::create(&db, &username, &pwhash).await,
        Ok(Some(mut creds)) => {
            creds.pwhash = pwhash;
            creds.update(&db).await
        }
        Err(e) => Err(e),
    }
}

async fn remove_password(db: Database, username: String) {
    match Credentials::delete_by_username(&db, &username).await {
        Ok(_) => println!("Deleted login credentials for user '{}'", username),
        Err(e) => println!("Something went wrong: {}", e),
    };
}

async fn list_usernames(db: Database) {
    let all = match Credentials::fetch_all(&db).await {
        Ok(value) => value,
        Err(e) => {
            println!("Something went wrong: {}", e);
            return;
        }
    };

    for creds in all {
        println!("{}", creds.username);
    }
}
