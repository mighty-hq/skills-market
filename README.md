# Mighty skills market

The curated skills a Mighty console offers on its Skills page, under **Import from market**. The console reads
`index.json` from this repository's `main` branch, at the address its `AI_SKILL_MARKET_URL` names:

```
https://raw.githubusercontent.com/mighty-hq/skills-market/main/index.json
```

**This repository must stay public.** The console fetches the index and each skill with no credential, so a
private repository answers 404 and the console reads the market as unavailable.

## Layout

- `index.json`: `{ "version": 1, "skills": [{ "key", "name", "description", "url", "bytes", "sha256" }] }`, at
  most 500 entries. It is generated: never edit it by hand.
- `skills/<key>/SKILL.md`: one file per skill. A frontmatter with `name` and `description`, then the instructions
  the assistant follows, in Markdown.
- `scripts/build-index.mjs`: checks every skill and writes `index.json`.

## What the console holds a skill to

- **key**: 2 to 40 lower-case letters, digits and hyphens, a letter first. Not the key of a skill every console
  ships (`mighty-console`, `tasks`, `acceptance`, `on-a-pc`). A company that already holds the key sees the entry
  as "Key in use".
- **name** at most 80 characters, **description** at most 240, the instructions at most 12,000 characters, the
  file at most 65,536 bytes of UTF-8. The file's own `name` and `description` win over the index's.
- **bytes** and **sha256** are the file's exact size and SHA-256. A file that does not match its entry is refused
  as corrupt.
- An import is pinned to the entry a person was shown. A company that imported a skill keeps its copy, and its
  Skills page offers a changed entry as an update.

## Adding or changing a skill

1. Write or edit `skills/<key>/SKILL.md`.
2. Run `node scripts/build-index.mjs` (Node 20 or later). It checks every skill and writes `index.json`.
3. Commit the skill and `index.json` together, and push to `main`. The workflow in `.github/workflows` fails a
   push whose `index.json` is not what the skills make.

GitHub serves raw files from a cache for up to five minutes, so in the first minutes after a push the console may
read a changed skill as corrupt. It settles once the index and the file are served from the same commit.
