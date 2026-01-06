use rocket_dyn_templates::{context, Template};


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
