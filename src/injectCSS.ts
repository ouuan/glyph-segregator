import { JSDOM } from 'jsdom';
import { readFile, writeFile } from 'fs/promises';
import type { PageInfoWithCSS } from './types';

export default async function injectCSS(pageWithCSSInfo: PageInfoWithCSS, preload: boolean) {
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
  return writeFile(pageWithCSSInfo.filePath, dom.serialize());
}
