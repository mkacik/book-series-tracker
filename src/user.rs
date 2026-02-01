use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use rocket::State;
use serde::Serialize;
use std::sync::Arc;
use ts_rs::TS;

use crate::common::TS_FILE;
use crate::credentials::Credentials;
use crate::database::Database;

/* This struct is used as request guard to ensure logged in user, and on the
frontend to display username, and is returned by /me and /login api routes. If
at any point need arises to add more fields here, remove TS trait, and create
lightweight object with just username to return from login routes instead */
#[derive(Serialize, TS, Debug)]
#[ts(export_to = TS_FILE)]
pub struct User {
    pub username: String,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for &'r User {
    type Error = std::convert::Infallible;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let user = request
            .local_cache_async(async {
                let username = match request.cookies().get_private("user") {
                    Some(cookie) => String::from(cookie.value()),
                    None => return Err(()),
                };

                let db = match request.guard::<&State<Arc<Database>>>().await {
                    Outcome::Success(value) => value,
                    _ => return Err(()),
                };

                match Credentials::fetch_by_username(db, &username).await {
                    Ok(Some(_)) => Ok(User { username: username }),
                    _ => Err(()),
                }
            })
            .await;

        match user {
            Ok(value) => Outcome::Success(value),
            _ => Outcome::Forward(Status::Unauthorized),
        }
    }
}
