use rocket::form::{Form, FromForm};
use rocket::fs::NamedFile;
use rocket::http::{Cookie, CookieJar};
use rocket::response::Redirect;
use rocket::{post, State};
use std::sync::Arc;

use crate::credentials::Credentials;
use crate::crypto::verify_password;
use crate::database::Database;

#[derive(FromForm)]
pub struct LoginForm {
    username: String,
    password: String,
}

#[get("/login")]
pub async fn login_page() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/login.html").await
}

#[post("/login", data = "<form>")]
pub async fn login(
    cookies: &CookieJar<'_>,
    db: &State<Arc<Database>>,
    form: Form<LoginForm>,
) -> Redirect {
    let creds = match Credentials::fetch_by_username(db, &form.username).await {
        Ok(Some(value)) => value,
        _ => return Redirect::to("/"),
    };

    if verify_password(&creds.pwhash, &form.password).is_err() {
        return Redirect::to("/");
    }

    let cookie = Cookie::new("user", creds.username);
    cookies.add_private(cookie);

    Redirect::to("/")
}

#[post("/logout")]
pub async fn logout(cookies: &CookieJar<'_>) -> Redirect {
    cookies.remove_private("user");

    Redirect::to("/")
}
