import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, periodLabel } from "@/lib/plans";

test("plan prices are shown in rupees from Razorpay's paise amount", () => {
  assert.equal(formatPrice({ tier: "starter", name: "Starter", description: null, amountPaise: 149900, currency: "INR", period: "monthly" }), "₹1,499");
  assert.equal(formatPrice({ tier: "growth", name: "Growth", description: null, amountPaise: null, currency: "INR", period: null }), "See price at checkout");
  assert.equal(periodLabel("monthly"), "/ month");
  assert.equal(periodLabel(null), "");
});
