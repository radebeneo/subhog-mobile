import { isDevelopmentDataModeActive } from "@/features/subscriptions/data-mode";
import { useSubscriptionSession } from "@/features/subscriptions/use-subscription-session";
import {
  type AuthSnapshot,
  type SubscriptionActionResult,
  type SubscriptionActionState,
  type SubscriptionState,
} from "@/features/subscriptions/subscription-controller";
import { toDisplaySubscription } from "@/features/subscriptions/subscription-display";
import { useSubscriptionIcons } from "@/features/subscriptions/use-subscription-icons";
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from "@/features/subscriptions/subscription-model";
import { useAuth } from "@clerk/expo";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

interface SubscriptionContextValue {
  state: SubscriptionState;
  actionState: SubscriptionActionState;
  subscriptions: Subscription[];
  isDevelopmentMode: boolean;
  retry: () => Promise<void>;
  clearAction: () => void;
  getSubscription: (id: string) => Promise<SubscriptionActionResult>;
  createSubscription: (
    payload: CreateSubscriptionInput,
  ) => Promise<SubscriptionActionResult>;
  updateSubscription: (
    id: string,
    payload: UpdateSubscriptionInput,
  ) => Promise<SubscriptionActionResult>;
  cancelSubscription: (id: string) => Promise<SubscriptionActionResult>;
  deleteSubscription: (id: string) => Promise<SubscriptionActionResult>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, sessionId, userId } = useAuth();

  const isDevMode = isDevelopmentDataModeActive(
    typeof __DEV__ !== "undefined" ? __DEV__ : false,
    process.env.EXPO_PUBLIC_DATA_MODE,
  );

  const auth: AuthSnapshot = !isLoaded
    ? { status: "loading" }
    : !isSignedIn || !userId || !sessionId
      ? { status: "signed-out" }
      : { status: "signed-in", userId, sessionId };
  const { state, actionState, ...actions } = useSubscriptionSession(auth, isDevMode);

  const records = useMemo(
    () => state.status === "ready" ? state.subscriptions : [],
    [state],
  );
  const iconScope = JSON.stringify([isLoaded, isSignedIn, userId, sessionId, isDevMode]);
  const subscriptionIcons = useSubscriptionIcons(records, iconScope);
  const subscriptions = useMemo(
    () => records.map(record => toDisplaySubscription(
      record,
      subscriptionIcons?.get(record.name),
    )),
    [records, subscriptionIcons],
  );

  return (
    <SubscriptionContext.Provider
      value={{
        state,
        actionState,
        subscriptions,
        isDevelopmentMode: isDevMode,
        ...actions,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscriptions must be used within SubscriptionProvider",
    );
  }
  return context;
}
