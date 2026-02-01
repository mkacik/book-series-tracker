use rocket::http::{ContentType, Status};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::Serialize;
use serde_json::{json, to_string};
use ts_rs::TS;

pub enum ApiResponse {
    Success,
    Data { data: String },
    BadRequest { message: String },
    ServerError { message: String },
}

impl<'r> Responder<'r, 'static> for ApiResponse {
    fn respond_to(self, req: &'r Request<'_>) -> response::Result<'static> {
        match self {
            ApiResponse::Success => Response::build_from("{}".respond_to(req)?)
                .status(Status::Ok)
                .header(ContentType::JSON)
                .ok(),

            ApiResponse::Data { data } => Response::build_from(data.respond_to(req)?)
                .status(Status::Ok)
                .header(ContentType::JSON)
                .ok(),

            ApiResponse::ServerError { message } => {
                let error = wrap_error(&message);

                Response::build_from(error.respond_to(req)?)
                    .status(Status::InternalServerError)
                    .header(ContentType::new("application", "problem+json"))
                    .ok()
            }

            ApiResponse::BadRequest { message } => {
                let error = wrap_error(&message);

                Response::build_from(error.respond_to(req)?)
                    .status(Status::BadRequest)
                    .header(ContentType::new("application", "problem+json"))
                    .ok()
            }
        }
    }
}

impl ApiResponse {
  pub fn from_object<T: Serialize + TS>(object: T) -> ApiResponse {
    let serialized = match to_string(&object) {
      Ok(value) => value,
      Err(error) => return ApiResponse::from_error(anyhow::anyhow!(error)),
    };

    ApiResponse::Data {
      data: serialized
    }
  }

  pub fn from_error(error: anyhow::Error) -> ApiResponse {
    ApiResponse::ServerError {
      message: error.to_string()
    }
  }
}

fn wrap_error(error_message: &str) -> String {
    let error = json!({
      "error": error_message,
    });

    error.to_string()
}
