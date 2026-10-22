import assert from "node:assert/strict";
import test from "node:test";
import { ACCOUNT_DELETION_DISABLED_MESSAGE } from "./account-deletion.ts";

test("account deletion remains disabled with the explicit development notice", () => {
  assert.equal(
    ACCOUNT_DELETION_DISABLED_MESSAGE,
    "Account deletion is unavailable in this development build while the new backend is being prepared.",
  );
});
