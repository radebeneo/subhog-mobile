import { useEffect, useState, useSyncExternalStore } from "react";
import { InMemorySubscriptionRepository } from "./in-memory-subscription-repository.ts";
import {
  SubscriptionController,
  type AuthSnapshot,
  type SubscriptionActionState,
  type SubscriptionState,
} from "./subscription-controller.ts";

const loadingState: SubscriptionState = { status: "authentication-loading" };
const signedOutState: SubscriptionState = { status: "signed-out" };
const idleAction: SubscriptionActionState = { status: "idle" };
const emptySubscribe = () => () => {};
// Never activated: old/mismatched renders can only call unavailable actions.
const unavailableController = new SubscriptionController(null);

interface SessionHolder {
  scope: string;
  controller: SubscriptionController;
}

export function useSubscriptionSession(auth: AuthSnapshot, isDevelopmentMode: boolean) {
  const authStatus = auth.status;
  const userId = auth.status === "signed-in" ? auth.userId : null;
  const sessionId = auth.status === "signed-in" ? auth.sessionId : null;
  const scope = JSON.stringify([authStatus, userId, sessionId, isDevelopmentMode]);
  const [sessionStore] = useState(() => {
    let snapshot: SessionHolder | null = null;
    const listeners = new Set<() => void>();
    return {
      getSnapshot: () => snapshot,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
      },
      replace: (next: SessionHolder | null) => {
        snapshot = next;
        listeners.forEach(listener => listener());
      },
    };
  });
  const holder = useSyncExternalStore(
    sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getSnapshot,
  );

  useEffect(() => {
    const repository = isDevelopmentMode ? new InMemorySubscriptionRepository() : null;
    const controller = new SubscriptionController(repository, isDevelopmentMode);
    controller.updateAuth(
      authStatus === "signed-in" && userId && sessionId
        ? { status: "signed-in", userId, sessionId }
        : authStatus === "loading"
          ? { status: "loading" }
          : { status: "signed-out" },
    );
    sessionStore.replace({ scope, controller });
    return () => {
      controller.dispose();
      sessionStore.replace(null);
    };
  }, [authStatus, userId, sessionId, isDevelopmentMode, scope, sessionStore]);

  // Hide old state synchronously, before effect cleanup/setup runs.
  const controller = holder?.scope === scope ? holder.controller : null;
  const fallback = authStatus === "signed-out" ? signedOutState : loadingState;
  const state = useSyncExternalStore(
    controller?.subscribe ?? emptySubscribe,
    controller?.getState ?? (() => fallback),
    controller?.getState ?? (() => fallback),
  );
  const actionState = useSyncExternalStore(
    controller?.subscribe ?? emptySubscribe,
    controller?.getActionState ?? (() => idleAction),
    controller?.getActionState ?? (() => idleAction),
  );
  const actions = controller ?? unavailableController;

  return {
    state,
    actionState,
    retry: actions.retry,
    clearAction: actions.clearAction,
    getSubscription: actions.getSubscription,
    createSubscription: actions.createSubscription,
    updateSubscription: actions.updateSubscription,
    cancelSubscription: actions.cancelSubscription,
    deleteSubscription: actions.deleteSubscription,
  };
}
