use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::uri::Origin;
use rocket::request::Outcome;
use rocket::{Data, Request};

use crate::user::User;

pub struct GateKeeper {}

#[rocket::async_trait]
impl Fairing for GateKeeper {
    fn info(&self) -> Info {
        Info {
            name: "Authorize and log writes",
            kind: Kind::Request,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _: &mut Data<'_>) {
        let path = request.uri().path().as_str();

        if !path.starts_with("/api/") || path == "/api/login" {
            return;
        }

        match request.guard::<&User>().await {
            Outcome::Success(_) => return,
            _ => {
                let not_found = Origin::parse("/404").unwrap();
                request.set_uri(not_found);
            }
        };
    }
}
