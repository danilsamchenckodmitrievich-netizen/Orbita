# Орбита

Free practice website for primary school (grades 2–4) in Russian: Russian language, maths, English, the world around us (окружающий мир) and literary reading. Each topic has a short rule with examples and three difficulty levels. After every level the site gives an automatic grade and awards points, ranks and badges.

**Live site:** https://danilsamchenckodmitrievich-netizen.github.io/Orbita/

## What's inside

| | |
|---|---|
| Content | 3 grades × 5 subjects × 6 topics = **90 topics**, each with **easy / medium / hard** levels of 5 tasks: **1,350 tasks** |
| Task types | multiple choice (options are shuffled each attempt) and typed answers (case, `ё`/`е`, spaces in numbers and trailing punctuation are ignored) |
| Grading | shown after each level: grade **5 / 4 / 3 / 2** (≥90% / ≥70% / ≥50% / below), 0–3 stars, accuracy, time, and a per-question review with the correct answer and an explanation |
| Points | 10 / 20 / 30 per correct answer (easy / medium / hard), +1 answer's worth for a flawless level, +5 per day of streak on the first lesson of the day. Repeating a level without beating your best gives half points |
| Rewards | 12 ranks, 14 avatars that unlock with rank, 24 badges, a daily points goal and a day streak |
| UI | phone-first layout with a sidebar layout on desktop, light/dark theme, keyboard shortcuts (1–4 and Enter), sounds (can be turned off), installable as a PWA |

Progress is stored in the browser (`localStorage`, key `orbita-v2`). Progress from the previous single-file version (`orbita-v1`) is migrated automatically.

## Deploying to GitHub Pages

The site is published from the `main` branch (Settings → Pages → **Deploy from a branch**, `main`, `/ (root)`). Every push to `main` updates the live site within a minute or two. The `.nojekyll` file makes Pages serve the files as they are.

The workflow `.github/workflows/pages.yml` checks the content on every push and pull request. If you switch Settings → Pages → Source to **GitHub Actions**, the same workflow also builds and deploys the site itself and adds a version to file URLs, so browsers pick up updates immediately.

## Project structure

```
index.html                  page shell
404.html                    "page not found" page
manifest.webmanifest        PWA manifest
assets/css/app.css          styles (light and dark theme)
assets/js/app.js            app: routing, lessons, grading, points, ranks, badges
assets/js/data/grade2.js    tasks for grade 2 (grade3.js, grade4.js likewise)
assets/icons/               favicon and app icons
scripts/validate.mjs        content and build checks (run in CI)
```

There is no build step. To preview locally, run `python3 -m http.server` in the repository folder and open http://localhost:8000. Opening `index.html` directly from disk also works.

## Adding or editing tasks

Topics live in `assets/js/data/grade*.js`. Each topic looks like this:

```js
{id:'m2-div', title:'Деление',
 theory:'<p>Rule text, simple HTML allowed</p>',
 examples:['12 : 3 = 4','10 : 2 = 5'],
 easy:[ /* 5 tasks */ ], medium:[ /* 5 tasks */ ], hard:[ /* 5 tasks */ ]}
```

Two task formats:

```js
['Question?', ['option A','option B','option C'], 1, 'Explanation']   // multiple choice, 1 = index of the correct option
['Question?', 'answer|another accepted answer', 'Explanation']         // typed answer
```

Keep `id` stable once a topic is published, because saved progress is keyed by it. Then check the content:

```
node scripts/validate.mjs
```

It reports broken task formats, out-of-range answer indexes, duplicate options or IDs, unclosed tags in rules, simple arithmetic questions whose answer is wrong, and missing files.
