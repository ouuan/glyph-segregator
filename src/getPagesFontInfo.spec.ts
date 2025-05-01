import { resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import getPagesFontInfo from './getPagesFontInfo';
import type { PageFontInfoItem, PageInfoWithFontInfo } from './types';

function generatePageInfo(name: string) {
  return {
    filePath: resolve(fileURLToPath(import.meta.url), `../tests/${name}.html`),
    url: new URL(`../tests/${name}.html`, import.meta.url).href,
    probability: 1,
  };
}

describe('getPagesFontInfo', () => {
  let pagesWithFonts: PageInfoWithFontInfo[];

  beforeAll(async () => {
    pagesWithFonts = await getPagesFontInfo([
      generatePageInfo('1'),
      generatePageInfo('2'),
      generatePageInfo('3'),
    ], 2);
  });

  it('should correctly get font info for text elements', () => {
    const expected: PageFontInfoItem[] = [{
      fontFamily: 'sans',
      variants: [{
        fontWeight: 400,
        texts: ['\n  ', '\n\n\n\n'],
      }],
    }, {
      fontFamily: '"font a"',
      variants: [{
        fontWeight: 400,
        texts: [
          '\n    ',
          '\n    ',
          '\n    <a>\n    ',
          '\n  ',
        ],
      }],
    }, {
      fontFamily: '"font d"',
      variants: [{
        fontWeight: 400,
        texts: ['d'],
      }],
    }, {
      fontFamily: '"font b"',
      variants: [{
        fontWeight: 700,
        texts: [
          '\n      ',
          '\n      ',
          '\n    ',
        ],
      }, {
        fontWeight: 900,
        texts: ['b'],
      }],
    }, {
      fontFamily: '"font c"',
      variants: [{
        fontWeight: 400,
        texts: ['c1'],
      }, {
        fontWeight: 100,
        texts: ['c2'],
      }],
    }];
    expect(pagesWithFonts[0].fontInfo).toEqual(expected);
  });

  it('should ignore <script> and <style> tags', () => {
    const expected: PageFontInfoItem[] = [{
      fontFamily: 'sans',
      variants: [{
        fontWeight: 400,
        texts: [
          '\n  ',
          '\n  ',
          '\n  ',
          '\n\n\n\n',
        ],
      }],
    }, {
      fontFamily: '"font a"',
      variants: [{
        fontWeight: 400,
        texts: ['a'],
      }],
    }];

    expect(pagesWithFonts[1].fontInfo).toEqual(expected);
  });

  it('should get info for alt attribute of <img>', () => {
    const expected: PageFontInfoItem[] = [{
      fontFamily: 'sans',
      variants: [{
        fontWeight: 400,
        texts: [
          '\n  ',
          'a',
          '\n\n\n\n',
        ],
      }],
    }];

    expect(pagesWithFonts[2].fontInfo).toEqual(expected);
  });
});
