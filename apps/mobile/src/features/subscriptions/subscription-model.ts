import dayjs from "dayjs";

export const SUBSCRIPTION_CURRENCIES = Object.freeze(["USD", "GBP", "ZAR"] as const);
export type SubscriptionCurrency = (typeof SUBSCRIPTION_CURRENCIES)[number];

export const SUBSCRIPTION_FREQUENCIES = Object.freeze([
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const);
export type SubscriptionFrequency = (typeof SUBSCRIPTION_FREQUENCIES)[number];

export const SUBSCRIPTION_CATEGORIES = Object.freeze([
  "sports",
  "news",
  "entertainment",
  "education",
  "health",
  "others",
] as const);
export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORIES)[number];

export const SUBSCRIPTION_STATUSES = Object.freeze([
  "active",
  "cancelled",
  "expired",
] as const);
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

const renewalUnits: Record<SubscriptionFrequency, "day" | "week" | "month" | "year"> =
  Object.freeze({
    daily: "day",
    weekly: "week",
    monthly: "month",
    yearly: "year",
  });

/**
 * Frontend-owned subscription model.
 * Opaque string id, no MongoDB ObjectId, no user owner field, no HTTP envelope.
 */
export interface SubscriptionRecord {
  id: string;
  name: string;
  price: number;
  currency: SubscriptionCurrency;
  frequency: SubscriptionFrequency;
  category: SubscriptionCategory;
  paymentMethod: string;
  status: SubscriptionStatus;
  startDate: string;
  renewalDate?: string | null;
}

export interface CreateSubscriptionInput {
  name: string;
  price: number;
  currency: SubscriptionCurrency;
  frequency: SubscriptionFrequency;
  category: SubscriptionCategory;
  paymentMethod: string;
  startDate?: string;
  renewalDate?: string | null;
}

export interface UpdateSubscriptionInput {
  name?: string;
  price?: number;
  currency?: SubscriptionCurrency;
  frequency?: SubscriptionFrequency;
  category?: SubscriptionCategory;
  paymentMethod?: string;
  status?: SubscriptionStatus;
  startDate?: string;
  renewalDate?: string | null;
}

export interface RecurringAmountSubscription {
  price: number;
  currency?: string | null;
  billing: string;
}

export interface RecurringAmountGroup {
  total: number;
  currency: string;
  billing: string;
}

export interface UpcomingRenewalItem {
  renewalDate?: string | null;
}

export function isNonNegativeMoneyAmount(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isPositiveMoneyAmount(value: unknown): boolean {
  return isNonNegativeMoneyAmount(value) && (value as number) > 0;
}

export function groupRecurringAmounts(
  subscriptions: readonly RecurringAmountSubscription[],
): [string, RecurringAmountGroup][] {
  const groups = subscriptions.reduce<Record<string, RecurringAmountGroup>>(
    (result, subscription) => {
      const currency = subscription.currency || "ZAR";
      const key = `${currency}:${subscription.billing}`;
      const group = result[key] || {
        total: 0,
        currency,
        billing: subscription.billing,
      };
      group.total += subscription.price;
      result[key] = group;
      return result;
    },
    {},
  );

  return Object.entries(groups).sort(([first], [second]) =>
    first.localeCompare(second),
  );
}

export function getUpcomingRenewals<T extends UpcomingRenewalItem>(
  subscriptions: readonly T[],
  limit = 3,
): T[] {
  return [...subscriptions]
    .filter((subscription) => Boolean(subscription.renewalDate))
    .sort(
      (first, second) =>
        dayjs(first.renewalDate).valueOf() - dayjs(second.renewalDate).valueOf(),
    )
    .slice(0, limit);
}

export function calculateNextRenewalDate(
  startDate: Date | string | number,
  frequency: SubscriptionFrequency,
): string {
  const unit = renewalUnits[frequency];
  if (!unit) {
    throw new RangeError("Unsupported subscription frequency");
  }
  return dayjs(startDate).add(1, unit).toISOString();
}

function isValidSubscriptionDate(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    dayjs(value).isValid()
  );
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCreateSubscriptionInput(
  input: CreateSubscriptionInput,
): ValidationResult {
  const errors: string[] = [];

  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    errors.push("Subscription name is required");
  }
  if (!isPositiveMoneyAmount(input.price)) {
    errors.push("Subscription price must be a positive number");
  }
  if (!SUBSCRIPTION_CURRENCIES.includes(input.currency)) {
    errors.push("Invalid subscription currency");
  }
  if (!SUBSCRIPTION_FREQUENCIES.includes(input.frequency)) {
    errors.push("Invalid subscription frequency");
  }
  if (!SUBSCRIPTION_CATEGORIES.includes(input.category)) {
    errors.push("Invalid subscription category");
  }
  if (
    typeof input.paymentMethod !== "string" ||
    input.paymentMethod.trim().length === 0
  ) {
    errors.push("Payment method is required");
  }
  if (input.startDate !== undefined && !isValidSubscriptionDate(input.startDate)) {
    errors.push("Invalid start date");
  }
  if (
    input.renewalDate !== undefined &&
    input.renewalDate !== null &&
    !isValidSubscriptionDate(input.renewalDate)
  ) {
    errors.push("Invalid renewal date");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateUpdateSubscriptionInput(
  input: UpdateSubscriptionInput,
): ValidationResult {
  const errors: string[] = [];

  if (
    input.name !== undefined &&
    (typeof input.name !== "string" || input.name.trim().length === 0)
  ) {
    errors.push("Subscription name cannot be blank");
  }
  if (input.price !== undefined && !isPositiveMoneyAmount(input.price)) {
    errors.push("Subscription price must be a positive number");
  }
  if (
    input.currency !== undefined &&
    !SUBSCRIPTION_CURRENCIES.includes(input.currency)
  ) {
    errors.push("Invalid subscription currency");
  }
  if (
    input.frequency !== undefined &&
    !SUBSCRIPTION_FREQUENCIES.includes(input.frequency)
  ) {
    errors.push("Invalid subscription frequency");
  }
  if (
    input.category !== undefined &&
    !SUBSCRIPTION_CATEGORIES.includes(input.category)
  ) {
    errors.push("Invalid subscription category");
  }
  if (
    input.paymentMethod !== undefined &&
    (typeof input.paymentMethod !== "string" ||
      input.paymentMethod.trim().length === 0)
  ) {
    errors.push("Payment method cannot be blank");
  }
  if (
    input.status !== undefined &&
    !SUBSCRIPTION_STATUSES.includes(input.status)
  ) {
    errors.push("Invalid subscription status");
  }
  if (input.startDate !== undefined && !isValidSubscriptionDate(input.startDate)) {
    errors.push("Invalid start date");
  }
  if (
    input.renewalDate !== undefined &&
    input.renewalDate !== null &&
    !isValidSubscriptionDate(input.renewalDate)
  ) {
    errors.push("Invalid renewal date");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
