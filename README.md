# $INTERN — Unpaid. Unstoppable.

The website for **$INTERN**, a meme coin on the Arc chain.

**Live:** [internonarc.fun](https://internonarc.fun) · **X:** [@internonarc](https://x.com/internonarc)

Contract: `0xFc6BA595B82dDbD6913c3D4221b178af171Dc168`

> Always verify the contract address against [@internonarc](https://x.com/internonarc) before trading.

## The idea

Scroll is the intern's shift clock. The page opens at 09:00 AM in a sunlit office and ends at 03:33 AM with a single monitor still glowing: the background colour, the LED clock in the header and the ceiling lamps all move with the hour, while the blue intern never logs off.

## Running it locally

Plain static HTML, CSS and JS — no build step, no dependencies. Serve the `site/` folder over HTTP (opening `index.html` directly blocks the self-hosted fonts):

```bash
cd site
npx serve .
```

## Layout

```
site/
  index.html      all sections, in shift order
  styles.css      design tokens, layout, self-hosted @font-face
  main.js         CONFIG (contract + links), shift clock, scroll motion
  _headers        cache headers for Cloudflare
  assets/         illustrations, stickers, fonts
```

Contract address and links live in the `CONFIG` object at the top of `site/main.js`; nothing else needs editing to point the site at a different token.

Fonts: Anton, Archivo and Courier Prime, self-hosted from Google Fonts under the SIL Open Font License.

## Licence

Code is free to reuse. The illustrations of the intern character in `site/assets/` are not — they belong to the $INTERN project.
