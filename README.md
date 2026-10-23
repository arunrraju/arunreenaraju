# arunreenaraju.com

Personal portfolio of Arun Reena Raju. A hand-built static site: plain HTML, CSS and a little JavaScript, no build step and no dependencies.

## Run it locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Edit the content

All copy lives in `index.html`. Every spot that still needs real content is marked with a `TODO(content)` comment or `[square brackets]`:

```sh
grep -n "TODO(content)\|\[" index.html
```

- **Résumé:** drop a PDF at `resume.pdf` in the repo root.
- **Project images:** on a `.card__art` element add `style="--img: url(assets/work/name.jpg)"` to replace the generated art.
- **Time zone** for the footer clock: `TIME_ZONE` in `main.js`.
- **Social preview image:** add a 1200×630 `assets/og.png`.

## Features

- Real-time liquid-chrome WebGL hero and a chrome orb for Metzee (hand-written shader, no libraries)
- Intro counter, letter-by-letter name reveal, words that light up as you read the bio
- Pinned horizontal scroll through selected work on desktop, swipe carousel on phones
- Custom cursor with labels, magnetic buttons, ⌘K / Ctrl+K command menu, live local clock
- Dark and light themes, fully responsive, keyboard accessible, respects reduced motion
- SEO basics: meta and Open Graph tags, JSON-LD `Person`, sitemap, robots.txt, 404 page

## Deploy

> The domain `arunreenaraju.com` isn't registered yet. Until you buy it, the site still works at `https://arunrraju.github.io/arunreenaraju/` once Pages is enabled (skip step 2). After buying it at any registrar, do steps 2 and 3.

`.github/workflows/pages.yml` publishes the site to GitHub Pages on every push to `main`.

1. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Under **Custom domain**, enter `arunreenaraju.com` (the `CNAME` file already contains it) and tick **Enforce HTTPS** once it's available.
3. At your domain registrar, add DNS records:
   - `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - a `CNAME` record for `www` pointing to `arunrraju.github.io`
