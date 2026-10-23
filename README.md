# arunreenaraju.com

Personal portfolio of Arun Reena Raju. A hand-built static site: plain HTML, CSS and a little JavaScript, no build step and no dependencies.

## Run it locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Edit the content

All text, photos and lists live in `content.json`. `content.js` fills the page from it when it loads, then starts `main.js`. The same content is also written into `index.html`, so the page still shows something if the file can't load; that fallback doesn't update when you edit through the CMS.

### With Pages CMS (no code)

1. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub.
2. Open `arunrraju/arunreenaraju` and pick the `main` branch.
3. Edit **Website content**: hero, portrait, about, Metzee, work, gallery, experience, education, toolkit and contact. Upload photos from the same screen; they go into `assets/photos/`.
4. Save. Pages CMS commits the change, and the site redeploys in a minute or two.

The form layout is defined in `.pages.yml`.

### By hand

Edit `content.json` directly on GitHub (pencil icon) or locally. Lists are ordered as they appear on the page.

- **Gallery sizes:** `tall` (3:4), `half` (4:5), `hero` (4:3), `wide` (16:10), `full` (21:9).
- **Work cover images:** set `image` on a work item to replace the generated art.
- **Time zone** for the nav clock: `TIME_ZONE` in `main.js`.
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
