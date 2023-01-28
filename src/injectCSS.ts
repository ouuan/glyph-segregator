import { JSDOM } from 'jsdom';
import { readFile, writeFile } from 'fs/promises';
import type { PageInfoWithCSS } from './types';

export default async function injectCSS(pageWithCSSInfo: PageInfoWithCSS) {
  const html = await readFile(pageWithCSSInfo.filePath, 'utf-8');
  const dom = new JSDOM(html);
  dom.window.document.head.insertAdjacentHTML(
    'beforeend',
    `<style>${pageWithCSSInfo.css.join('\n').replace(/\s+/g, ' ')}</style>`,
  );
  return writeFile(pageWithCSSInfo.filePath, dom.serialize());
}
