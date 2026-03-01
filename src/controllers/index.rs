use rocket::fs::NamedFile;
use rocket::response::status;

#[get("/")]
pub async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/index.html").await
}

#[get("/404")]
pub async fn not_found() -> status::NotFound<()> {
    status::NotFound(())
}

// Static files are hardcoded to rank 10, so catch-all route needs to have higher rank
#[get("/<_..>", rank = 11)]
pub async fn catch_all() -> Result<NamedFile, std::io::Error> {
    index().await
}
