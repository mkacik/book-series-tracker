use rocket::form::{Form, FromForm};
use rocket::http::{Cookie, CookieJar};
use rocket::{post, State};
use std::sync::Arc;

use crate::credentials::Credentials;
use crate::crypto::verify_password;
use crate::database::Database;
use crate::response::ApiResponse;
use crate::user::User;

#[derive(FromForm)]
pub struct LoginForm {
    username: String,
    password: String,
}

#[get("/me")]
pub async fn me(user: Option<&User>) -> ApiResponse {
    match user {
        Some(user) => ApiResponse::from_object(user),
        None => ApiResponse::NotFound,
    }
}

#[post("/login", data = "<form>")]
pub async fn login(
    cookies: &CookieJar<'_>,
    db: &State<Arc<Database>>,
    form: Form<LoginForm>,
) -> ApiResponse {
    let creds = match Credentials::fetch_by_username(db, &form.username).await {
        Ok(Some(value)) => value,
        _ => return ApiResponse::NotFound,
    };

    if verify_password(&creds.pwhash, &form.password).is_err() {
        return ApiResponse::NotFound;
    }

    let cookie = Cookie::new("user", creds.username.clone());
    cookies.add_private(cookie);

    let user = User {
        username: creds.username,
    };

    ApiResponse::from_object(user)
}

#[get("/logout")]
pub async fn logout(cookies: &CookieJar<'_>) -> ApiResponse {
    cookies.remove_private("user");

    ApiResponse::Success
}
