import assert from "node:assert/strict";
import test from "node:test";
import { MemoryService } from "../../src/services/spirit/MemoryService.js";

test("MemoryService can be instantiated", () => {
  const s = new MemoryService();
  assert.ok(s);
  assert.equal(typeof s.extract, "function");
  assert.equal(typeof s.save, "function");
  assert.equal(typeof s.retrieve, "function");
  assert.equal(typeof s.listBySpirit, "function");
});

test("extract returns [] for very short input", async () => {
  const s = new MemoryService();
  const result = await s.extract("hi", "hello");
  assert.deepEqual(result, []);
});

test("extract returns [] for empty input", async () => {
  const s = new MemoryService();
  const result = await s.extract("", "");
  assert.deepEqual(result, []);
});

test("save with empty array returns 0", async () => {
  const s = new MemoryService();
  const saved = await s.save("fake-spirit", "fake-user", []);
  assert.equal(saved, 0);
});