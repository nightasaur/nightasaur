// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import test from "node:test";

import {
  AUXILIARY_OPEN_SOURCE_ROLE,
  reviewOpenSourceCandidate,
} from "../src/openSource/catalog.js";

const digest = "a".repeat(64);

test("metadata is registered without implying legal approval", () => {
  const result = reviewOpenSourceCandidate({
    canonicalId: "pkg:npm/example@1.0.0",
    name: "example",
    kind: "software_package",
    sourceUrl: "https://registry.npmjs.org/example/-/example-1.0.0.tgz",
    licenseExpression: "MIT",
  });

  assert.equal(result.role, AUXILIARY_OPEN_SOURCE_ROLE);
  assert.equal(result.ingestionStatus, "METADATA_ONLY");
  assert.equal(result.policyReviewStatus, "REVIEW_REQUIRED");
  assert.equal(result.legalReviewStatus, "NOT_REVIEWED");
  assert.equal(result.contentIncluded, false);
  assert.equal(result.isAuthoritative, false);
});

test("CC0 content with a fixed digest can be approved as auxiliary", () => {
  const result = reviewOpenSourceCandidate({
    canonicalId: "dataset:example/cc0",
    name: "Example CC0 dataset",
    kind: "dataset",
    sourceUrl: "https://example.org/dataset",
    licenseExpression: "CC0-1.0",
    contentIncluded: true,
    contentPath: "data/open-source/approved/example.txt",
    contentSha256: digest,
    legalReview: {
      status: "APPROVED",
      reviewer: "Example reviewer",
      reviewedAt: "2026-09-19T00:00:00.000Z",
    },
  });

  assert.equal(result.ingestionStatus, "CONTENT_APPROVED");
  assert.equal(result.policyReviewStatus, "APPROVED");
  assert.equal(result.legalReviewStatus, "APPROVED");
  assert.equal(result.isAuthoritative, false);
});

test("attribution licenses require an attribution record", () => {
  const result = reviewOpenSourceCandidate({
    canonicalId: "dataset:example/by",
    name: "Example attributed dataset",
    kind: "dataset",
    sourceUrl: "https://example.org/dataset",
    licenseExpression: "CC-BY-4.0",
    contentIncluded: true,
    contentPath: "data/open-source/approved/example.txt",
    contentSha256: digest,
    legalReview: {
      status: "APPROVED",
      reviewer: "Example reviewer",
      reviewedAt: "2026-09-19T00:00:00.000Z",
    },
  });

  assert.equal(result.ingestionStatus, "REJECTED");
  assert.match(result.decisionReason, /attribution/i);
});

test("noncommercial licenses are not accepted for content ingestion", () => {
  const result = reviewOpenSourceCandidate({
    canonicalId: "dataset:example/nc",
    name: "Example noncommercial dataset",
    kind: "dataset",
    sourceUrl: "https://example.org/dataset",
    licenseExpression: "CC-BY-NC-4.0",
    attribution: "Example Author",
    contentIncluded: true,
    contentPath: "data/open-source/approved/example.txt",
    contentSha256: digest,
    legalReview: {
      status: "APPROVED",
      reviewer: "Example reviewer",
      reviewedAt: "2026-09-19T00:00:00.000Z",
    },
  });

  assert.equal(result.ingestionStatus, "REJECTED");
  assert.match(result.decisionReason, /allowlist/i);
});

test("personal, sensitive, or child data is rejected", () => {
  const result = reviewOpenSourceCandidate({
    canonicalId: "dataset:example/personal",
    name: "Example personal dataset",
    kind: "dataset",
    sourceUrl: "https://example.org/dataset",
    licenseExpression: "CC0-1.0",
    contentIncluded: true,
    contentPath: "data/open-source/approved/example.txt",
    contentSha256: digest,
    containsPersonalData: true,
    legalReview: {
      status: "APPROVED",
      reviewer: "Example reviewer",
      reviewedAt: "2026-09-19T00:00:00.000Z",
    },
  });

  assert.equal(result.ingestionStatus, "REJECTED");
  assert.match(result.decisionReason, /personal/i);
});

test("content without a recorded legal review is rejected", () => {
  const result = reviewOpenSourceCandidate({
    canonicalId: "dataset:example/unreviewed",
    name: "Example unreviewed dataset",
    kind: "dataset",
    sourceUrl: "https://example.org/dataset",
    licenseExpression: "CC0-1.0",
    contentIncluded: true,
    contentPath: "data/open-source/approved/example.txt",
    contentSha256: digest,
  });

  assert.equal(result.ingestionStatus, "REJECTED");
  assert.equal(result.legalReviewStatus, "NOT_REVIEWED");
  assert.match(result.decisionReason, /legal review/i);
});

test("non-HTTPS provenance is rejected", () => {
  assert.throws(
    () =>
      reviewOpenSourceCandidate({
        canonicalId: "dataset:example/insecure",
        name: "Insecure source",
        kind: "dataset",
        sourceUrl: "http://example.org/dataset",
      }),
    /HTTPS/,
  );
});
