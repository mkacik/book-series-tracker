use rocket_dyn_templates::{context, Template};

#[get("/")]
pub async fn index() -> Template {
    Template::render("index", context! {})
}

// Static files are hardcoded to rank 10, so catch-all route needs to have higher rank
#[get("/<_..>", rank = 11)]
pub async fn catchall() -> Template {
    index().await
}

#[get("/login")]
pub async fn login() -> Template {
    Template::render("login", context! {})
}
