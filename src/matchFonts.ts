import type {
  FontInfo,
  FontVariantInfo,
  PageInfoWithFontInfo,
  PageInfoWithGlyphInfo,
} from './types';

// based on https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#fallback_weights
// @returns variantIndex
function matchFontWeight(target: number, variants: FontVariantInfo[]): number {
  const keys = variants.map(({ fontWeight }) => {
    if (target < 400) {
      if (fontWeight <= target) return [0, -fontWeight] as const;
      return [1, fontWeight] as const;
    }
    if (target > 500) {
      if (fontWeight >= target) return [0, fontWeight] as const;
      return [1, -fontWeight] as const;
    }
    if (fontWeight >= target && fontWeight <= 500) return [0, fontWeight] as const;
    if (fontWeight < target) return [1, -fontWeight] as const;
    return [2, fontWeight] as const;
  });

  return keys.reduce((minIndex, [type, key], index) => {
    if (type < keys[minIndex][0]) return index;
    if (type > keys[minIndex][0]) return minIndex;
    if (key < keys[minIndex][1]) return index;
    return minIndex;
  }, 0);
}

export default function matchFonts(
  pagesWithFonts: PageInfoWithFontInfo[],
  fontInfo: FontInfo[],
): PageInfoWithGlyphInfo[] {
  return pagesWithFonts.map((page) => {
    const glyphSet: Set<number>[][] = fontInfo.map(
      (font) => Array.from(font.variants, () => new Set()),
    );

    for (const pageFontInfo of page.fontInfo) {
      const fontIndex = fontInfo.findIndex((font) => {
        if (font.variants.length === 0) return false;
        return pageFontInfo.fontFamily === font.fontFamily;
      });

      if (fontIndex === -1) continue;
      const font = fontInfo[fontIndex];

      for (const pageFontVariant of pageFontInfo.variants) {
        const variantIndex = matchFontWeight(pageFontVariant.fontWeight, font.variants);
        const set = glyphSet[fontIndex][variantIndex];
        pageFontVariant.texts.forEach((text) => {
          for (let i = 0; i < text.length; i += 1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            set.add(text.codePointAt(i)!);
          }
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fontInfo: _, ...withoutFontInfo } = page;

    return {
      ...withoutFontInfo,
      glyphInfo: glyphSet.map((x) => x.map((set) => Array.from(set))),
    };
  });
}
