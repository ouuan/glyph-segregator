import { Cluster } from 'puppeteer-cluster';
import { consola } from 'consola';
import type { PageFontInfoItem, PageInfo, PageInfoWithFontInfo } from './types';

function toBeEvaluated(): PageFontInfoItem[] {
  const map = new Map<string, Map<number, string[]>>();

  function add(u: Element, text: string) {
    const style = getComputedStyle(u);
    const weight = Number(style.fontWeight);

    let innerMap = map.get(style.fontFamily);
    if (!innerMap) {
      innerMap = new Map();
      map.set(style.fontFamily, innerMap);
    }

    let texts = innerMap.get(weight);
    if (!texts) {
      texts = [];
      innerMap.set(weight, texts);
    }

    texts.push(text);
  }

  function dfs(u: Element) {
    u.childNodes.forEach((v) => {
      if (v instanceof Text) {
        add(u, v.wholeText);
      } else if (v instanceof HTMLImageElement) {
        add(u, v.alt);
      } else if (v instanceof Element) {
        if (['SCRIPT', 'STYLE'].includes(v.tagName)) return;
        dfs(v);
      }
    });
  }

  dfs(document.body);

  return Array.from(map.entries()).map(([fontFamily, innerMap]) => ({
    fontFamily,
    variants: Array.from(innerMap.entries()).map(([fontWeight, texts]) => ({ fontWeight, texts })),
  }));
}

export default async function getPagesFontInfo(
  pages: PageInfo[],
  concurrency: number,
): Promise<PageInfoWithFontInfo[]> {
  consola.start('Getting font info for pages');
  const cluster: Cluster<PageInfo, PageInfoWithFontInfo> = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: concurrency,
    monitor: true,
    puppeteerOptions: {
      // https://stackoverflow.com/a/66994528
      args: [
        '--no-sandbox',
        '--no-zygote',
      ],
    },
  });
  await cluster.task(async ({ page, data }) => {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.resourceType() === 'image') {
        request.abort();
      } else {
        request.continue();
      }
    });
    await page.goto(data.url);
    const result = {
      ...data,
      fontInfo: await page.evaluate(toBeEvaluated),
    };
    await page.close();
    return result;
  });
  const result = Promise.all(pages.map((pageInfo) => cluster.execute(pageInfo)));
  await cluster.idle();
  await cluster.close();
  consola.success('Got font info for pages');
  return result;
}
