import {
  calculateNextRenewalDate,
  type CreateSubscriptionInput,
  SUBSCRIPTION_CURRENCIES,
  type SubscriptionFrequency,
} from "./subscription-model.ts";

type FormFields = Pick<
  CreateSubscriptionInput,
  "name" | "price" | "frequency" | "category" | "paymentMethod"
>;
interface InitialSubscription {
  currency?: string;
  frequency?: SubscriptionFrequency;
  startDate?: string;
  renewalDate?: string | null;
}

/** Edits omit dates unless the billing frequency was intentionally changed. */
export function buildSubscriptionFormInput(
  fields: FormFields,
  initial?: InitialSubscription,
  now = new Date(),
): CreateSubscriptionInput {
  const input: CreateSubscriptionInput = {
    ...fields,
    name: fields.name.trim(),
    paymentMethod: fields.paymentMethod.trim(),
    currency: SUBSCRIPTION_CURRENCIES.find(currency => currency === initial?.currency) ?? "ZAR",
  };
  if (!initial) {
    input.startDate = now.toISOString();
    input.renewalDate = calculateNextRenewalDate(input.startDate, fields.frequency);
  } else if (initial.frequency !== fields.frequency) {
    input.renewalDate = calculateNextRenewalDate(initial.startDate ?? now.toISOString(), fields.frequency);
  }
  return input;
}
