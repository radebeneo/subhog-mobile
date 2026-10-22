import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository.ts";
import { SubscriptionRepositoryError } from "./subscription-repository.ts";

test("in-memory repository starts empty", async () => {
  const repo = new InMemorySubscriptionRepository();
  const list = await repo.list();
  assert.deepEqual(list, []);
});

test("supports create, get, list, update, cancel, and delete with non-MongoDB IDs", async () => {
  const repo = new InMemorySubscriptionRepository();

  // Create
  const created = await repo.create({
    name: "Netflix",
    price: 199,
    currency: "ZAR",
    frequency: "monthly",
    category: "entertainment",
    paymentMethod: "Card",
    startDate: "2026-01-01T00:00:00.000Z",
  });

  assert.ok(created.id);
  // Must NOT be a 24-character hex MongoDB ObjectId
  assert.equal(/^[0-9a-f]{24}$/i.test(created.id), false);
  assert.equal(created.name, "Netflix");
  assert.equal(created.status, "active");
  assert.ok(created.renewalDate);

  // List
  const list = await repo.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, created.id);

  // Get
  const fetched = await repo.get(created.id);
  assert.deepEqual(fetched, created);

  // Update unrelated field (price and name) preserves dates
  const updated = await repo.update(created.id, {
    name: "Netflix Standard",
    price: 159,
  });
  assert.equal(updated.name, "Netflix Standard");
  assert.equal(updated.price, 159);
  assert.equal(updated.startDate, created.startDate);
  assert.equal(updated.renewalDate, created.renewalDate);

  // Cancel tracking changes status to cancelled but keeps record in list
  const cancelled = await repo.cancel(created.id);
  assert.equal(cancelled.status, "cancelled");
  const listAfterCancel = await repo.list();
  assert.equal(listAfterCancel.length, 1);
  assert.equal(listAfterCancel[0].status, "cancelled");

  // Delete removes record
  await repo.delete(created.id);
  const listAfterDelete = await repo.list();
  assert.equal(listAfterDelete.length, 0);
});

test("missing record throws NOT_FOUND error on get, update, cancel, and delete", async () => {
  const repo = new InMemorySubscriptionRepository();
  const nonExistentId = "sub_does_not_exist";

  await assert.rejects(
    () => repo.get(nonExistentId),
    (err: SubscriptionRepositoryError) => err.code === "NOT_FOUND",
  );

  await assert.rejects(
    () => repo.update(nonExistentId, { name: "Test" }),
    (err: SubscriptionRepositoryError) => err.code === "NOT_FOUND",
  );

  await assert.rejects(
    () => repo.cancel(nonExistentId),
    (err: SubscriptionRepositoryError) => err.code === "NOT_FOUND",
  );

  await assert.rejects(
    () => repo.delete(nonExistentId),
    (err: SubscriptionRepositoryError) => err.code === "NOT_FOUND",
  );
});

test("invalid dates and prices fail with typed validation errors without altering records", async () => {
  const repo = new InMemorySubscriptionRepository();
  const input = {
    name: "Test", price: 10, currency: "USD", frequency: "monthly",
    category: "news", paymentMethod: "Card",
  } as const;
  for (const startDate of ["", "   ", "not-a-date"]) {
    await assert.rejects(repo.create({ ...input, startDate }),
      (error: unknown) => error instanceof SubscriptionRepositoryError && error.code === "VALIDATION_ERROR");
  }
  const original = await repo.create(input);
  for (const patch of [{ price: 0 }, { price: -1 }, { price: NaN }, { startDate: "" }, { renewalDate: "invalid" }]) {
    await assert.rejects(repo.update(original.id, patch),
      (error: unknown) => error instanceof SubscriptionRepositoryError && error.code === "VALIDATION_ERROR");
    assert.deepEqual(await repo.get(original.id), original);
  }
  assert.equal((await repo.list()).length, 1);
});

test("repository returns defensive copies and never shares records between instances", async () => {
  const first = new InMemorySubscriptionRepository();
  const second = new InMemorySubscriptionRepository();
  const created = await first.create({
    name: "Test", price: 10, currency: "USD", frequency: "monthly",
    category: "news", paymentMethod: "Card",
  });
  created.name = "Mutated outside repository";
  (await first.list())[0].price = 999;
  assert.equal((await first.get(created.id)).name, "Test");
  assert.equal((await first.get(created.id)).price, 10);
  assert.deepEqual(await second.list(), []);
});

test("reset clears all in-memory records", async () => {
  const repo = new InMemorySubscriptionRepository();
  await repo.create({
    name: "Test Sub",
    price: 50,
    currency: "USD",
    frequency: "monthly",
    category: "sports",
    paymentMethod: "Card",
  });

  assert.equal((await repo.list()).length, 1);
  repo.reset();
  assert.equal((await repo.list()).length, 0);
});
