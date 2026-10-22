import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository.ts";
import { SubscriptionController, type AuthSnapshot } from "./subscription-controller.ts";
import { SubscriptionRepositoryError, type SubscriptionRepository } from "./subscription-repository.ts";
import type { CreateSubscriptionInput, SubscriptionRecord } from "./subscription-model.ts";

const input: CreateSubscriptionInput = {
  name: "Test", price: 10, currency: "USD", frequency: "monthly",
  category: "news", paymentMethod: "Card",
};
const record: SubscriptionRecord = {
  ...input, id: "sub_test", status: "active", startDate: "2026-01-01T00:00:00Z",
};
const auth: AuthSnapshot = { status: "signed-in", userId: "user_1", sessionId: "sess_1" };
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function repository(overrides: Partial<SubscriptionRepository> = {}): SubscriptionRepository {
  const memory = new InMemorySubscriptionRepository();
  return {
    list: () => memory.list(),
    get: id => memory.get(id),
    create: payload => memory.create(payload),
    update: (id, payload) => memory.update(id, payload),
    cancel: id => memory.cancel(id),
    delete: id => memory.delete(id),
    reset: () => memory.reset(),
    ...overrides,
  };
}

test("backend-not-connected refuses actions without repository calls or fallback", async () => {
  let calls = 0;
  const controller = new SubscriptionController(repository({ list: async () => { calls++; return []; } }), false);
  controller.updateAuth(auth);
  assert.equal(controller.getState().status, "backend-not-connected");
  assert.equal((await controller.createSubscription(input)).status, "error");
  await controller.retry();
  assert.equal(calls, 0);
});

test("development controller starts empty and performs all subscription actions", async () => {
  const controller = new SubscriptionController(repository(), true);
  controller.updateAuth(auth);
  await tick();
  assert.deepEqual(controller.getState(), { status: "ready", subscriptions: [] });
  const created = await controller.createSubscription(input);
  assert.equal(created.status, "success");
  if (created.status !== "success" || !created.subscriptionId) assert.fail();
  const id = created.subscriptionId;
  assert.equal((await controller.getSubscription(id)).status, "success");
  assert.equal((await controller.updateSubscription(id, { name: "Edited" })).status, "success");
  assert.equal((await controller.cancelSubscription(id)).status, "success");
  const cancelled = controller.getState();
  if (cancelled.status !== "ready") assert.fail();
  assert.equal(cancelled.subscriptions[0].status, "cancelled");
  assert.equal((await controller.deleteSubscription(id)).status, "success");
  assert.deepEqual(controller.getState(), { status: "ready", subscriptions: [] });
});

for (const next of [
  { status: "signed-out" },
  { status: "loading" },
  { status: "signed-in", userId: "user_2", sessionId: "sess_2" },
  { status: "signed-in", userId: "user_1", sessionId: "sess_2" },
] satisfies AuthSnapshot[]) {
  test(`auth transition clears records and action state synchronously: ${JSON.stringify(next)}`, async () => {
    const repo = repository();
    const controller = new SubscriptionController(repo, true);
    controller.updateAuth(auth);
    await tick();
    await controller.createSubscription(input);
    controller.updateAuth(next);
    assert.notEqual(controller.getState().status, "ready");
    assert.deepEqual(controller.getActionState(), { status: "idle" });
    assert.deepEqual(await repo.list(), []);
    await tick();
    if (next.status === "signed-in") {
      assert.deepEqual(controller.getState(), { status: "ready", subscriptions: [] });
    }
  });

  for (const rejection of [false, true]) {
    test(`stale action ${rejection ? "rejection" : "completion"} is ignored: ${JSON.stringify(next)}`, async () => {
      const pending = deferred<SubscriptionRecord>();
      const controller = new SubscriptionController(repository({ create: () => pending.promise }), true);
      controller.updateAuth(auth);
      await tick();
      const result = controller.createSubscription(input);
      controller.updateAuth(next);
      await tick();
      const state = controller.getState();
      const action = controller.getActionState();
      if (rejection) pending.reject(new Error("Old-session failure"));
      else pending.resolve(record);
      assert.equal((await result).status, "stale");
      assert.strictEqual(controller.getState(), state);
      assert.strictEqual(controller.getActionState(), action);
    });
  }
}

test("unchanged auth does not reset existing development records", async () => {
  const controller = new SubscriptionController(repository(), true);
  controller.updateAuth(auth);
  await tick();
  await controller.createSubscription(input);
  const before = controller.getState();
  controller.updateAuth(auth);
  assert.strictEqual(controller.getState(), before);
});

