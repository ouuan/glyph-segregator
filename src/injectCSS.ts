import { readFile, writeFile } from 'fs/promises';
import { JSDOM } from 'jsdom';
import type { PageInfoWithCSS } from './types';

export default async function injectCSS(pageWithCSSInfo: PageInfoWithCSS, preload: boolean) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const html = await readFile(pageWithCSSInfo.filePath, 'utf-8');
  const dom = new JSDOM(html);
  dom.window.document.head.insertAdjacentHTML(
    'beforeend',
    `<style>${pageWithCSSInfo.css.join('\n').replace(/\s+/g, ' ')}</style>`,
  );
  if (preload) {
    pageWithCSSInfo.preload.forEach((text) => {
      dom.window.document.head.insertAdjacentHTML('beforeend', text);
    });
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return writeFile(pageWithCSSInfo.filePath, dom.serialize());
}
