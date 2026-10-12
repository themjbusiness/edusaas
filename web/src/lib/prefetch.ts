import { get, getToken, media, type LessonFull } from './api';
import { parse } from './router';

/* Start the first screen's data (and a lesson's first page image) while the app checks who is signed in,
   instead of one after the other. Saves a full round trip on slow mobile networks. */
const cache = new Map<string, Promise<unknown>>();

function prefetch<T>(path: string): Promise<T> {
  if (!cache.has(path)) cache.set(path, get<T>(path));
  return cache.get(path) as Promise<T>;
}

/** The prefetched response if there is one (used once), otherwise a normal request. */
export function take<T>(path: string): Promise<T> {
  const p = cache.get(path);
  cache.delete(path);
  return (p as Promise<T>) || get<T>(path);
}

function preloadImage(href: string) {
  const link = document.createElement('link');
  link.rel = 'preload'; link.as = 'image'; link.href = href;
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
}

export function prefetchForRoute(hash: string) {
  if (!getToken()) return;
  const { name, args } = parse(hash);
  if (name === 'lesson' && args[0]) {
    prefetch<LessonFull>('lessons/' + encodeURIComponent(args[0])).then((l) => {
      const k = l.script[0]?.pg ?? 0;
      preloadImage(media((matchMedia('(min-width: 960px)').matches ? l.images : l.imagesSmall || l.images)[k]));
    }, () => {});
  } else if (name === 'home') {
    prefetch('student/home').catch(() => {});
  }
}
