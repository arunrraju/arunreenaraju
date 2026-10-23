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

- **Résumé:** drop a PDF at `/resume.pdf`.
- **Project images:** add `data-image="/assets/work/name.jpg"` to a `<li class="work__item">` and the hover preview shows it instead of the gradient.
- **Time zone** for the footer clock: `TIME_ZONE` in `main.js`.
- **Social preview image:** add a 1200×630 `assets/og.png`.

## Features

- Light and dark themes (follows the system, with a toggle that remembers your choice)
- Command menu on ⌘K / Ctrl+K
- Cursor-following project previews, scroll reveals, count-up stats, live local clock
- Fully responsive, keyboard accessible, respects reduced-motion
- SEO basics: meta and Open Graph tags, JSON-LD `Person`, sitemap, robots.txt, 404 page

## Deploy

> The domain `arunreenaraju.com` isn't registered yet. Buy it first (any registrar works: Cloudflare, Namecheap, Porkbun, Google/Squarespace), then follow the steps below. Until then the site works at `https://arunrraju.github.io/arunreenaraju/` only if you remove the `CNAME` file, since all asset paths are root-relative; with the domain set up, no changes are needed.

`.github/workflows/pages.yml` publishes the site to GitHub Pages on every push to `main`.

1. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Under **Custom domain**, enter `arunreenaraju.com` (the `CNAME` file already contains it) and tick **Enforce HTTPS** once it's available.
3. At your domain registrar, add DNS records:
   - `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - a `CNAME` record for `www` pointing to `arunrraju.github.io`
