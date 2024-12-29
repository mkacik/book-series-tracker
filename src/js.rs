use anyhow;
use std::fs::File;
use std::io::Write;

use crate::books::{Book, BookSeries, GetAllBooksResult, GetAllSeriesResult, AddSeriesResult};
use crate::job_server::{GetAllJobsResult, Job};

fn get_js_types() -> Vec<&'static str> {
    vec![
        Book::generate_js(),
        GetAllBooksResult::generate_js(),
        BookSeries::generate_js(),
        GetAllSeriesResult::generate_js(),
        AddSeriesResult::generate_js(),
        Job::generate_js(),
        GetAllJobsResult::generate_js(),
    ]
}

pub fn export_js_types() -> anyhow::Result<()> {
    let file_contents = get_js_types().join("\n\n");

    let file_name = "javascript/src/generated/types.tsx";

    println!("*** Exported under {}:\n{}", file_name, file_contents);

    let mut file = File::create(file_name)?;
    file.write(file_contents.as_bytes())?;

    Ok(())
}
