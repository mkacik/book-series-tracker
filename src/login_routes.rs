use rocket::form::{Form, FromForm};
use rocket::http::{ContentType, Cookie, CookieJar};
use rocket::{post, State};
use serde_json::to_string as to_json_string;
use std::sync::Arc;

use crate::credentials::Credentials;
use crate::crypto::verify_password;
use crate::database::Database;
use crate::user::User;


#[derive(FromForm)]
pub struct LoginForm {
    username: String,
    password: String,
}

#[get("/me")]
pub async fn me(user: Option<&User>) -> Option<(ContentType, String)> {
    match user {
        Some(user) => match to_json_string(&user) {
            Ok(json) => Some((ContentType::JSON, json)),
            Err(_) => None,
        },
        None => None,
    }
}

#[post("/login", data = "<form>")]
pub async fn login(
    cookies: &CookieJar<'_>,
    db: &State<Arc<Database>>,
    form: Form<LoginForm>,
) -> Option<(ContentType, String)> {
    let creds = match Credentials::fetch_by_username(db, &form.username).await {
        Ok(Some(value)) => value,
        _ => return None,
    };

    if verify_password(&creds.pwhash, &form.password).is_err() {
        return None;
    }

    let cookie = Cookie::new("user", creds.username.clone());
    cookies.add_private(cookie);

    let user = User {
        username: creds.username,
    };

    match to_json_string(&user) {
        Ok(json) => Some((ContentType::JSON, json)),
        Err(_) => None,
    }
}

#[get("/logout")]
pub async fn logout(cookies: &CookieJar<'_>) -> () {
    cookies.remove_private("user");

    ()
}
