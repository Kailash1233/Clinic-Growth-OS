import { test } from "node:test";
import assert from "node:assert/strict";
import { describeRazorpayError } from "@/lib/razorpay";

test("Razorpay API errors surface Razorpay's own description", () => {
  assert.equal(describeRazorpayError({ statusCode: 400, error: { code: "BAD_REQUEST_ERROR", description: "The id provided does not exist" } }), "The id provided does not exist");
  assert.equal(describeRazorpayError(new Error("RAZORPAY_PLAN_GROWTH is not set")), "RAZORPAY_PLAN_GROWTH is not set");
  assert.equal(describeRazorpayError({ statusCode: 401 }), "Razorpay returned 401");
});
