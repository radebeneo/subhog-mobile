import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveProfileName,
  isValidProfileName,
  normalizeProfileNamePart,
} from "./profile-name.ts";

test("derives profile name from trimmed nonempty parts", () => {
  assert.equal(deriveProfileName("  Owner ", " Example  "), "Owner Example");
  assert.equal(deriveProfileName("Owner", "   "), "Owner");
  assert.equal(deriveProfileName("   ", "Example"), "Example");
  assert.equal(normalizeProfileNamePart("  Owner  "), "Owner");
});

test("validates profile name without legacy 2-20 character restriction", () => {
  // Sensible non-blank validation: both first and last must be non-blank
  assert.equal(isValidProfileName("A", "B"), true);
  assert.equal(
    isValidProfileName("Alexander", "VeryLongLastNameExceedingTwentyChars"),
    true,
  );
  assert.equal(isValidProfileName("   ", "Smith"), false);
  assert.equal(isValidProfileName("John", "   "), false);
  assert.equal(isValidProfileName("", ""), false);
});