test("repeated duplicate attempts and UI dismissals cannot unlock a pending mutation", async () => {
  const pending = deferred<SubscriptionRecord>();
  let calls = 0;
  const controller = new SubscriptionController(repository({
    create: () => { calls++; return pending.promise; },
  }), true);
  controller.updateAuth(auth);
  await tick();
  const first = controller.createSubscription(input);
  const action = controller.getActionState();
  for (let index = 0; index < 5; index++) {
    const duplicate = await controller.createSubscription(input);
    assert.equal(duplicate.status, "error");
    if (duplicate.status !== "error") assert.fail();
    assert.equal(duplicate.failure.code, "ACTION_PENDING");
    controller.clearAction();
    await controller.retry();
    assert.strictEqual(controller.getActionState(), action);
  }
  assert.equal(calls, 1);
  pending.resolve(record);
  assert.equal((await first).status, "success");
});

test("dispose clears visible records, blocks actions/retry/reactivation, and is idempotent", async () => {
  const repo = repository();
  const controller = new SubscriptionController(repo, true);
  controller.updateAuth(auth);
  await tick();
  await controller.createSubscription(input);
  controller.dispose();
  const state = controller.getState();
  assert.deepEqual(state, { status: "signed-out" });
  assert.deepEqual(controller.getActionState(), { status: "idle" });
  assert.deepEqual(await repo.list(), []);
  assert.equal((await controller.createSubscription(input)).status, "error");
  controller.updateAuth(auth);
  controller.clearAction();
  await controller.retry();
  controller.dispose();
  assert.strictEqual(controller.getState(), state);
  assert.deepEqual(controller.getActionState(), { status: "idle" });
  assert.deepEqual(await repo.list(), []);
});

for (const rejection of [false, true]) {
  test(`dispose suppresses in-flight ${rejection ? "failure" : "success"}`, async () => {
    const pending = deferred<SubscriptionRecord>();
    const controller = new SubscriptionController(repository({ get: () => pending.promise }), true);
    controller.updateAuth(auth);
    await tick();
    const action = controller.getSubscription("sub_test");
    controller.dispose();
    if (rejection) pending.reject(new Error("Late failure"));
    else pending.resolve(record);
    assert.equal((await action).status, "stale");
    assert.deepEqual(controller.getState(), { status: "signed-out" });
    assert.deepEqual(controller.getActionState(), { status: "idle" });
  });
}

test("operational/validation/missing-record action failures release pending state and permit recovery", async () => {
  for (const failure of [
    new Error("Operation failed"),
    new SubscriptionRepositoryError("Invalid input", { code: "VALIDATION_ERROR" }),
    new SubscriptionRepositoryError("Missing", { code: "NOT_FOUND" }),
  ]) {
    let failed = false;
    const controller = new SubscriptionController(repository({
      create: async () => {
        if (!failed) { failed = true; throw failure; }
        return record;
      },
    }), true);
    controller.updateAuth(auth);
    await tick();
    const result = await controller.createSubscription(input);
    assert.notEqual(result.status, "success");
    assert.notEqual(controller.getActionState().status, "pending");
    assert.equal((await controller.createSubscription(input)).status, "success");
  }
});

test("list failure exposes retry and a successful retry recovers", async () => {
  let calls = 0;
  const controller = new SubscriptionController(repository({
    list: async () => { if (++calls === 1) throw new Error("Read failed"); return []; },
  }), true);
  controller.updateAuth(auth);
  await tick();
  const failure = controller.getState();
  assert.equal(failure.status, "error");
  if (failure.status !== "error") assert.fail();
  assert.equal(failure.failure.retryable, true);
  await controller.retry();
  assert.deepEqual(controller.getState(), { status: "ready", subscriptions: [] });
});

test("overlapping list retries only accept the newest result", async () => {
  const first = deferred<SubscriptionRecord[]>();
  const second = deferred<SubscriptionRecord[]>();
  let calls = 0;
  const controller = new SubscriptionController(repository({
    list: () => ++calls === 1 ? first.promise : second.promise,
  }), true);
  controller.updateAuth(auth);
  const retry = controller.retry();
  second.resolve([]);
  await retry;
  first.reject(new Error("Older list failed"));
  await tick();
  assert.deepEqual(controller.getState(), { status: "ready", subscriptions: [] });
});
