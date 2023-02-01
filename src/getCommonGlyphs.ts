import type {
  CommonGlyphsCache,
  FontInfo,
  FontInfoWithCommonGlyphs,
  PageInfoWithGlyphInfo,
} from './types';

function getCommonGlyphsForVariant(
  pagesWithGlyphs: PageInfoWithGlyphInfo[],
  fontIndex: number,
  variantIndex: number,
) {
  const map = new Map<number, number>();
  pagesWithGlyphs.forEach((page) => {
    page.glyphInfo[fontIndex][variantIndex].forEach((glyph) => {
      map.set(glyph, (map.get(glyph) || 0) + page.probability);
    });
  });

  const commonGlyphs = new Set<number>();

  for (const [glyph, expectedCost] of map) {
    if (expectedCost > 1) {
      commonGlyphs.add(glyph);
    }
  }

  return commonGlyphs;
}

export default function getCommonGlyphs(
  pagesWithGlyphs: PageInfoWithGlyphInfo[],
  fontInfo: FontInfo[],
  allAsciiCommon: boolean,
  cache?: CommonGlyphsCache,
): FontInfoWithCommonGlyphs[] {
  return fontInfo.map((font, fontIndex) => ({
    fontFamily: font.fontFamily,
    webFontName: font.webFontName,
    variants: font.variants.map((variant, variantIndex) => {
      let commonGlyphs;
      if (cache) {
        const cacheHit = cache.find(
          (c) => c.fontFamily === font.fontFamily && c.fontWeight === variant.fontWeight,
        );
        if (cacheHit) commonGlyphs = new Set(cacheHit.commonGlyphs);
      }
      if (!commonGlyphs) {
        commonGlyphs = getCommonGlyphsForVariant(
          pagesWithGlyphs,
          fontIndex,
          variantIndex,
        );
        if (allAsciiCommon) {
          for (let i = 32; i <= 126; i += 1) {
            commonGlyphs.add(i);
          }
        }
      }
      return {
        ...variant,
        commonGlyphs,
      };
    }),
  }));
}
