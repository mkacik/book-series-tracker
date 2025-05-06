use rocket::fs::NamedFile;
use rocket::http::ContentType;
use rocket::State;
use std::sync::Arc;

use crate::books::Book;
use crate::calendar::get_calendar_string;
use crate::database::Database;

async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/index.html").await
}

#[get("/")]
pub async fn index_controller() -> Result<NamedFile, std::io::Error> {
    index().await
}

#[get("/jobs")]
pub async fn jobs_controller() -> Result<NamedFile, std::io::Error> {
    index().await
}

#[get("/login")]
pub async fn login_controller() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/login.html").await
}

#[get("/calendar")]
pub async fn calendar_controller(db: &State<Arc<Database>>) -> Option<(ContentType, String)> {
    let books = match Book::fetch_all(db).await {
        Ok(result) => result.books,
        Err(_) => return None,
    };
    let calendar_string = get_calendar_string(books);

    Some((ContentType::Calendar, calendar_string))
}
