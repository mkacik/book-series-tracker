use rocket::fs::NamedFile;

#[get("/")]
pub async fn index() -> Result<NamedFile, std::io::Error> {
  NamedFile::open("www/index.html").await
}

// Static files are hardcoded to rank 10, so catch-all route needs to have higher rank
#[get("/<_..>", rank = 11)]
pub async fn catchall() -> Result<NamedFile, std::io::Error> {
    index().await
}
