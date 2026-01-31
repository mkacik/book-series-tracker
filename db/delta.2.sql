CREATE TABLE subscriptions (
  username TEXT NOT NULL,
  series_asin TEXT NOT NULL,
  PRIMARY KEY (username, series_asin)
);
