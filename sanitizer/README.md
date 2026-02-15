This script will clean up all (hopefully) tags that call into remote urls, to minimize spamming
with testing requests. Just saving a page is not enough to get good input, as it will preserve
the original html, not the html representing what you currently see in the browser. To get good
inputs for testing in `sanitize` dir follow this steps:

1. Open series/book page in a browser
2. If series has more than 20 books, click "Show All"
3. Open devtools in elements view
4. Copy html tag to clipboard
5. Paste to text editor
6. Save as `book.html` or `series.html`
7. `cargo run {book,series}` will produce corresponding `{book,series}_out.html`
