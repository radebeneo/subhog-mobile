import assert from "node:assert/strict";
import test, { afterEach, beforeEach, mock } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { SubscriptionProvider, useSubscriptions } from "./SubscriptionContext.tsx";
import AppLayout from "../../app/(app)/_layout.tsx";
import { auth } from "../../test-support/native-mocks.mjs";

beforeEach(() => {
  mock.method(globalThis, "fetch", async () => Response.json({ icons: [] }));
});
afterEach(() => mock.restoreAll());

type Context = ReturnType<typeof useSubscriptions>;
const input = { name: "Private", price: 10, currency: "USD", frequency: "monthly", category: "news", paymentMethod: "Card" } as const;

test("actual provider survives Strict Mode replay, hides old scope synchronously, and blocks retained callbacks", async () => {
  Object.assign(auth, { isLoaded: true, isSignedIn: true, userId: "user_1", sessionId: "session_1" });
  let current!: Context;
  const renders: Context[] = [];
  function Consumer() {
    current = useSubscriptions();
    renders.push(current);
    return null;
  }
  const view = () => React.createElement(React.StrictMode, null,
    React.createElement(SubscriptionProvider, null, React.createElement(Consumer)));
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(view()); });
  assert.equal(current.state.status, "ready");
  await act(async () => { await current.createSubscription(input); });
  assert.equal(current.subscriptions.length, 1);
  const old = current;
  for (const change of [
    { userId: "user_1", sessionId: "session_2" },
    { userId: "user_2", sessionId: "session_3" },
    { isSignedIn: false, userId: null, sessionId: null },
  ]) {
    const offset = renders.length;
    Object.assign(auth, change);
    await act(async () => { renderer.update(view()); });
    assert.ok(renders.slice(offset).every(value => value.subscriptions.length === 0));
    assert.equal(current.actionState.status, "idle");
    assert.equal((await old.createSubscription(input)).status, "error");
  }
  await act(async () => { renderer.unmount(); });
  assert.equal((await current.createSubscription(input)).status, "error");
});

test("provider exposes the resolved logo without storing it in subscription records", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({ icons: ["simple-icons:netflix"] }));
  Object.assign(auth, { isLoaded: true, isSignedIn: true, userId: "user_logo", sessionId: "session_logo" });
  let current!: Context;
  function Consumer() { current = useSubscriptions(); return null; }
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => {
      renderer = create(React.createElement(SubscriptionProvider, null, React.createElement(Consumer)));
    });
    await act(async () => { await current.createSubscription({ ...input, name: "Netflix" }); });
    assert.deepEqual(current.subscriptions[0].icon, {
      uri: "https://api.iconify.design/simple-icons/netflix.svg",
    });
    assert.equal(current.state.status, "ready");
    if (current.state.status === "ready") {
      assert.ok(!("icon" in current.state.subscriptions[0]));
    }
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});

test("release gate uses actual provider: backend-not-connected even with development env setting", async () => {
  Object.defineProperty(globalThis, "__DEV__", { value: false, configurable: true });
  Object.assign(auth, { isLoaded: true, isSignedIn: true, userId: "user_1", sessionId: "session_1" });
  let current!: Context;
  function Consumer() { current = useSubscriptions(); return null; }
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => {
      renderer = create(React.createElement(SubscriptionProvider, null, React.createElement(Consumer)));
    });
    assert.equal(current.isDevelopmentMode, false);
    assert.equal(current.state.status, "backend-not-connected");
    await act(async () => {
      assert.equal((await current.createSubscription(input)).status, "error");
    });
    assert.deepEqual(current.subscriptions, []);
  } finally {
    await act(async () => { renderer?.unmount(); });
    Object.defineProperty(globalThis, "__DEV__", { value: true, configurable: true });
  }
});

test("authenticated layout renders the full stack without a development banner or extra safe-area spacer", async () => {
  Object.assign(auth, { isLoaded: true, isSignedIn: true, userId: "user_1", sessionId: "session_1" });
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(React.createElement(AppLayout)); });
    assert.equal(renderer.root.findAllByProps({ accessibilityLabel: "Development data — resets on reload" }).length, 0);
    assert.equal(renderer.root.findAllByType("Text" as unknown as React.ElementType).length, 0);
    assert.equal(renderer.root.findAllByType("SafeAreaView" as unknown as React.ElementType).length, 0);
    assert.ok(renderer.root.findByType("Stack" as unknown as React.ElementType));
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});
