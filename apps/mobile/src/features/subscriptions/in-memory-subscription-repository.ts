import {
  calculateNextRenewalDate,
  validateCreateSubscriptionInput,
  validateUpdateSubscriptionInput,
  type CreateSubscriptionInput,
  type SubscriptionRecord,
  type UpdateSubscriptionInput,
} from "./subscription-model.ts";
import {
  SubscriptionRepositoryError,
  type SubscriptionRepository,
} from "./subscription-repository.ts";

let idCounter = 1;

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const sequence = (idCounter++).toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `sub_${timestamp}_${sequence}_${random}`;
}

export class InMemorySubscriptionRepository implements SubscriptionRepository {
  private records = new Map<string, SubscriptionRecord>();

  async list(): Promise<SubscriptionRecord[]> {
    return Array.from(this.records.values()).map((record) => ({ ...record }));
  }

  async get(id: string): Promise<SubscriptionRecord> {
    const record = this.records.get(id);
    if (!record) {
      throw new SubscriptionRepositoryError(`Subscription ${id} not found`, {
        code: "NOT_FOUND",
      });
    }
    return { ...record };
  }

  async create(input: CreateSubscriptionInput): Promise<SubscriptionRecord> {
    const validation = validateCreateSubscriptionInput(input);
    if (!validation.valid) {
      throw new SubscriptionRepositoryError(
        validation.errors.join("; "),
        { code: "VALIDATION_ERROR" },
      );
    }

    const startDate = input.startDate ?? new Date().toISOString();
    const renewalDate =
      input.renewalDate !== undefined
        ? input.renewalDate
        : calculateNextRenewalDate(startDate, input.frequency);

    const record: SubscriptionRecord = {
      id: generateId(),
      name: input.name.trim(),
      price: input.price,
      currency: input.currency,
      frequency: input.frequency,
      category: input.category,
      paymentMethod: input.paymentMethod.trim(),
      status: "active",
      startDate,
      renewalDate: renewalDate ?? null,
    };

    this.records.set(record.id, record);
    return { ...record };
  }

  async update(
    id: string,
    input: UpdateSubscriptionInput,
  ): Promise<SubscriptionRecord> {
    const existing = this.records.get(id);
    if (!existing) {
      throw new SubscriptionRepositoryError(`Subscription ${id} not found`, {
        code: "NOT_FOUND",
      });
    }

    const validation = validateUpdateSubscriptionInput(input);
    if (!validation.valid) {
      throw new SubscriptionRepositoryError(
        validation.errors.join("; "),
        { code: "VALIDATION_ERROR" },
      );
    }

    // Preserve unrelated fields; do not recalculate dates unless explicitly provided
    const updated: SubscriptionRecord = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      price: input.price !== undefined ? input.price : existing.price,
      currency: input.currency !== undefined ? input.currency : existing.currency,
      frequency: input.frequency !== undefined ? input.frequency : existing.frequency,
      category: input.category !== undefined ? input.category : existing.category,
      paymentMethod:
        input.paymentMethod !== undefined
          ? input.paymentMethod.trim()
          : existing.paymentMethod,
      status: input.status !== undefined ? input.status : existing.status,
      startDate: input.startDate !== undefined ? input.startDate : existing.startDate,
      renewalDate:
        input.renewalDate !== undefined
          ? input.renewalDate
          : existing.renewalDate,
    };

    this.records.set(id, updated);
    return { ...updated };
  }

  async cancel(id: string): Promise<SubscriptionRecord> {
    const existing = this.records.get(id);
    if (!existing) {
      throw new SubscriptionRepositoryError(`Subscription ${id} not found`, {
        code: "NOT_FOUND",
      });
    }

    // Cancelling tracking only alters status; does not delete record or contact merchant
    const cancelled: SubscriptionRecord = {
      ...existing,
      status: "cancelled",
    };

    this.records.set(id, cancelled);
    return { ...cancelled };
  }

  async delete(id: string): Promise<void> {
    if (!this.records.has(id)) {
      throw new SubscriptionRepositoryError(`Subscription ${id} not found`, {
        code: "NOT_FOUND",
      });
    }

    this.records.delete(id);
  }

  reset(): void {
    this.records.clear();
  }

  /**
   * Explicit development-only action to seed sample subscriptions.
   * This is never called automatically.
   */
  loadSampleRecords(): void {
    const now = new Date();
    const samples: CreateSubscriptionInput[] = [
      {
        name: "Netflix",
        price: 199,
        currency: "ZAR",
        frequency: "monthly",
        category: "entertainment",
        paymentMethod: "Visa ending 4242",
        startDate: now.toISOString(),
      },
      {
        name: "Spotify",
        price: 69,
        currency: "ZAR",
        frequency: "monthly",
        category: "entertainment",
        paymentMethod: "Mastercard ending 8812",
        startDate: now.toISOString(),
      },
      {
        name: "GitHub Copilot",
        price: 10,
        currency: "USD",
        frequency: "monthly",
        category: "education",
        paymentMethod: "PayPal",
        startDate: now.toISOString(),
      },
    ];

    for (const sample of samples) {
      void this.create(sample);
    }
  }
}
