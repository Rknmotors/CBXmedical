# CBX Medical — botanical storefront (preview)

A design proposal for CBX Medical. Static site: no build step needed to view it,
no server, no database.

## Pages
| file | what it is |
|---|---|
| `index.html` | home — the opening sequence and three highlights |
| `shop.html` | the twelve products, filterable by range |
| `commitment.html` | where we stand, the quote, the legal notice |
| `professionals.html` | training and R&D |
| `journal.html` | what CBX publishes |

`index.html` is the only place the shell lives — navigation, footer, bag and
scripts. The other four pages are generated from it plus the fragments in
`content/`. After editing `index.html`, `botanical.css`, `shop.js` or anything in
`content/`, run:

    node build.mjs

It rebuilds the four pages and fails loudly if a navigation or footer has drifted.

## The bag
Lives in the browser (`localStorage`, key `cbx-bag-v1`), so it follows the visitor
from page to page and survives a refresh. On checkout the product handles are
resolved against the live CBX catalogue and handed to the CBX cart permalink:

    https://cbxmedical.com/en/cart/<variantId>:<qty>,<variantId>:<qty>

CBX Medical owns pricing, stock, promotions, payment and delivery from there. If the
shop cannot be reached, the bag is kept and the visitor gets direct product links.

## Open points
- Prices are a snapshot of 23 Nov 2026. The shop runs an automatic BLACK FRIDAY
  promotion, so the checkout total can be lower than the estimate in the bag.
- "3,000+ health professionals trained" and the R&D partnerships are claims carried
  over from the current CBX site; they should be substantiated before launch.
- Journal links, event dates and press names point at the shop home page until the
  real URLs are supplied.
- No new medical claim has been added anywhere.

Product photography: CBX Medical. Every product in `products/` is cut out on a
transparent background and trimmed to the product itself, so the cards can drop
their tiles and the products scale alike. The four MetaFibro bottles were shot on
a table and were cut out here; if CBX has packshots of them, drop those in instead. Botanical cover: generated for this design.
