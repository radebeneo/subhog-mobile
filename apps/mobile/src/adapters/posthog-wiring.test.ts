import assert from "node:assert/strict";
import test from "node:test";
import { posthog } from "./posthog.ts";
import { analytics } from "../../test-support/native-mocks.mjs";

test("actual adapter constructs no analytics client in development data mode even when configured", () => {
  assert.equal(posthog, null);
  assert.equal(analytics.constructions, 0);
  assert.deepEqual(analytics.events, []);
});
