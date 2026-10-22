import type {
  CreateSubscriptionInput,
  SubscriptionRecord,
  UpdateSubscriptionInput,
} from "./subscription-model.ts";

/**
 * Typed error for subscription repository operations.
 */
export class SubscriptionRepositoryError extends Error {
  readonly code: "NOT_FOUND" | "VALIDATION_ERROR" | "OPERATION_FAILED";
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      code: "NOT_FOUND" | "VALIDATION_ERROR" | "OPERATION_FAILED";
      retryable?: boolean;
    },
  ) {
    super(message);
    this.name = "SubscriptionRepositoryError";
    this.code = options.code;
    this.retryable = options.retryable ?? false;
  }
}

/**
 * App-owned contract for subscription data access.
 *
 * NOTE: Frontend session scoping is not server authorization.
 * A future backend adapter implementing this interface must authenticate
 * requests and enforce ownership independently on the server.
 */
export interface SubscriptionRepository {
  list(): Promise<SubscriptionRecord[]>;
  get(id: string): Promise<SubscriptionRecord>;
  create(input: CreateSubscriptionInput): Promise<SubscriptionRecord>;
  update(
    id: string,
    input: UpdateSubscriptionInput,
  ): Promise<SubscriptionRecord>;
  cancel(id: string): Promise<SubscriptionRecord>;
  delete(id: string): Promise<void>;
  reset?(): void;
}
