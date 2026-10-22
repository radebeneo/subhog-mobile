import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import CreateSubscriptionModal from "./CreateSubscriptionModal.tsx";
import type { SubscriptionActionResult } from "../features/subscriptions/subscription-controller.ts";
import type { CreateSubscriptionInput } from "../features/subscriptions/subscription-model.ts";

const initial: Subscription = {
  id: "sub_test", icon: { uri: "test-only" }, name: "Original", price: 10, currency: "USD",
  frequency: "monthly", billing: "Monthly", category: "news", paymentMethod: "Card",
  status: "active", startDate: "2026-01-01T00:00:00+02:00", renewalDate: null,
};

test("actual form preserves null dates, locks repeated presses, recovers rejected submissions, and suppresses stale UI", async () => {
  let calls = 0;
  let closed = 0;
  let payload!: CreateSubscriptionInput;
  let reject!: (reason: unknown) => void;
  const submit = (input: CreateSubscriptionInput): Promise<SubscriptionActionResult> => {
    calls++; payload = input;
    return new Promise((_resolve, no) => { reject = no; });
  };
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(React.createElement(CreateSubscriptionModal, {
      visible: true, initialSubscription: initial, onClose: () => { closed++; }, onSubmit: submit,
    }));
  });
  const save = () => renderer.root.findAllByType("Pressable" as unknown as React.ElementType)
    .find(item => String(item.props.className).startsWith("auth-button"))!;
  await act(async () => { save().props.onPress(); save().props.onPress(); });
  assert.equal(calls, 1);
  assert.equal(save().props.disabled, true);
  assert.equal("startDate" in payload, false);
  assert.equal("renewalDate" in payload, false);
  await act(async () => { reject(new Error("Save failed")); });
  assert.equal(save().props.disabled, false);
  assert.ok(JSON.stringify(renderer.toJSON()).includes("Save failed"));
  await act(async () => { save().props.onPress(); });
  assert.equal(calls, 2);
  await act(async () => { renderer.unmount(); });
  await act(async () => { reject(new Error("Late failure")); });
  assert.equal(closed, 0);
});
