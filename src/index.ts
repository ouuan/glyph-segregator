import { readFile, writeFile } from 'fs/promises';
import consola from 'consola';
import {
  CommonGlyphsCache,
  CommonGlyphsCacheSchema,
  Config,
  PageInfo,
  FontInfo,
} from './types';
import getPagesFontInfo from './getPagesFontInfo';
import matchFonts from './matchFonts';
import getCommonGlyphs from './getCommonGlyphs';
import generateFontFiles from './generateFontFiles';
import injectCSS from './injectCSS';

export async function glyphSegregator(config: Config): Promise<void> {
  consola.start('glyph-segregator started');

  let commonGlyphsCache;
  if (config.useCache) {
    const cacheContent = await readFile(config.cachePath, 'utf-8');
    commonGlyphsCache = CommonGlyphsCacheSchema.parse(JSON.parse(cacheContent));
    consola.success('Cache loaded');
  }

  const pagesWithFonts = await getPagesFontInfo(config.pages, config.concurrency ?? 4);
  // console.log(JSON.stringify(pagesWithFonts, (key, value) => {
  //   if (key === 'texts') return value.join();
  //   return value;
  // }, 1));

  consola.start('Dividing font glyphs');

  const pagesWithGlyphs = matchFonts(pagesWithFonts, config.fonts);
  // console.log(JSON.stringify(pagesWithGlyphs, (key, value) => {
  //   return value;
  // }, 1));

  const fontsWithCommonGlyphs = getCommonGlyphs(pagesWithGlyphs, config.fonts, commonGlyphsCache);

  const newCache: CommonGlyphsCache = fontsWithCommonGlyphs.flatMap(
    (font) => font.variants.map((variant) => ({
      fontFamily: font.fontFamily,
      fontWeight: variant.fontWeight,
      commonGlyphs: Array.from(variant.commonGlyphs),
    })),
  );
  await writeFile(config.cachePath, JSON.stringify(newCache, null, 2));

  consola.success('Glyphs dividied');

  const pagesWithCSS = await generateFontFiles(
    fontsWithCommonGlyphs,
    pagesWithGlyphs,
    config.rootPath,
    config.assetsPath,
  );

  consola.start('Inject CSS into HTML files');
  await Promise.all(pagesWithCSS.map(injectCSS));

  consola.success('glyph-segregator finished!');
}

export type {
  Config,
  PageInfo,
  FontInfo,
};
