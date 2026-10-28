# VN Tracker (VNDB)

The VN tracker page reads a public [VNDB](https://vndb.org) list and shows it as a poster shelf: playing, finished, wishlist, stalled and dropped visual novels. The browser asks VNDB's official API directly, so nothing is fetched at build time and a refresh picks up list changes.

## Enable

Uncomment the `vndb` section in `config/site.yaml` and set your user id (like `u12345`, from your VNDB profile URL) or username:

```yaml
vndb:
  userId: u12345
  # label: VN Tracker           # nav name; defaults to the i18n key nav.vndb
  # icon: ri:gamepad-fill       # nav icon
  # hideCoverAbove: 1.8         # cover-hiding threshold, see below
```

Comment the section out to disable it: the page, nav entry and `/vn` route all disappear. Restart the dev server or rebuild after changing the config. The list must be public; entries labelled `Blacklist` are not shown.

## The page

- Status tabs (All / Finished / Playing / Wishlist / Stalled / Dropped), a sort control, and the total play time you reported on VNDB.
- Sort by last updated, date added, release date, date finished, title, your vote or community rating. Entries without a value always sort last.
- The title opens the VNDB page. The cover opens a detail window with a larger cover, titles per language, release date, play time, developers, publishers, languages, platforms, ratings, tags, external links and the description. The window's cover zooms like an article image.
- Details are requested only when a window opens, once per visit. Spoiler blocks, spoiler tags and sexual-content tags are never shown.

## Hidden covers

VNDB flags each cover's `sexual` and `violence` level as an average from 0 to 2. When either is **above** `hideCoverAbove` (default 1.8), a placeholder is shown instead: the image URL is not put in the page or requested until the visitor clicks "Show cover". A revealed cover can be hidden again, and covers are hidden again after a reload. The threshold must be between 0 and 2; other values fall back to the default.

## Limitations

- The VNDB API exposes only the total of your play-time votes, not the time you reported per VN. The play time in the detail window is the community average.
- At most 2000 list entries are read (`MAX_API_PAGES` × 100 per page).
- Titles are localized only with official VNDB translations, falling back to the original title.

Tests: `pnpm test:vndb`.
