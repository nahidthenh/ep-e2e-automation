---
name: update-sources
description: Add new entries to or update existing entries in sources.json at the repo root. Triggers when the user wants to add/update an embed source name and URL (e.g. "add a new source", "update the YouTube url", "add Spotify embed").
---

# update-sources

Maintains `sources.json` at the root of this repo. The file is a JSON array of objects, each with two keys: `source` (display name) and `url` (string or `null`).

## File location

- Path: `sources.json` (repo root, e.g. `/Users/md.nahidhasan/ep-docker-e2e/sources.json`)
- Format: JSON array, 4-space indentation, keys in order `source` then `url`.

## When to use

- User asks to add a new source entry (name + URL).
- User asks to update the URL of an existing source.
- User asks to rename a source.
- User asks to remove a source.

## Inputs to confirm before editing

If the user supplies only one of these, ask for the other before writing:
- `source`: the display name (e.g. "YouTube", "Spotify Album"). Must be unique unless intentionally renaming a duplicate (existing file already has variants like `"Adilo (New)"`).
- `url`: the embed/share URL string, or `null` if no URL is available yet (precedent: `LottieFiles` is `null`).

## How to add a new source

1. Read `sources.json`.
2. Check for an existing entry with the same `source` name. If one exists, ask the user whether to update it instead of adding a duplicate.
3. Append the new object at the end of the array (preserve historical order — do not reorder existing entries).
4. Use Edit to insert before the closing `]`, keeping 4-space indentation and a trailing comma on the previous entry.

New entry shape:

```json
{
    "source": "<NAME>",
    "url": "<URL_OR_NULL>"
}
```

## How to update a source

- For URL updates: use Edit with enough surrounding context (the matching `"source": "<NAME>"` line plus its `"url"` line) to make the match unique.
- For renames: edit the `source` value only.
- For removal: delete the full object plus the trailing comma; if removing the last entry, fix the comma on the now-last entry.

## After editing

- Validate JSON: `python3 -m json.tool sources.json > /dev/null` (or `node -e "JSON.parse(require('fs').readFileSync('sources.json'))"`).
- Report the change in one line: what was added/updated/removed.

## Don'ts

- Do not reformat the entire file (no key reordering, no indentation changes, no sorting).
- Do not strip query strings from URLs unless the user asks — many existing entries rely on `?embedded=true`, `?si=...`, etc.
- Do not commit unless the user explicitly asks.
