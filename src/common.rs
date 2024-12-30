use anyhow;
use regex::Regex;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::time::{sleep, Duration};

pub fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis()
        .try_into()
        .unwrap()
}

pub fn validate_asin(asin: &str) -> Result<String, anyhow::Error> {
    let re = Regex::new(r"^B[A-Z0-9]{9}$").unwrap();

    match re.is_match(asin) {
        true => Ok(asin.to_string()),
        false => Err(anyhow::anyhow!(
            "Following string does not look like asin: '{}'",
            asin
        )),
    }
}

pub async fn sleep_seconds(seconds: u64) {
    sleep(Duration::new(seconds, 0)).await;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_asin_ok() {
        assert!(validate_asin("B09FSCHFGK").is_ok());
        assert!(validate_asin(" B09FSCHFGK ").is_err());
        assert!(validate_asin("some other text").is_err());
    }
}
