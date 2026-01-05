use rocket::http::ContentType;
use rocket::State;
use rocket_dyn_templates::{context, Template};
use std::sync::Arc;

use crate::books::Book;
use crate::calendar::get_calendar_string;
use crate::database::Database;

async fn index() -> Template {
    Template::render("index", context! {})
}

#[get("/")]
pub async fn index_controller() -> Template {
    index().await
}

#[get("/jobs")]
pub async fn jobs_controller() -> Template {
    index().await
}

#[get("/login")]
pub async fn login_controller() -> Template {
    Template::render("login", context! {})
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
