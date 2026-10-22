import type {
  CreateSubscriptionInput,
  SubscriptionRecord,
  UpdateSubscriptionInput,
} from "./subscription-model.ts";
import {
  SubscriptionRepositoryError,
  type SubscriptionRepository,
} from "./subscription-repository.ts";

export type SubscriptionAction =
  | "create"
  | "get"
  | "update"
  | "cancel"
  | "delete";

export type SubscriptionOperation =
  | "subscriptions"
  | SubscriptionAction;

export interface SubscriptionFailure {
  operation: SubscriptionOperation;
  code: string;
  message: string;
  retryable: boolean;
  notFound?: boolean;
}

export type SubscriptionState =
  | { status: "authentication-loading" }
  | { status: "signed-out" }
  | { status: "backend-not-connected" }
  | { status: "loading-subscriptions" }
  | { status: "ready"; subscriptions: SubscriptionRecord[] }
  | { status: "error"; failure: SubscriptionFailure };

export type AuthSnapshot =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; userId: string; sessionId: string };

type SubscriptionActionSuccessState = {
  status: "success";
  operation: SubscriptionAction;
  subscriptionId?: string;
  subscription?: SubscriptionRecord;
};

type SubscriptionActionFailureState = {
  status: "validation-error" | "not-found" | "error";
  operation: SubscriptionAction;
  subscriptionId?: string;
  failure: SubscriptionFailure;
};

export type SubscriptionActionState =
  | { status: "idle" }
  | {
      status: "pending";
      operation: SubscriptionAction;
      subscriptionId?: string;
    }
  | SubscriptionActionSuccessState
  | SubscriptionActionFailureState;

export type SubscriptionActionResult =
  | Exclude<SubscriptionActionState, { status: "idle" | "pending" }>
  | {
      status: "stale";
      operation: SubscriptionAction;
      subscriptionId?: string;
    };

type Listener = () => void;

interface ActiveAction {
  generation: number;
  sequence: number;
  operation: SubscriptionAction;
  subscriptionId?: string;
}

export class SubscriptionController {
  private readonly repository: SubscriptionRepository | null;
  private readonly isDevDataMode: boolean;
  private state: SubscriptionState = { status: "authentication-loading" };
  private actionState: SubscriptionActionState = { status: "idle" };
  private readonly listeners = new Set<Listener>();
  private generation = 0;
  private actionSequence = 0;
  private sessionKey: string | null = null;
  private currentAction: ActiveAction | null = null;
  private disposed = false;
  private loadSequence = 0;

  constructor(
    repository: SubscriptionRepository | null,
    isDevDataMode = false,
  ) {
    this.repository = repository;
    this.isDevDataMode = isDevDataMode;
  }

  getState = (): SubscriptionState => this.state;
  getActionState = (): SubscriptionActionState => this.actionState;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  updateAuth(auth: AuthSnapshot): void {
    if (this.disposed) return;
    const nextKey =
      auth.status === "signed-in" ? `${auth.userId}:${auth.sessionId}` : null;

    if (auth.status === "signed-in" && this.sessionKey === nextKey) {
      return;
    }

    this.invalidate();

    if (auth.status === "loading") {
      this.setState({ status: "authentication-loading" });
      return;
    }

    if (auth.status === "signed-out") {
      this.setState({ status: "signed-out" });
      return;
    }

    this.sessionKey = nextKey;

    if (!this.isDevDataMode || !this.repository) {
      this.setState({ status: "backend-not-connected" });
      return;
    }

    void this.loadSubscriptions();
  }

  retry = async (): Promise<void> => {
    if (this.disposed || !this.sessionKey || this.actionState.status === "pending") return;
    if (!this.isDevDataMode || !this.repository) {
      this.setState({ status: "backend-not-connected" });
      return;
    }
    await this.loadSubscriptions();
  };

  clearAction = (): void => {
    // A UI dismissal must not unlock an unresolved mutation.
    if (this.disposed || this.actionState.status === "pending") return;
    this.actionSequence += 1;
    this.currentAction = null;
    if (this.actionState.status !== "idle") {
      this.setActionState({ status: "idle" });
    }
  };

