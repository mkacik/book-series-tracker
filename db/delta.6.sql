ALTER TABLE series ADD COLUMN author TEXT NOT NULL DEFAULT "";

UPDATE series
SET author = (
  SELECT author FROM books
  WHERE books.series_asin = series.asin
  ORDER BY ordinal ASC
  LIMIT 1
);
