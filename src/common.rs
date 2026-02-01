use std::time::{SystemTime, UNIX_EPOCH};
use tokio::time::{sleep, Duration};

pub const TS_FILE: &str = "types.ts";

pub fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis()
        .try_into()
        .unwrap()
}

pub async fn sleep_seconds(seconds: u64) {
    sleep(Duration::new(seconds, 0)).await;
}
