# book-series-tracker

I recently started reading few long book series, getting my money’s worth on the Kindle Unlimited subscription. With most series still running, I needed some solution to track upcoming books without having to manually check and track release dates. This is how this ugly baby was born.

The app, while running, will scrape Amazon pages for all configured series once per day, looking for any newly announced books. It then publishes ICS calendar file with all the books. I run it on my laptop and configured my phone to use it as subscription calendar. Like many production-minded folks I am trying to open my heart to Rust, so that’s what the server is written in. It also comes with most basic React UI to add series and monitor scraping jobs. To not overcomplicate auth, any write operations only allowed from local IP addresses, which is good enough for my use.

Couple external deps:
- sqlite3 (database)
- geckodriver (for selenium web scraper)

This is how UI looks like:

![UI screenshot](./screenshot.png)

## Cheatsheet

Unless otherwise noted, all commands in project root dir.

Set up database
```
$ sqlite3 db/bst.db < db/init.sql
```

Run webdriver (for scraping) and server itself:
```
$ geckodriver &
$ ROCKET_LOG_LEVEL=normal ROCKET_ADDRESS=0.0.0.0 cargo run server
```

Synchronize the backend Rust types with TypeScript types used in UI:
```
$ cargo run generate-js
```

Compile  {Type,Java}Script into bundle file (run from `./javascript/` dir):
```
$ npm install && npm run build
```
## Attributions

Icons/glyphs/fonts from https://fonts.google.com/
