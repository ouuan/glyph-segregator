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
  alwaysCommonGlyphSet: Set<number>,
) {
  const map = new Map<number, number>();
  pagesWithGlyphs.forEach((page) => {
    page.glyphInfo[fontIndex][variantIndex].forEach((glyph) => {
      map.set(glyph, (map.get(glyph) || 0) + page.probability);
    });
  });

  const commonGlyphs = new Set<number>();

  for (const [glyph, expectedCost] of map) {
    if (alwaysCommonGlyphSet.has(glyph) || expectedCost > 1) {
      commonGlyphs.add(glyph);
    }
  }

  return commonGlyphs;
}

export default function getCommonGlyphs(
  pagesWithGlyphs: PageInfoWithGlyphInfo[],
  fontInfo: FontInfo[],
  alwaysCommonGlyphs?: string | number[],
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
        const alwaysCommonGlyphSet = new Set<number>();
        if (alwaysCommonGlyphs === undefined) {
          for (let i = 32; i <= 126; i += 1) {
            alwaysCommonGlyphSet.add(i);
          }
        } else if (typeof alwaysCommonGlyphs === 'string') {
          for (let i = 0; i < alwaysCommonGlyphs.length; i += 1) {
            alwaysCommonGlyphSet.add(alwaysCommonGlyphs.charCodeAt(i));
          }
        } else {
          alwaysCommonGlyphs.forEach((glyph) => alwaysCommonGlyphSet.add(glyph));
        }
        commonGlyphs = getCommonGlyphsForVariant(
          pagesWithGlyphs,
          fontIndex,
          variantIndex,
          alwaysCommonGlyphSet,
        );
      }
      return {
        ...variant,
        commonGlyphs,
      };
    }),
  }));
}
