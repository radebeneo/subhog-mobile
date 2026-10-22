import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import Settings from "../../../app/(app)/(tabs)/settings.tsx";
import { ACCOUNT_DELETION_DISABLED_MESSAGE } from "./account-deletion.ts";
import { auth, alerts } from "../../../test-support/native-mocks.mjs";

test("actual Settings deletion is disabled while sign-out remains functional", async () => {
  let signOutCalls = 0;
  auth.signOut = async () => { signOutCalls++; };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(React.createElement(Settings)); });
  const deletion = renderer.root.findByProps({ accessibilityLabel: "Delete account unavailable" });
  assert.equal(deletion.props.disabled, true);
  assert.ok(JSON.stringify(renderer.toJSON()).includes(ACCOUNT_DELETION_DISABLED_MESSAGE));
  // Even a direct handler invocation cannot delete an account.
  deletion.props.onPress();
  assert.equal(alerts.at(-1)[1], ACCOUNT_DELETION_DISABLED_MESSAGE);
  await act(async () => { await renderer.root.findByProps({ accessibilityLabel: "Log out" }).props.onPress(); });
  assert.equal(signOutCalls, 1);
  await act(async () => { renderer.unmount(); });
});
