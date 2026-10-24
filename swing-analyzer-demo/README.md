# Swing Analyzer: interactive portfolio demo

This is the **real Swing Analyzer web app** (the same React + TradingView Lightweight Charts frontend, the same screens, the same dark "Command center" theme) running entirely in the browser on **made-up sample data**.
There is no backend: every request the app would send to its server is answered from recorded JSON files in `fixtures/`. Nothing calls Yahoo, NSE or any other market data source.

All 42 companies (Novatek Systems, Skylark Airways, Novalight Semis, ...) are invented, and so are their prices, scores, results dates and the market ticker values.
The data was recorded by running the app's own backend on synthetic price histories, so every panel, score, chart drawing and plan level is what the real app computes.
A "Demo · sample data · not investment advice" banner sits on top of every page, and the app's trade-call wording is shown as setup labels ("Setup active", "Near support", "Breakout setup", "Trigger").

## What a visitor can try

| Page | What works |
|---|---|
| **Today** | Daily plan with market mood, live ticker, top setup card with stop / entry / target bar, "Also active", "Setting up this week", open sample trades, results calendar, breakouts and breakdowns, sector strength, commodities and currencies, top movers, live alerts, IPOs. Sub-tabs: Plan, All ideas, Alerts. India / US toggle. |
| **Trade** | Full chart workspace: 1m to monthly timeframes, 1 / 2 / 4 chart layouts, indicators, drawing tools (trendlines, Fibonacci, rectangles, text...), auto support / resistance, plan levels on the chart, live ticking price, watchlist and idea lists on the left, trade plan and "why" on the right. |
| **Analyze** | The long report for any sample stock: score breakdown, technicals, fundamentals, news tone, events. |
| **Screener** | Streams a scan over the sample lists, sortable results, click to open a chart. |
| **Movers** | Live movers board from a simulated session: best rides, high-of-day momentum tape, gappers, gainers, volume spikes, losers. |

Drawings, watchlist stars and alert reads work for the visit and are forgotten on reload. Paper trades, real-trade logging and settings politely say they are off in the demo.

## Files

```
index.html            the app shell
assets/               the built app (one JS file, one CSS file)
icon.svg, apple-touch-icon.png
fixtures/common.json  plan, Today panels, movers, alerts... for India and the US
fixtures/stocks/*.json  one file per sample stock (charts for every timeframe, analysis), loaded only when opened
fixtures/screen-*.json  screener rows
embed-example.html    reference embed for the portfolio page (responsive iframe, quick links, full-screen link)
```

All paths are relative, so the folder works from any sub-path. It needs to be served over http(s) (not opened as a `file://`), because the app loads `fixtures/*.json` with fetch.
Size: about 1 MB of app plus about 14 MB of JSON (2 to 3 MB gzipped); a visitor downloads `common.json` plus only the stocks they open.

## Embedding it in the portfolio site

1. Copy the folder into the site's static folder as `public/swing-analyzer-demo/` (Next.js, Vite, Astro and others serve `public/` as-is). It is then live at `/swing-analyzer-demo/index.html`.
2. Embed it in an iframe on the project page. **`embed-example.html` in this folder is a ready-made reference**: quick links to each section, a responsive iframe and an "Open full screen" link. Open it in a browser (served over http) to see it, then copy its `.swing-demo` block, CSS and script into the page, with the src changed to `/swing-analyzer-demo/index.html#plan`.

### Phones

The app picks its layout from the width it gets, so inside an iframe on a phone it shows its real phone layout: the bottom tab bar, a stacked Today page and a full-width chart. For that to work:

- the iframe must be the full screen width on phones (the example goes edge to edge below 760px) and nearly the screen height (`calc(100svh - 64px)`);
- do not shrink it with CSS `transform: scale(...)` or put it in a fixed-width box;
- the portfolio page needs the usual `<meta name="viewport" content="width=device-width, initial-scale=1">`.

When the demo runs inside an iframe, its yellow banner adds an **Open full screen ↗** link that opens the same page in its own tab. On a phone that is the most comfortable way to use it.

Tested on iPhone 13 and Pixel 7 sizes, both standalone and inside the example embed: phone layout, bottom tab bar, live chart, movers.

Deep links: `#plan` (Today), `#trade/NSE/SKYLARK`, `#trade/US/NVLT`, `#analyze/NSE/NOVATEK`, `#screener`, `#movers`.

### Do not

- Do not import its JS or CSS into the portfolio's own pages: the app overrides `window.fetch` and `Date` inside its page, and its CSS is global. The iframe keeps both isolated.
- Do not rename `fixtures/` or move files inside it.

## Rebuilding (in the swing-analyzer repo)

```
pip install time-machine                # once
python portfolio-demo-src/record.py   # runs the real backend on synthetic data, writes fixtures/
python portfolio-demo-src/build.py    # builds frontend/ with the demo patches into portfolio-demo/
```

`build.py` copies the current `frontend/`, adds `src/demo/` (fetch / EventSource mock, frozen demo clock, wording rules, banner) and applies a few small patches (pages shown, sub-tabs, footer). If a later app change breaks a patch, the build stops and names it.
