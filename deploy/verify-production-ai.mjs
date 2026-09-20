// SPDX-License-Identifier: MIT
// Run inside the backend's Railway environment before accepting an AI cutover.
import { randomBytes } from 'node:crypto';

const endpoint = process.env.AI_ENGINE_URL;
const key = process.env.AI_ENGINE_API_KEY;
const digest = process.env.AI_EXPECTED_MODEL_DIGEST;
const model = process.env.AI_EXPECTED_MODEL;
if (!endpoint || !key || key.length < 32 || !digest || !model) {
  console.error('AI_CONNECTION_CHECK_FAILED: configuration_missing');
  process.exit(1);
}
const url = endpoint.replace(/\/$/, '') + '/api/ops/verify-inference';
try {
  const denied = await fetch(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (denied.status !== 401) throw new Error('service_authentication_failed');
  const response = await fetch(url, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(150000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge: randomBytes(16).toString('hex') }),
  });
  if (!response.ok) throw new Error('inference_request_failed');
  const result = await response.json();
  if (result.verified !== true || result.scope !== 'synthetic_inference_connectivity'
      || result.model !== model || result.digest !== digest
      || !Number.isInteger(result.generated_tokens) || result.generated_tokens < 1) {
    throw new Error('inference_evidence_mismatch');
  }
  console.log(JSON.stringify({ event: 'AI_INFERENCE_VERIFIED', model, digest,
    candidate: result.candidate, scope: result.scope, generated_tokens: result.generated_tokens }));
} catch (error) {
  // Never print fetch exceptions: they can contain URLs, headers, or response data.
  const safe = new Set(['service_authentication_failed', 'inference_request_failed', 'inference_evidence_mismatch']);
  console.error('AI_CONNECTION_CHECK_FAILED: ' + (safe.has(error.message) ? error.message : 'connection_failed'));
  process.exit(1);
}
