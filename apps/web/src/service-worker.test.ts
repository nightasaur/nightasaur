// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8');

function worker() {
  const handlers: Record<string, (event: any) => void> = {};
  const cache = { addAll: vi.fn().mockResolvedValue(undefined), match: vi.fn() };
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi.fn().mockResolvedValue(['nightasaur-v1.0.0', 'unrelated-cache', 'nightasaur-public-v2']),
    delete: vi.fn().mockResolvedValue(true),
  };
  const fetch = vi.fn().mockResolvedValue(new Response('new deployment'));
  const self = {
    location: { origin: 'https://example.test' },
    addEventListener: (type: string, handler: (event: any) => void) => { handlers[type] = handler; },
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
  };
  runInNewContext(source, { self, caches, fetch, URL, Response, console: { log: vi.fn() } });
  return { handlers, cache, caches, fetch, self };
}

it('preloads only public fallback files and removes only old Nightasaur caches', async () => {
  const w = worker();
  let task: Promise<unknown>;
  const event = { waitUntil: (promise: Promise<unknown>) => { task = promise; } };
  w.handlers.install(event);
  await task!;
  expect(w.cache.addAll).toHaveBeenCalledWith(['/offline.html', '/manifest.json', '/nightasaur.svg']);
  expect(w.self.skipWaiting).toHaveBeenCalledOnce();
  w.handlers.activate(event);
  await task!;
  expect(w.caches.delete).toHaveBeenCalledTimes(1);
  expect(w.caches.delete).toHaveBeenCalledWith('nightasaur-v1.0.0');
  expect(w.self.clients.claim).toHaveBeenCalledOnce();
});

it.each(['/api', '/api/auth/me', '/api/spirits', '/assets/current.js'])('does not intercept or cache %s', path => {
  const w = worker();
  const respondWith = vi.fn();
  w.handlers.fetch({ request: { url: `https://example.test${path}`, method: 'GET' }, respondWith });
  expect(respondWith).not.toHaveBeenCalled();
  expect(w.caches.open).not.toHaveBeenCalled();
});

it('loads current HTML without consulting stale document caches', async () => {
  const w = worker();
  const request = { url: 'https://example.test/login', method: 'GET', mode: 'navigate' };
  let response: Promise<Response>;
  w.handlers.fetch({ request, respondWith: (value: Promise<Response>) => { response = value; } });
  expect(await (await response!).text()).toBe('new deployment');
  expect(w.fetch).toHaveBeenCalledWith(request, { cache: 'no-store' });
  expect(w.caches.open).not.toHaveBeenCalled();
});

it('uses only the generic public offline page when document network access fails', async () => {
  const w = worker();
  w.fetch.mockRejectedValue(new TypeError('offline'));
  w.cache.match.mockResolvedValue(new Response('public offline page'));
  let response: Promise<Response>;
  w.handlers.fetch({
    request: { url: 'https://example.test/dashboard', method: 'GET', mode: 'navigate' },
    respondWith: (value: Promise<Response>) => { response = value; },
  });
  expect(await (await response!).text()).toBe('public offline page');
  expect(w.cache.match).toHaveBeenCalledWith('/offline.html');
});
