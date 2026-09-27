// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('receives a real delayed dialogue response beyond the old 10s deadline', async () => {
  let requests = 0;
  const server = createServer((_req, res) => {
    requests++;
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Delayed fixture reply' }));
    }, 11000);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  vi.stubEnv('VITE_API_URL', `http://127.0.0.1:${address.port}/api`);
  vi.stubGlobal('localStorage', { getItem: () => null });
  try {
    const { dialogueAPI } = await import('./api/client');
    const response = await dialogueAPI.chat('synthetic-spirit', 'Synthetic greeting');
    expect(response.data.message).toBe('Delayed fixture reply');
    expect(requests).toBe(1);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}, 20000);
