use clap::{Parser, Subcommand};
use lol_html::{element, HtmlRewriter, Settings};
use std::fs;

#[derive(Parser)]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Book,
    Series,
}

fn sanitize(input_filename: &str, output_filename: &str) {
    let html = fs::read_to_string(input_filename).expect("Could not read file");
    let mut output = Vec::new();

    let mut rewriter = HtmlRewriter::new(
        Settings {
            element_content_handlers: vec![
                // 1. Rewrite all anchor links to point to self
                element!("a", |el| {
                    let _ = el.set_attribute("href", "");
                    Ok(())
                }),
                // 2. Remove scripts
                element!("script", |el| {
                    el.remove();
                    Ok(())
                }),
                element!("noscript", |el| {
                    el.remove();
                    Ok(())
                }),
                element!("iframe", |el| {
                    el.remove();
                    Ok(())
                }),
                // 3. Remove all tags that are not relevant for scrape and can cause remote fetch
                element!("link", |el| {
                    el.remove();
                    Ok(())
                }),
                element!("style", |el| {
                    el.remove();
                    Ok(())
                }),
                element!("img", |el| {
                    el.remove();
                    Ok(())
                }),
                element!("picture", |el| {
                    el.remove();
                    Ok(())
                }),
            ],
            ..Settings::default()
        },
        |c: &[u8]| output.extend_from_slice(c),
    );

    rewriter.write(html.as_bytes()).unwrap();
    rewriter.end().unwrap();

    let result = String::from_utf8(output).unwrap();
    fs::write(output_filename, result).expect("Could not write file");
}

fn main() {
    let args = Args::parse();
    let (input_filename, output_filename) = match args.command {
        Command::Book => ("book.html", "book_out.html"),
        Command::Series => ("series.html", "series_out.html"),
    };

    sanitize(input_filename, output_filename);
}
