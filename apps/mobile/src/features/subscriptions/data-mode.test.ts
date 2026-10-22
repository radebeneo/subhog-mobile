import assert from "node:assert/strict";
import test from "node:test";
import { isDevelopmentDataModeActive } from "./data-mode.ts";

test("enables development data mode only when __DEV__ is true and mode is 'development'", () => {
  assert.equal(isDevelopmentDataModeActive(true, "development"), true);
});

test("refuses development data mode in production builds regardless of setting", () => {
  // Release/production builds must NEVER activate development data mode
  assert.equal(isDevelopmentDataModeActive(false, "development"), false);
  assert.equal(isDevelopmentDataModeActive(false, undefined), false);
  assert.equal(isDevelopmentDataModeActive(false, "any"), false);
});

test("disables development data mode when mode value is missing or different", () => {
  assert.equal(isDevelopmentDataModeActive(true, undefined), false);
  assert.equal(isDevelopmentDataModeActive(true, ""), false);
  assert.equal(isDevelopmentDataModeActive(true, "production"), false);
  assert.equal(isDevelopmentDataModeActive(true, "test"), false);
  assert.equal(isDevelopmentDataModeActive(true, "DEVELOPMENT"), false);
});
