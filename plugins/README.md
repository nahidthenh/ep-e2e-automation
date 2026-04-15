# Plugin Staging Directory

This directory is **gitignored**. Place your local EmbedPress plugin builds here
before running the setup, **or** point the env vars directly to your checkout.

## Option A — Symlink / copy into this directory

```bash
ln -s /path/to/EmbedPress/embedpress      plugins/embedpress
ln -s /path/to/EmbedPress/embedpress-pro  plugins/embedpress-pro
```

Then in `.env`:
```
EP_FREE_PLUGIN_PATH=./plugins/embedpress
EP_PRO_PLUGIN_PATH=./plugins/embedpress-pro
```

## Option B — Point directly to your checkout

In `.env`:
```
EP_FREE_PLUGIN_PATH=../EmbedPress/embedpress
EP_PRO_PLUGIN_PATH=../EmbedPress/embedpress-pro
```

## Option C — Leave empty (wordpress.org fallback)

If neither env var is set, `setup-wp.sh` installs the latest free version
from wordpress.org. EmbedPress Pro will be skipped.
