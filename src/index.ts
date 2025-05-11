import { readFile, writeFile } from 'fs/promises';
import { consola } from 'consola';
import generateFontFiles from './generateFontFiles';
import getCommonGlyphs from './getCommonGlyphs';
import getPagesFontInfo from './getPagesFontInfo';
import injectCSS from './injectCSS';
import matchFonts from './matchFonts';
import { CommonGlyphsCacheSchema } from './types';
import type {
  CommonGlyphsCache,
  Config,
  FontInfo,
  PageInfo,
} from './types';

export async function glyphSegregator(config: Config): Promise<void> {
  consola.start('glyph-segregator started');

  let commonGlyphsCache;
  if (config.useCache) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const cacheContent = await readFile(config.cachePath, 'utf-8');
    commonGlyphsCache = CommonGlyphsCacheSchema.parse(JSON.parse(cacheContent));
    consola.success('Cache loaded');
  }

  const pagesWithFonts = await getPagesFontInfo(config.pages, config.concurrency ?? 4);

  consola.start('Dividing font glyphs');

  const pagesWithGlyphs = matchFonts(pagesWithFonts, config.fonts);

  const fontsWithCommonGlyphs = getCommonGlyphs(
    pagesWithGlyphs,
    config.fonts,
    config.alwaysCommonGlyphs,
    commonGlyphsCache,
  );

  const newCache: CommonGlyphsCache = fontsWithCommonGlyphs.flatMap(
    (font) => font.variants.map((variant) => ({
      fontFamily: font.fontFamily,
      fontWeight: variant.fontWeight,
      commonGlyphs: Array.from(variant.commonGlyphs).sort((a, b) => a - b),
    })),
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(config.cachePath, JSON.stringify(newCache, null, 2));

  consola.success('Glyphs dividied');

  const pagesWithCSS = await generateFontFiles(
    fontsWithCommonGlyphs,
    pagesWithGlyphs,
    config.rootPath,
    config.assetsPath,
  );

  consola.start('Inject CSS into HTML files');
  await Promise.all(pagesWithCSS.map((page) => injectCSS(page, config.preload ?? true)));

  consola.success('glyph-segregator finished!');
}

export type {
  Config,
  FontInfo,
  PageInfo,
};
