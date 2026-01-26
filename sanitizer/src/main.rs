use lol_html::{HtmlRewriter, Settings, element};
use std::fs;

fn main() {
    let html = fs::read_to_string("input.html").expect("Could not read file");
    let mut output = Vec::new();

    let mut rewriter = HtmlRewriter::new(
        Settings {
            element_content_handlers: vec![
                // 1. Remove tags explicitly fetching data
                element!("a", |el| {
                    let _ = el.set_attribute("href", "");
                    Ok(())
                }),
                element!("img", |el| {
                    let _ = el.set_attribute("src", "");
                    Ok(())
                }),
                // 2. Remove css, as it can refer to remote
                element!("link", |el| {
                    el.remove();
                    Ok(())
                }),
                element!("style", |el| {
                    el.remove();
                    Ok(())
                }),
                // 3. Remove script and noscript fallback, both can refer to remote
                element!("script", |el| {
                    el.remove();
                    Ok(())
                }),
                element!("noscript", |el| {
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
    fs::write("output.html", result).expect("Could not write file");
}
