import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSubscriptionIcons } from "./use-subscription-icons.ts";

afterEach(() => mock.restoreAll());

test("logos resolve asynchronously, deduplicate in Strict Mode, and refresh on rename", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (url: string | URL | Request) =>
    Response.json({ icons: [String(url).includes("Netflix") ? "simple-icons:netflix" : "simple-icons:spotify"] }));
  let current: ReturnType<typeof useSubscriptionIcons>;
  const records = [{ name: "Netflix" }, { name: "Netflix" }];
  function Consumer({ names }: { names: typeof records }) {
    current = useSubscriptionIcons(names, "session_1");
    return null;
  }
  const view = (names: typeof records) => React.createElement(
    React.StrictMode, null, React.createElement(Consumer, { names }),
  );
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(view(records)); });
    assert.deepEqual(current?.get("Netflix"), { uri: "https://api.iconify.design/simple-icons/netflix.svg" });
    assert.equal(fetchMock.mock.callCount(), 1);
    await act(async () => { renderer.update(view([{ name: "Netflix" }])); });
    assert.equal(fetchMock.mock.callCount(), 1);
    await act(async () => { renderer.update(view([{ name: "Spotify" }])); });
    assert.deepEqual(current?.get("Spotify"), { uri: "https://api.iconify.design/simple-icons/spotify.svg" });
    assert.equal(fetchMock.mock.callCount(), 2);
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});

test("a late lookup cannot populate another session's cache or an unmounted hook", async () => {
  const pending: ((response: Response) => void)[] = [];
  mock.method(globalThis, "fetch", () => new Promise<Response>(resolve => pending.push(resolve)));
  let current: ReturnType<typeof useSubscriptionIcons>;
  const records = [{ name: "Netflix" }];
  const renders: ReturnType<typeof useSubscriptionIcons>[] = [];
  function Consumer({ scope }: { scope: string }) {
    current = useSubscriptionIcons(records, scope);
    renders.push(current);
    return null;
  }
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(React.createElement(Consumer, { scope: "session_1" })); });
    assert.equal(current?.size, 0);
    await act(async () => {
      renderer.update(React.createElement(Consumer, { scope: "session_2" }));
    });
    const offset = renders.length;
    await act(async () => { pending[0](Response.json({ icons: ["simple-icons:netflix"] })); });
    assert.equal(current?.get("Netflix"), undefined);
    assert.ok(renders.slice(offset).every(value => !value?.has("Netflix")));
    await act(async () => { pending[1](Response.json({ icons: ["simple-icons:netflix"] })); });
    assert.ok(current?.has("Netflix"));

    await act(async () => {
      renderer.update(React.createElement(Consumer, { scope: "session_3" }));
    });
    assert.equal(current?.get("Netflix"), undefined);
    await act(async () => { renderer.unmount(); });
    const renderCount = renders.length;
    await act(async () => { pending[2](Response.json({ icons: ["simple-icons:netflix"] })); });
    assert.equal(renders.length, renderCount);
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});
