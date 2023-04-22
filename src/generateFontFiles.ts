/* eslint-disable no-await-in-loop */

import { consola } from 'consola';
import { createHash } from 'crypto';
import { resolve } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import subsetFont from 'subset-font';
import type {
  FontInfoWithCommonGlyphs,
  PageInfoWithCSS,
  PageInfoWithGlyphInfo,
} from './types';

const fontHashMap = new Map<string, Promise<string[]>>();

async function saveAsset(
  buffer: Buffer,
  rootPath: string,
  assetsPath: string,
  baseName: string,
  suffix: string,
) {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 8);
  const savePath = `${assetsPath}/${baseName}.${hash}.${suffix}`;
  await writeFile(resolve(rootPath, savePath), buffer);
  return savePath;
}

async function generateFont(
  originalFont: Buffer,
  glyphs: number[],
  rootPath: string,
  assetsPath: string,
  baseName: string,
) {
  if (glyphs.length === 0) {
    return null;
  }
  const hash = createHash('sha256').update(new Uint16Array(glyphs.sort())).digest('hex');
  let promise = fontHashMap.get(hash);
  if (!promise) {
    promise = Promise.all((['woff', 'woff2'] as const).map(async (format) => {
      const generatedFont = await subsetFont(
        originalFont,
        glyphs.map((glyph) => String.fromCodePoint(glyph)).join(''),
        { targetFormat: format },
      );
      return saveAsset(generatedFont, rootPath, assetsPath, baseName, format);
    }));
    fontHashMap.set(hash, promise);
  }
  const [woffPath, woff2Path] = await promise;
  return { woffPath, woff2Path } as const;
}

export default async function generateFontFiles(
  fontsWithCommonGlyphs: FontInfoWithCommonGlyphs[],
  pagesWithGlyphs: PageInfoWithGlyphInfo[],
  rootPath: string,
  assetsPath: string,
): Promise<PageInfoWithCSS[]> {
  const pagesWithCSS: PageInfoWithCSS[] = pagesWithGlyphs.map((page) => ({
    ...page,
    css: [],
    preload: [],
  }));
  await mkdir(resolve(rootPath, assetsPath), { recursive: true });
  for (const [fontIndex, font] of fontsWithCommonGlyphs.entries()) {
    for (const [variantIndex, variant] of font.variants.entries()) {
      const elidedFontFamily = font.fontFamily.length > 30 ? `${font.fontFamily.slice(0, 30)}...` : font.fontFamily;
      consola.start(`Generating font files for '${elidedFontFamily}' (Weight: ${variant.fontWeight})`);

      const originalFont = await readFile(variant.originalFontPath);

      const commonFontPath = await generateFont(
        originalFont,
        Array.from(variant.commonGlyphs),
        rootPath,
        assetsPath,
        `${variant.outputFileName}.common`,
      );

      let uniqueGlyphCount = 0;

      await Promise.all(pagesWithCSS.map(async (page) => {
        const usedGlyphs = page.glyphInfo[fontIndex][variantIndex];
        const uniqueGlyphs = usedGlyphs.filter((glyph) => !variant.commonGlyphs.has(glyph));
        uniqueGlyphCount += uniqueGlyphs.length;
        const uniqueFontPath = await generateFont(
          originalFont,
          uniqueGlyphs,
          rootPath,
          assetsPath,
          `${variant.outputFileName}.unique`,
        );

        function addFontFace(woffPath: string, woff2Path: string, glyphs: number[]) {
          // `unicode-range` is added to make the specification happy:
          // https://www.w3.org/TR/css-fonts-4/#composite-fonts
          // Because it says "Multiple @font-face rules with different unicode ranges"
          // and I didn't find what should happen if the unicode ranges are identical.
          //
          // The range starts from zero to contain the space character to avoid possible
          // issues related to the "first available font":
          // https://www.w3.org/TR/css-fonts-4/#first-available-font
          // I didn't quite understand the "first available font", but I think it just
          // sounds better to include the space in the `unicode-range`.

          page.css.push(`@font-face {
            font-family: "${font.webFontName}";
            font-weight: ${variant.fontWeight};
            ${variant.fontStyle ? `font-style: ${variant.fontStyle};` : ''}
            ${variant.fontDisplay ? `font-display: ${variant.fontDisplay};` : ''}
            src: url('/${woff2Path}') format('woff2'),
                 url('/${woffPath}') format('woff');
            unicode-range: U+0-${Math.max(...glyphs).toString(16)};
          }`);

          page.preload.push(`<link rel="preload" href="/${woff2Path}" as="font" type="font/woff2" crossorigin>`);
        }

        if (uniqueFontPath) {
          addFontFace(
            uniqueFontPath.woffPath,
            uniqueFontPath.woff2Path,
            uniqueGlyphs,
          );
        }
        if (commonFontPath && uniqueGlyphs.length < usedGlyphs.length) {
          addFontFace(
            commonFontPath.woffPath,
            commonFontPath.woff2Path,
            Array.from(variant.commonGlyphs),
          );
        }
      }));

      consola.info(`Common glyph count: ${variant.commonGlyphs.size}`);
      consola.info(`Unique glyph count: ${uniqueGlyphCount}`);
      consola.success(`Generated font files for '${elidedFontFamily}' (Weight: ${variant.fontWeight})`);
    }
  }
  return pagesWithCSS;
}
