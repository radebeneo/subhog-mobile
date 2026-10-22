import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { createRequire } from "node:module";

// The installed preview compiler's ESM entry has a CommonJS debug interop issue.
const { compile } = createRequire(import.meta.url)("react-native-css/compiler");

test("subscription card classes are unlayered on web and compile for native", async () => {
  const file = new URL("../global.css", import.meta.url);
  const result = await postcss([tailwind()]).process(fs.readFileSync(file, "utf8"), {
    from: fileURLToPath(file),
  });
  const classes = ["upcoming-card", "upcoming-row", "sub-card", "sub-head", "home-add-icon"];
  for (const name of classes) {
    let found = false;
    result.root.walkRules(`.${name}`, rule => {
      found = true;
      for (let parent = rule.parent; parent; parent = parent.parent) {
        assert.ok(!(parent.type === "atrule" && parent.name === "layer"),
          `${name} must not lose to React Native Web's unlayered defaults`);
      }
    });
    assert.ok(found, `${name} must be generated`);
  }
  const sheet = compile(result.css).stylesheet();
  const declarations = name => {
    const rules = sheet.s.find(([key]) => key === name)?.[1];
    assert.ok(rules, `${name} must compile for native`);
    return Object.assign({}, ...rules.flatMap(rule => rule.d ?? []));
  };
  assert.equal(declarations("upcoming-card").padding, 16);
  assert.equal(declarations("upcoming-card").borderColor, "#0000001a");
  assert.equal(declarations("upcoming-row").flexDirection, "row");
  assert.equal(declarations("sub-card").padding, 16);
  assert.equal(declarations("sub-head").flexDirection, "row");
  assert.equal(declarations("home-add-icon").width, 48);
});

test("home add button uses the centralized plus asset, not a text label", () => {
  const screen = fs.readFileSync(new URL("../app/(app)/(tabs)/index.tsx", import.meta.url), "utf8");
  assert.match(screen, /source=\{icons\.plus\}/);
  assert.match(screen, /accessibilityLabel="Add subscription"/);
  assert.doesNotMatch(screen, />Add<\/Text>/);
});
