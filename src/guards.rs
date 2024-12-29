use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};

pub struct LocalUser;

#[rocket::async_trait]
impl<'r> FromRequest<'r> for LocalUser {
    type Error = std::convert::Infallible;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match request.remote() {
            Some(addr) => match addr.ip().is_loopback() {
                true => Outcome::Success(LocalUser),
                false => Outcome::Forward(Status::NotFound),
            },
            None => Outcome::Forward(Status::NotFound),
        }
    }
}
