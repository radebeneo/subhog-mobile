import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import { icons } from "@/config/icons";
import { findSubscriptionIcon } from "./subscription-icons.ts";

afterEach(() => mock.restoreAll());

test("resolves an exact brand match to an Iconify SVG", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    Response.json({ icons: ["mdi:movie", "simple-icons:netflix"] }));
  assert.deepEqual(await findSubscriptionIcon(" Netflix "), {
    uri: "https://api.iconify.design/simple-icons/netflix.svg",
  });
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.ok(fetchMock.mock.calls[0].arguments[1]?.signal instanceof AbortSignal);
});

test("retries with the brand name when a plan suffix hides the logo", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (url: string | URL | Request) =>
    Response.json({ icons: String(url).includes("Canva%20Pro")
      ? ["mdi:account"] : ["simple-icons:canva"] }));
  assert.deepEqual(await findSubscriptionIcon("Canva Pro"), {
    uri: "https://api.iconify.design/simple-icons/canva.svg",
  });
  assert.equal(fetchMock.mock.callCount(), 2);
});

test("falls back safely for blank names, missing matches, HTTP failures and offline errors", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ icons: [] }));
  assert.equal(await findSubscriptionIcon(" "), icons.wallet);
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(await findSubscriptionIcon("Unknown"), icons.wallet);
  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 503 }));
  assert.equal(await findSubscriptionIcon("Unknown"), icons.wallet);
  fetchMock.mock.mockImplementation(async () => { throw new Error("Offline"); });
  assert.equal(await findSubscriptionIcon("Unknown"), icons.wallet);
});
