CREATE TABLE series(
  asin TEXT NOT NULL UNIQUE PRIMARY KEY,
  name TEXT,
  time_first_seen INT
);

CREATE TABLE books(
  asin TEXT NOT NULL UNIQUE PRIMARY KEY,
  series_asin INT NOT NULL,
  ordinal INT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  day INT,
  month INT,
  year INT,
  time_first_seen INT
);

CREATE TABLE jobs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  params TEXT NOT NULL,
  status TEXT NOT NULL,
  errors TEXT,
  time_created INT NOT NULL,
  time_started INT,
  time_finished INT
);

create TABLE calendar_url_keys(
  url_key TEXT NOT NULL UNIQUE PRIMARY KEY,
  time_generated INT,
  active BOOLEAN
);