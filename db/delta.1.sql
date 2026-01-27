ALTER TABLE books ADD COLUMN release_date TEXT;

UPDATE books SET release_date = year || "-" || printf("%02d", month) || "-" || printf("%02d", day) WHERE day IS NOT NULL;

ALTER TABLE books DROP COLUMN day;
ALTER TABLE books DROP COLUMN month;
ALTER TABLE books DROP COLUMN year;
