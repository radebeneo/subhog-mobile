import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import SubscriptionIcon from "./SubscriptionIcon.tsx";
import { icons } from "@/config/icons";

test("remote SVGs preserve card classes, reserve dimensions, and fall back on failure", async () => {
  let renderer!: ReactTestRenderer;
  const props = {
    source: { uri: "https://api.iconify.design/simple-icons/netflix.svg?color=black" },
    size: 56,
    className: "upcoming-icon",
  };
  try {
    await act(async () => { renderer = create(React.createElement(SubscriptionIcon, props)); });
    assert.deepEqual(renderer.root.findByType("View" as unknown as React.ElementType).props.style, { width: 56, height: 56 });
    const svg = renderer.root.findByType("SvgUri" as unknown as React.ElementType);
    assert.equal(svg.props.width, 56);
    await act(async () => { svg.props.onError(new Error("Offline")); });
    assert.equal(renderer.root.findAllByType("SvgUri" as unknown as React.ElementType).length, 0);
    assert.equal(renderer.root.findByType("Image" as unknown as React.ElementType).props.source, icons.wallet);
    await act(async () => {
      renderer.update(React.createElement(SubscriptionIcon, {
        ...props, source: { uri: "https://api.iconify.design/simple-icons/spotify.svg" },
      }));
    });
    assert.equal(renderer.root.findAllByType("SvgUri" as unknown as React.ElementType).length, 1);
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});

test("bundled icons retain explicit sizing and contain scaling", async () => {
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => {
      renderer = create(React.createElement(SubscriptionIcon, {
        source: icons.wallet, size: 64, className: "sub-icon",
      }));
    });
    const image = renderer.root.findByType("Image" as unknown as React.ElementType);
    assert.deepEqual(image.props.style, { width: 64, height: 64 });
    assert.equal(image.props.resizeMode, "contain");
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});
