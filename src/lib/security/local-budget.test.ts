import { expect, it } from "vitest";
import { consumeLocalBudget } from "./local-budget";

it("limits local computation atomically and releases expired windows", () => {
  const first = { scope: "test:caller-a", limit: 1, seconds: 60 };
  const second = { scope: "test:caller-b", limit: 1, seconds: 60 };
  const shared = { scope: "test:instance", limit: 2, seconds: 60 };
  expect(consumeLocalBudget([shared, first], 1)).toBe(true);
  expect(consumeLocalBudget([shared, first], 2)).toBe(false);
  expect(consumeLocalBudget([shared, second], 3)).toBe(true);
  expect(consumeLocalBudget([shared], 4)).toBe(false);
  expect(consumeLocalBudget([shared, first], 60_001)).toBe(true);
  expect(consumeLocalBudget([{ ...first, limit: 0 }], 60_002)).toBe(false);
});
