import { describe, it, expect } from 'vitest';

import matchFonts from './matchFonts';
import { PageInfoWithGlyphInfo } from './types';

describe('matchFonts', () => {
  it('should match by font family', () => {
    const result = matchFonts([{
      url: '',
      filePath: '',
      probability: 1,
      fontInfo: [{
        fontFamily: "'font a'",
        variants: [{
          fontWeight: 400,
          texts: ['1'],
        }],
      }, {
        fontFamily: '"font a", serif',
        variants: [{
          fontWeight: 400,
          texts: ['2'],
        }],
      }, {
        fontFamily: '"font a"',
        variants: [{
          fontWeight: 400,
          texts: ['3', '45'],
        }],
      }],
    }], [{
      fontFamily: '"font a"',
      webFontName: '',
      variants: [{
        fontWeight: 400,
        originalFontPath: '',
        outputFileName: '',
      }],
    }, {
      fontFamily: "'font a'",
      webFontName: '',
      variants: [{
        fontWeight: 400,
        originalFontPath: '',
        outputFileName: '',
      }],
    }]);

    const expected: PageInfoWithGlyphInfo[] = [{
      url: '',
      filePath: '',
      probability: 1,
      glyphInfo: [[['3'.codePointAt(0)!, '4'.codePointAt(0)!, '5'.codePointAt(0)!]], [['1'.codePointAt(0)!]]],
    }];

    expect(result).toEqual(expected);
  });

  it('should match font weight for target < 400', () => {
    const result = matchFonts([{
      url: '',
      filePath: '',
      probability: 0,
      fontInfo: [{
        fontFamily: 'a',
        variants: [{
          fontWeight: 350,
          texts: ['1'],
        }, {
          fontWeight: 299,
          texts: ['2'],
        }, {
          fontWeight: 100,
          texts: ['3'],
        }],
      }],
    }], [{
      fontFamily: 'a',
      webFontName: '',
      variants: [{
        fontWeight: 400,
        originalFontPath: '',
        outputFileName: '',
      }, {
        fontWeight: 200,
        originalFontPath: '',
        outputFileName: '',
      }, {
        fontWeight: 300,
        originalFontPath: '',
        outputFileName: '',
      }],
    }]);

    const expected: PageInfoWithGlyphInfo[] = [{
      url: '',
      filePath: '',
      probability: 0,
      glyphInfo: [[
        [],
        ['2'.codePointAt(0)!, '3'.codePointAt(0)!],
        ['1'.codePointAt(0)!],
      ]],
    }];

    expect(result).toEqual(expected);
  });

  it('should match font weight for target > 500', () => {
    const result = matchFonts([{
      url: '',
      filePath: '',
      probability: 0,
      fontInfo: [{
        fontFamily: 'a',
        variants: [{
          fontWeight: 550,
          texts: ['1'],
        }, {
          fontWeight: 601,
          texts: ['2'],
        }, {
          fontWeight: 900,
          texts: ['3'],
        }],
      }],
    }], [{
      fontFamily: 'a',
      webFontName: '',
      variants: [{
        fontWeight: 400,
        originalFontPath: '',
        outputFileName: '',
      }, {
        fontWeight: 700,
        originalFontPath: '',
        outputFileName: '',
      }, {
        fontWeight: 600,
        originalFontPath: '',
        outputFileName: '',
      }],
    }]);

    const expected: PageInfoWithGlyphInfo[] = [{
      url: '',
      filePath: '',
      probability: 0,
      glyphInfo: [[
        [],
        ['2'.codePointAt(0)!, '3'.codePointAt(0)!],
        ['1'.codePointAt(0)!],
      ]],
    }];

    expect(result).toEqual(expected);
  });

  it('should match font weight for target in [400, 500]', () => {
    const result = matchFonts([{
      url: '',
      filePath: '',
      probability: 0,
      fontInfo: [{
        fontFamily: 'a',
        variants: [{
          fontWeight: 400,
          texts: ['1'],
        }, {
          fontWeight: 500,
          texts: ['2'],
        }, {
          fontWeight: 450,
          texts: ['3'],
        }],
      }, {
        fontFamily: 'b',
        variants: [{
          fontWeight: 400,
          texts: ['4'],
        }],
      }],
    }], [{
      fontFamily: 'a',
      webFontName: '',
      variants: [{
        fontWeight: 440,
        originalFontPath: '',
        outputFileName: '',
      }, {
        fontWeight: 490,
        originalFontPath: '',
        outputFileName: '',
      }, {
        fontWeight: 501,
        originalFontPath: '',
        outputFileName: '',
      }],
    }, {
      fontFamily: 'b',
      webFontName: '',
      variants: [{
        fontWeight: 700,
        originalFontPath: '',
        outputFileName: '',
      }, {
        fontWeight: 600,
        originalFontPath: '',
        outputFileName: '',
      }],
    }]);

    const expected: PageInfoWithGlyphInfo[] = [{
      url: '',
      filePath: '',
      probability: 0,
      glyphInfo: [
        [['1'.codePointAt(0)!], ['2'.codePointAt(0)!, '3'.codePointAt(0)!], []],
        [[], ['4'.codePointAt(0)!]],
      ],
    }];

    expect(result).toEqual(expected);
  });
});
