# glyph-segregator

[![npm package](https://shields.ouuan.moe/npm/v/glyph-segregator)](https://www.npmjs.com/package/glyph-segregator)

A new way to optimize web fonts for a specific static site:

Divide all the glyphs (characters) in a font into two groups: commonly used glyphs and less commonly used glyphs. The decision is based on the estimated cost of putting a glyph in the less commonly used group, which is then based on the estimated probability that a visitor will access each page on the site. For the commonly used glyphs, a single font file will be shared across all pages. For the less commonly used glyphs, each page will have its own unique font file.

Users of `glyph-segregator` need to provide a list of all pages on the site and the estimated probability for a visitor to access each page, and a URL on which the site is served. `glyph-segregator` will figure out the glyphs used on each page (by using [Headless Chrome](https://github.com/puppeteer/puppeteer)), do the glyph division, generate font files, and inject corresponding `@font-face` CSS into the HTML files in place.

The access probability of each page needs to be estimated by the library user, which can be based on web analytics (Google Analytics, [Plausible Analytics](https://plausible.io/), [Matomo Analytics](https://matomo.org/), etc.) or heuristics. A glyph is considered commonly used if the aggregated access probability of all pages that use the glyph is greater than 1.

## API

```typescript
export function glyphSegregator(config: Config): Promise<void>;
```

See the `Config` interface and corresponding comments in [types.ts](src/types.ts) for the arguments.

## Usage

1.  Set all the CSS except the `@font-face` rules, including `font-family` values containing the name of the web font.
2.  After building your site, run a preview server and prepare the arguments for `glyphSegregator`.
3.  Call the `glyphSegregator` function.

Notes:

-   Changing the common glyph set to often may hurt cache performance, so you can set the `useCache` config to `true` on daily builds and set it to `false` on schedule.
-   If your site works without a server (the HTML files just work, the assets can be loaded correctly), you can use `file://` protocal without running a server.

## Limitations

-   If you want to provide a full font as a fallback for e.g. dynamic contents, take care of yourself as this kind of usage is not supported.
-   I'm not sure that the algorithm used to find text contents on a web page is exhaustive. Now it finds all [text nodes](https://developer.mozilla.org/docs/Web/API/Text) in `<body>` that are not descendants of a `<script>` or `<style>` element, and `alt` attributes of `<img>` elements.
-   Dynamically rendered contents that requrie interaction with the page are not collected. However, if the content is always rendered but just being hidden or shown dynamically via CSS, it will be collected.
-   It uses a simplified font style matching algorithm that checks font weights only. Matching by `font-stretch`, `font-style`, etc. is currently unsupported.
