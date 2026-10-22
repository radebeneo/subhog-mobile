import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateNextRenewalDate,
  getUpcomingRenewals,
  groupRecurringAmounts,
  isNonNegativeMoneyAmount,
  isPositiveMoneyAmount,
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_CURRENCIES,
  SUBSCRIPTION_FREQUENCIES,
  SUBSCRIPTION_STATUSES,
  validateCreateSubscriptionInput,
  validateUpdateSubscriptionInput,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
} from "./subscription-model.ts";

test("money amount predicates validate non-negative and strictly positive amounts", () => {
  assert.equal(isNonNegativeMoneyAmount(0), true);
  assert.equal(isNonNegativeMoneyAmount(12.5), true);
  assert.equal(isNonNegativeMoneyAmount(-1), false);
  assert.equal(isNonNegativeMoneyAmount(Number.NaN), false);
  assert.equal(isNonNegativeMoneyAmount("10"), false);

  assert.equal(isPositiveMoneyAmount(0), false);
  assert.equal(isPositiveMoneyAmount(12.5), true);
  assert.equal(isPositiveMoneyAmount(-5), false);
});

test("recurring amounts stay grouped by currency and billing frequency", () => {
  const groups = groupRecurringAmounts([
    { price: 100, currency: "ZAR", billing: "Monthly" },
    { price: 50, currency: "ZAR", billing: "Monthly" },
    { price: 10, currency: "USD", billing: "Monthly" },
    { price: 120, currency: "GBP", billing: "Yearly" },
  ]);

  assert.deepEqual(groups, [
    ["GBP:Yearly", { total: 120, currency: "GBP", billing: "Yearly" }],
    ["USD:Monthly", { total: 10, currency: "USD", billing: "Monthly" }],
    ["ZAR:Monthly", { total: 150, currency: "ZAR", billing: "Monthly" }],
  ]);
});

test("upcoming renewals are sorted by date and filter out null renewal dates", () => {
  const items = [
    { id: "3", renewalDate: "2026-11-15T00:00:00.000Z" },
    { id: "1", renewalDate: "2026-10-25T00:00:00.000Z" },
    { id: "no-date", renewalDate: null },
    { id: "2", renewalDate: "2026-11-01T00:00:00.000Z" },
  ];

  const upcoming = getUpcomingRenewals(items, 2);
  assert.deepEqual(
    upcoming.map((i) => i.id),
    ["1", "2"],
  );
});

test("calendar renewal increments follow dayjs calendar units", () => {
  assert.equal(
    calculateNextRenewalDate("2026-01-31T00:00:00.000Z", "monthly"),
    "2026-02-28T00:00:00.000Z",
  );
  assert.equal(
    calculateNextRenewalDate("2026-05-10T12:00:00.000Z", "yearly"),
    "2027-05-10T12:00:00.000Z",
  );
  assert.equal(
    calculateNextRenewalDate("2026-03-01T00:00:00.000Z", "weekly"),
    "2026-03-08T00:00:00.000Z",
  );
  assert.equal(
    calculateNextRenewalDate("2026-03-01T00:00:00.000Z", "daily"),
    "2026-03-02T00:00:00.000Z",
  );
});

test("preserves frontend product choices for currencies, frequencies, categories, and statuses", () => {
  assert.deepEqual(SUBSCRIPTION_CURRENCIES, ["USD", "GBP", "ZAR"]);
  assert.deepEqual(SUBSCRIPTION_FREQUENCIES, ["daily", "weekly", "monthly", "yearly"]);
  assert.deepEqual(SUBSCRIPTION_CATEGORIES, [
    "sports",
    "news",
    "entertainment",
    "education",
    "health",
    "others",
  ]);
  assert.deepEqual(SUBSCRIPTION_STATUSES, ["active", "cancelled", "expired"]);
});

test("validates create subscription inputs", () => {
  const valid: CreateSubscriptionInput = {
    name: "Spotify",
    price: 69,
    currency: "ZAR",
    frequency: "monthly",
    category: "entertainment",
    paymentMethod: "Card",
    startDate: "2026-01-01T00:00:00.000Z",
  };
  assert.equal(validateCreateSubscriptionInput(valid).valid, true);

  const invalidName = { ...valid, name: "   " };
  assert.equal(validateCreateSubscriptionInput(invalidName).valid, false);

  const invalidPrice = { ...valid, price: -5 };
  assert.equal(validateCreateSubscriptionInput(invalidPrice).valid, false);

  const invalidCurrency = { ...valid, currency: "EUR" as unknown as CreateSubscriptionInput["currency"] };
  assert.equal(validateCreateSubscriptionInput(invalidCurrency).valid, false);
});

test("validates update subscription inputs preserving optionality", () => {
  const validPartial: UpdateSubscriptionInput = {
    name: "Netflix Premium",
    price: 249,
  };
  assert.equal(validateUpdateSubscriptionInput(validPartial).valid, true);

  const invalidBlankName: UpdateSubscriptionInput = {
    name: "  ",
  };
  assert.equal(validateUpdateSubscriptionInput(invalidBlankName).valid, false);
});
