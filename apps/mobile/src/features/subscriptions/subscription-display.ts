import type { ImageSourcePropType } from "react-native";
import { icons } from "@/config/icons";
import type { SubscriptionRecord } from "./subscription-model";

const frequencyLabels: Record<SubscriptionRecord["frequency"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function toDisplaySubscription(
  record: SubscriptionRecord,
  icon: ImageSourcePropType = icons.wallet,
): Subscription {
  return {
    id: record.id,
    icon,
    name: record.name,
    category: record.category,
    paymentMethod: record.paymentMethod,
    status: record.status,
    startDate: record.startDate,
    price: record.price,
    currency: record.currency,
    frequency: record.frequency,
    billing: frequencyLabels[record.frequency],
    renewalDate: record.renewalDate,
  };
}
