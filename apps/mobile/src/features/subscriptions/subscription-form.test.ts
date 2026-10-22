import assert from "node:assert/strict";
import test from "node:test";
import { buildSubscriptionFormInput } from "./subscription-form.ts";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository.ts";
import type { SubscriptionRecord } from "./subscription-model.ts";

const fields = {
  name: " Edited ",
  price: 20,
  frequency: "monthly",
  category: "news",
  paymentMethod: " Card ",
} as const;
const startDate = "2026-01-31T12:00:00+02:00";

for (const renewalDate of [undefined, null, "2027-03-01T00:00:00.000Z"]) {
  test(`unrelated form edits preserve original dates (${String(renewalDate)})`, async () => {
    const repo = new InMemorySubscriptionRepository();
    const original = await repo.create({
      ...fields, currency: "USD", startDate, renewalDate: renewalDate ?? null,
    });
    // Verify absent-date payload handling as well as the repository's null value.
    const initial: SubscriptionRecord = { ...original, renewalDate };
    const payload = buildSubscriptionFormInput(fields, initial);
    assert.equal("startDate" in payload, false);
    assert.equal("renewalDate" in payload, false);
    assert.equal(payload.currency, "USD");
    const updated = await repo.update(original.id, payload);
    assert.equal(updated.startDate, startDate);
    assert.equal(updated.renewalDate, original.renewalDate);
  });
}

test("intentional frequency change recalculates renewal but preserves start string", () => {
  const payload = buildSubscriptionFormInput({ ...fields, frequency: "yearly" }, {
    currency: "GBP", frequency: "monthly", startDate, renewalDate: null,
  });
  assert.equal("startDate" in payload, false);
  assert.equal(payload.renewalDate, "2027-01-31T10:00:00.000Z");
});

test("create form trims fields and calculates calendar renewal using an explicit clock", () => {
  const payload = buildSubscriptionFormInput(fields, undefined, new Date("2026-01-31T00:00:00Z"));
  assert.equal(payload.name, "Edited");
  assert.equal(payload.paymentMethod, "Card");
  assert.equal(payload.currency, "ZAR");
  assert.equal(payload.startDate, "2026-01-31T00:00:00.000Z");
  assert.equal(payload.renewalDate, "2026-02-28T00:00:00.000Z");
});
