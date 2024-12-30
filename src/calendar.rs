use chrono::naive::NaiveDate;
use chrono::DateTime;
use icalendar::{Calendar, Component, Event, EventLike, Property};

use crate::books::Book;

pub fn get_calendar_string(books: Vec<Book>) -> String {
    let mut calendar = get_calendar();

    for book in books {
        let event = get_event(book);
        calendar.push(event);
    }

    format!("{}", calendar)
}

fn get_calendar() -> Calendar {
    let mut calendar = Calendar::new();
    calendar.append_property(Property::new("METHOD", "PUBLISH"));
    calendar.append_property(Property::new(
        "PRODID",
        "-//MK//BookSeriesTracker 0.1 (ICALENDAR-RS)//EN",
    ));

    calendar
}

fn get_event(book: Book) -> Event {
    let release_date =
        NaiveDate::from_ymd_opt(book.year.try_into().unwrap(), book.month, book.day).unwrap();
    let first_seen_ts =
        DateTime::from_timestamp(book.time_first_seen, 0 /* nanoseconds */).unwrap();

    Event::new()
        .uid(&book.asin)
        .summary(&book.title)
        .description(&format!("{} by {}", book.title, book.author))
        .url(&format!("https://www.amazon.com/gp/product/{}", book.asin))
        .all_day(release_date)
        .timestamp(first_seen_ts)
        .done()
}
