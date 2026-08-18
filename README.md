# NextGen Starter Theme for Rock RMS

A generic **external (public website) theme** for [Rock RMS](https://www.rockrms.com/)
built on the v18 **NextGen theme system** — `theme.json` fields, the
`styles-v2` design tokens, and dark mode. Use it as a starting point for your
own public site theme, or as a worked example of how the NextGen pieces fit
together.

## What it demonstrates

- **`theme.json` fields editor** — brand colors, logo, interface/status
  palettes, and typography are all editable in Rock's admin UI
  (`Admin Tools > CMS Configuration > Themes`) with no rebuild or deploy.
- **The `styles-v2` token system** — the theme's CSS is written against Rock's
  semantic tokens (`--color-interface-*`, `--color-primary`, …), so it inherits
  Rock's whole component surface by importing one file.
- **Dark mode, for free** — core.css remaps the semantic tokens under
  `[theme=dark]` / `prefers-color-scheme`; because every rule here uses tokens,
  light and dark both work with no per-rule effort. (A documented block in
  `Styles/_tokens.scss` pins the site to light if your brand requires it.)
- **A dependency-light public chassis** — fixed header with logo + dropdown
  navigation, page-title band, footer, back-to-top. Vanilla JS only; no
  jQuery plugins, no CSS framework beyond what Rock itself provides.
- **The full layout set** — Homepage, FullWidth, Left/RightSidebar, Blank,
  Dialog, and Error, wired the way Rock expects.

## Requirements

| What | Why |
|---|---|
| Rock RMS **v18.1+** (18.2+ recommended) | The `theme.json` / styles-v2 system shipped in v18. 18.1 needs two app restarts to discover a new theme; 18.2+ needs one. |
| **Node.js 18+** (only to build CSS) | `Styles/theme.css` is compiled from SCSS with [dart-sass](https://sass-lang.com/dart-sass/) at development time. Rock does **not** compile NextGen themes — the compiled `theme.css` ships with the theme, which is why it is committed to this repo. |

You do **not** need Node on the Rock server. If you never change the SCSS, you
never need Node at all.

## Building the CSS

```bash
npm install        # installs dart-sass (the only dependency)
npm run build      # Styles/theme.scss -> Styles/theme.css
npm run watch      # same, in watch mode
npm run check      # consistency gates (see "Guard rails" below)
```

Never hand-edit `Styles/theme.css`. It is **machine-owned twice over**: your
build overwrites it locally, and on the server Rock's `ThemeService.BuildTheme`
rewrites its marker regions in place every time theme settings are saved. Edit
`Styles/theme.scss` / `_tokens.scss` / `_components.scss` and rebuild.

## Deploying to a Rock server

1. **Copy the theme folder.** Place the contents of this repo at:

   ```
   RockWeb/Themes/NextGenStarter/
   ```

   (`node_modules/` and `tools/` don't need to be copied, but are harmless.)
   If you use a different folder name, also update the two places that
   reference it by name: the `Site Logo` default path in `theme.json` and the
   stylesheet path in `Layouts/Error.aspx`.

2. **Make sure the app pool user can write to the theme folder.** Rock
   rewrites `Styles/theme.css` in place when theme settings are saved; without
   write access the fields editor silently does nothing.

3. **Restart the Rock application** (recycle the app pool or touch
   `web.config`). Theme discovery runs at app start — there is no install
   step, no migration, no plugin.

   *On Rock 18.1 specifically:* the first restart registers the theme but does
   not parse its `theme.json`; restart a **second** time. 18.2+ needs one.

4. **Verify before selecting.** In `Admin Tools > CMS Configuration > Themes`,
   confirm **NextGen Starter** appears, is active, and shows purpose
   **Website NextGen** (not *Website Legacy* — legacy means `theme.json`
   wasn't parsed yet or failed validation). Open it and confirm the fields
   editor renders.

5. **Select it on your external Site** (`CMS Configuration > Sites > your
   site > Theme`), then set up pages:
   - Point the site's pages at this theme's layouts (`Homepage`, `FullWidth`,
     `LeftSidebar`, `RightSidebar`).
   - Add a **Page Menu** block to the `Nav` zone with template
     `{% include '~~/Assets/Lava/PageNav.lava' %}` and 2 levels.
   - Add footer content to the `Footer` / `FooterNav1–3` zones
     (`Assets/Lava/Footer.lava` is a starting point for the identity block;
     Page Menu blocks with `PageSubNav.lava` work well in the nav columns).

6. **Prove the round trip.** Save any theme setting in the fields editor, then
   re-fetch `/Themes/NextGenStarter/Styles/theme.css` and confirm (a) all four
   `CSS Overrides` markers survived and (b) a `:root { --base-primary: ... }`
   block now appears in the bottom region. That round trip is the proof that
   Rock and the theme agree on the rewrite contract.

Keep your previous theme selected on the Site until steps 4–6 pass on a
staging environment.

## How the pieces fit

```
theme.json                 What the admin can edit (fields -> CSS variables)
Styles/
  theme.scss               Entry point: Rock's marker regions + imports
  _tokens.scss             :root declarations of every theme.json default
  _components.scss         This theme's components (header, nav, footer, ...)
  theme.css                COMPILED OUTPUT - committed, served, rewritten by Rock
Layouts/
  Site.Master              Public chassis: header/nav/footer + Rock plumbing
  Homepage.aspx            Full-bleed Feature zone + content sections
  FullWidth.aspx           Page-title band + Main + Section A-D zones
  LeftSidebar.aspx         Sidebar 1 + Main
  RightSidebar.aspx        Main + Sidebar 1
  Blank.aspx               Bare zone (embeds, kiosks)
  Dialog.aspx              Rock's modal host - do not simplify
  Error.aspx(.cs)          Splash error page
Assets/
  Lava/PageNav.lava        Main nav template for the Page Menu block
  Lava/PageSubNav.lava     Sidebar sub-nav template
  Lava/Footer.lava         Footer identity starter
  Scripts/theme.js         Vanilla JS: mobile menu, dropdowns, back-to-top
  Images/logo.svg          Placeholder logo (replace via the fields editor)
tools/                     Consistency checks (run via npm run check)
```

The chain that makes the fields editor work:

1. `theme.scss` imports Rock's `../../../Styles/styles-v2/core.css` — the
   whole token + component system. dart-sass passes that `.css` import through
   verbatim and hoists it to the top of the compiled file.
2. `_tokens.scss` declares the theme's own `--base-*` values on `:root`,
   **after** the import, so they beat core's defaults.
3. When an admin saves theme settings, Rock rewrites the
   `/* CSS Overrides Bottom Start */ ... End */` region at the very end of
   `theme.css` with `:root { --variable: value; }` — beating `_tokens.scss`.

So: core defaults < theme defaults < admin settings, all at `:root`.

## Things that will bite you if you change them (learned the hard way)

- **The four marker comments are Rock constants.** `/* CSS Overrides Top
  Start */`, `Top End`, `Bottom Start`, `Bottom End` — byte for byte, the word
  `Start` included. Reword them and Rock's rewrite matches zero bytes: nothing
  configured in the fields editor ever reaches the browser.
- **`var(--token, fallback)` fallbacks against core tokens are dead code.**
  core.css declares every `--base-*` and `--color-*` itself, so the fallback
  never applies. Declare your values on `:root` (as `_tokens.scss` does);
  don't rely on fallbacks. Fallbacks are only live for variables core doesn't
  define (this theme's `--logo-image`, `--page-title-background`, …).
- **Never redeclare the derived `--color-*` layer at `:root`** — only
  `--base-*`. Core's dark scopes remap `--color-*` from the base tokens;
  overriding the derived layer breaks dark-mode inversion.
- **`theme.json` panels take `title`; leaf fields take `name`.** A panel with
  `name` fails validation and the ThemeDetail editor throws "Theme definition
  is invalid." for the whole theme.
- **A CSS custom property cannot drive an `@media` breakpoint.** The mobile
  menu breakpoint is an SCSS variable (`$nav-breakpoint` in `_components.scss`)
  compiled to a literal — don't try to make it a theme.json field; it would be
  silently inert.
- **`<%# ... %>` renders EMPTY outside the `<head>`.** It's a databinding
  expression; Rock databinds the head and nothing databinds body markup. A
  `<script src="<%# ResolveRockUrl(...) %>">` in the body ships as
  `<script src="">` with no error. All theme scripts load from the head with
  `defer`. `npm run check` guards this.

## Guard rails

`npm run check` runs two gates:

- `tools/check-theme.mjs` — the four markers appear exactly once in both
  `theme.scss` and `theme.css`; every `theme.json` default matches its
  `_tokens.scss` declaration; every `@import` in the compiled CSS precedes the
  first style rule (browsers silently drop late imports).
- `tools/check-master-bindings.mjs` — no databinding expressions or external
  scripts in `Site.Master`'s body, no hardcoded `/Themes/<Name>/` paths, and
  `defer` on every head theme script.

Run them after any change to the styles, `theme.json`, or `Site.Master`.

## Customizing

- **Colors, logo, fonts** — use the fields editor in Rock's admin UI; no code.
- **New defaults** — change the value in *both* `theme.json` and
  `Styles/_tokens.scss` (the check fails if they drift), then `npm run build`.
- **New components** — add rules to `Styles/_components.scss` using the semantic
  tokens (`--color-interface-*`, `--color-primary`) so dark mode keeps
  working. See Rock's `RockWeb/Styles/styles-v2/_css-variable.scss` for the
  full token catalog.
- **Webfonts** — `@import` the font at the top of `_components.scss` and update the
  `font-family-*` defaults in `theme.json` + `_tokens.scss`.
- **Pin to light mode** — uncomment the documented block at the bottom of
  `Styles/_tokens.scss`.

## License

MIT (see [LICENSE](LICENSE)). `Layouts/Error.aspx.cs` and `Layouts/Dialog.aspx`
derive from Rock RMS files under the Rock Community License.
