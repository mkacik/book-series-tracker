use std::env;
use std::fs;
use std::io;
use ts_rs::{ExportError, TS};

use crate::books::{AddSeriesResult, GetAllBooksResult, GetAllSeriesResult};
use crate::job_server::GetAllJobsResult;

fn export_all() -> Result<(), ExportError> {
    // exports type with all dependencies, see https://docs.rs/ts-rs/latest/src/ts_rs/lib.rs.html

    AddSeriesResult::export_all()?;
    GetAllBooksResult::export_all()?;
    GetAllSeriesResult::export_all()?;

    GetAllJobsResult::export_all()?;

    Ok(())
}

fn prepare_export_dir(export_dir: &str) -> io::Result<()> {
    if !fs::exists(&export_dir).is_ok() {
        // dir will be created by export function, nothing to do
        return Ok(());
    }

    println!("Directory exists, clearing all ts files first.");
    for entry in fs::read_dir(export_dir)? {
        let path = entry?.path();
        if path.extension().unwrap() == "ts" {
            println!("Removing {}", path.display());
            fs::remove_file(path)?;
        }
    }

    Ok(())
}

pub fn export_js_types() -> () {
    let export_dir = match env::var("TS_RS_EXPORT_DIR") {
        Ok(value) => value,
        Err(_) => {
            println!("TS_RS_EXPORT_DIR must be set to use this script");
            return;
        }
    };

    if let Err(error) = prepare_export_dir(&export_dir) {
        println!(
            "Error preparing export directory '{}': {:?}",
            export_dir, error
        );
        return;
    }

    match export_all() {
        Ok(_) => println!("\x1B[32mOK!\x1B[39m"),
        Err(e) => println!("{:?}", e),
    }
}