  getSubscription = async (id: string): Promise<SubscriptionActionResult> => {
    const action = this.startAction("get", id);
    if (!action) return this.unavailableResult("get", id);

    try {
      const subscription = await this.repository!.get(id);
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "get", subscriptionId: id };
      }

      this.replaceLocalSubscription(subscription);
      const result: SubscriptionActionResult = {
        status: "success",
        operation: "get",
        subscriptionId: id,
        subscription,
      };
      this.setActionState(result);
      return result;
    } catch (error) {
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "get", subscriptionId: id };
      }
      return this.handleActionFailure("get", error, id);
    }
  };

  createSubscription = async (
    payload: CreateSubscriptionInput,
  ): Promise<SubscriptionActionResult> => {
    const action = this.startAction("create");
    if (!action) return this.unavailableResult("create");

    try {
      const subscription = await this.repository!.create(payload);
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "create" };
      }

      this.addLocalSubscription(subscription);
      const result: SubscriptionActionResult = {
        status: "success",
        operation: "create",
        subscriptionId: subscription.id,
        subscription,
      };
      this.setActionState(result);
      return result;
    } catch (error) {
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "create" };
      }
      return this.handleActionFailure("create", error);
    }
  };

  updateSubscription = async (
    id: string,
    payload: UpdateSubscriptionInput,
  ): Promise<SubscriptionActionResult> => {
    const action = this.startAction("update", id);
    if (!action) return this.unavailableResult("update", id);

    try {
      const subscription = await this.repository!.update(id, payload);
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "update", subscriptionId: id };
      }

      this.replaceLocalSubscription(subscription);
      const result: SubscriptionActionResult = {
        status: "success",
        operation: "update",
        subscriptionId: id,
        subscription,
      };
      this.setActionState(result);
      return result;
    } catch (error) {
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "update", subscriptionId: id };
      }
      return this.handleActionFailure("update", error, id);
    }
  };

  cancelSubscription = async (
    id: string,
  ): Promise<SubscriptionActionResult> => {
    const action = this.startAction("cancel", id);
    if (!action) return this.unavailableResult("cancel", id);

    try {
      const subscription = await this.repository!.cancel(id);
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "cancel", subscriptionId: id };
      }

      this.replaceLocalSubscription(subscription);
      const result: SubscriptionActionResult = {
        status: "success",
        operation: "cancel",
        subscriptionId: id,
        subscription,
      };
      this.setActionState(result);
      return result;
    } catch (error) {
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "cancel", subscriptionId: id };
      }
      return this.handleActionFailure("cancel", error, id);
    }
  };

  deleteSubscription = async (
    id: string,
  ): Promise<SubscriptionActionResult> => {
    const action = this.startAction("delete", id);
    if (!action) return this.unavailableResult("delete", id);

    try {
      await this.repository!.delete(id);
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "delete", subscriptionId: id };
      }

      this.removeLocalSubscription(id);
      const result: SubscriptionActionResult = {
        status: "success",
        operation: "delete",
        subscriptionId: id,
      };
      this.setActionState(result);
      return result;
    } catch (error) {
      if (!this.isCurrentAction(action)) {
        return { status: "stale", operation: "delete", subscriptionId: id };
      }
      return this.handleActionFailure("delete", error, id);
    }
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.invalidate();
    this.setState({ status: "signed-out" });
    this.listeners.clear();
  }

  private async loadSubscriptions(): Promise<void> {
    const generation = this.generation;
    const sequence = ++this.loadSequence;
    this.setState({ status: "loading-subscriptions" });

    try {
      const subscriptions = await this.repository!.list();
      if (this.disposed || generation !== this.generation || sequence !== this.loadSequence) return;
      this.setState({ status: "ready", subscriptions });
    } catch (error) {
      if (this.disposed || generation !== this.generation || sequence !== this.loadSequence) return;
      this.setState({
        status: "error",
        failure: {
          operation: "subscriptions",
          code: "SUBSCRIPTIONS_READ_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load subscriptions.",
          retryable: true,
        },
      });
    }
  }

  private startAction(
    operation: SubscriptionAction,
    subscriptionId?: string,
  ): ActiveAction | null {
    if (this.disposed || !this.sessionKey || this.state.status !== "ready" || !this.repository) {
      return null;
    }

    // Duplicate submission prevention: if an action is pending, reject new one
    if (this.actionState.status === "pending") {
      return null;
    }

    this.actionSequence += 1;
    const action: ActiveAction = {
      generation: this.generation,
      sequence: this.actionSequence,
      operation,
      subscriptionId,
    };
    this.currentAction = action;
    this.setActionState({ status: "pending", operation, subscriptionId });
    return action;
  }

  private isCurrentAction(action: ActiveAction): boolean {
    return (
      !this.disposed &&
      action.generation === this.generation &&
      action.sequence === this.actionSequence &&
      this.currentAction === action
    );
  }

  private handleActionFailure(
    operation: SubscriptionAction,
    error: unknown,
    subscriptionId?: string,
  ): SubscriptionActionFailureState {
    this.currentAction = null;
    const isNotFound =
      error instanceof SubscriptionRepositoryError &&
      error.code === "NOT_FOUND";
    const isValidation =
      error instanceof SubscriptionRepositoryError &&
      error.code === "VALIDATION_ERROR";

    const failure: SubscriptionFailure = {
      operation,
      code: isNotFound
        ? "SUBSCRIPTION_NOT_FOUND"
        : isValidation
          ? "VALIDATION_ERROR"
          : "OPERATION_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "The request could not be completed.",
      retryable:
        error instanceof SubscriptionRepositoryError
          ? error.retryable
          : false,
      notFound: isNotFound,
    };

    const status = isNotFound
      ? "not-found"
      : isValidation
        ? "validation-error"
        : "error";

    const result: SubscriptionActionFailureState = {
      status,
      operation,
      subscriptionId,
      failure,
    };

    this.setActionState(result);
    return result;
  }

  private unavailableResult(
    operation: SubscriptionAction,
    subscriptionId?: string,
  ): SubscriptionActionFailureState {
    const pending = this.actionState.status === "pending";
    const result: SubscriptionActionFailureState = {
      status: "error",
      operation,
      subscriptionId,
      failure: {
        operation,
        code: pending ? "ACTION_PENDING" : "BACKEND_UNAVAILABLE",
        message: pending
          ? "Another subscription action is still pending."
          : "Subscriptions are not available in the current mode.",
        retryable: false,
      },
    };
    // Return the rejection to its caller without changing another action's state.
    if (!pending && !this.disposed && this.sessionKey) {
      this.setActionState(result);
    }
    return result;
  }

  private addLocalSubscription(record: SubscriptionRecord): void {
    if (this.state.status !== "ready") return;
    this.setState({
      status: "ready",
      subscriptions: [record, ...this.state.subscriptions],
    });
  }

  private replaceLocalSubscription(record: SubscriptionRecord): void {
    if (this.state.status !== "ready") return;
    const exists = this.state.subscriptions.some(
      (item) => item.id === record.id,
    );
    const subscriptions = exists
      ? this.state.subscriptions.map((item) =>
          item.id === record.id ? record : item,
        )
      : [record, ...this.state.subscriptions];
    this.setState({ status: "ready", subscriptions });
  }

  private removeLocalSubscription(id: string): void {
    if (this.state.status !== "ready") return;
    this.setState({
      status: "ready",
      subscriptions: this.state.subscriptions.filter(
        (item) => item.id !== id,
      ),
    });
  }

  private invalidate(): void {
    this.generation += 1;
    this.actionSequence += 1;
    this.currentAction = null;
    this.sessionKey = null;
    this.actionState = { status: "idle" };
    // Reset development data on session switch / sign-out
    if (this.isDevDataMode && this.repository?.reset) {
      this.repository.reset();
    }
  }

  private setState(state: SubscriptionState): void {
    this.state = state;
    this.emit();
  }

  private setActionState(state: SubscriptionActionState): void {
    this.actionState = state;
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
