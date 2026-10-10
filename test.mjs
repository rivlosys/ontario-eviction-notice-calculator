import assert from "node:assert/strict";
import {
  calculateOntarioN4,
  calculateOntarioN12,
  addCalendarDays,
  findMonthlyPeriodEndOnOrAfter,
  findWeeklyPeriodEndOnOrAfter,
} from "./index.ts";

console.log("Running Ontario RTA Eviction Timing Engine Test Suite...");

// Test 1: N4 Deemed Receipt (LTB Rule 3: Mail adds 5 calendar days)
const n4Mail = calculateOntarioN4({
  sentDate: "2026-08-01",
  serviceMethod: "regular-mail",
  tenancyType: "standard",
});
assert.equal(n4Mail.deemedReceivedDate, "2026-08-06", "Regular mail must add 5 days deemed receipt");
assert.equal(n4Mail.noticeDaysRequired, 14, "Standard monthly tenancy pre-Sept 21 2026 requires 14 days");
assert.equal(n4Mail.earliestTerminationDate, "2026-08-20", "14 days added to Aug 6 is Aug 20");
assert.equal(n4Mail.earliestL1FilingDate, "2026-08-21", "L1 filing earliest date is the day following termination");

// Test 2: N4 Service Post-September 21, 2026 (7-day rule for all tenancies)
const n4PostSept = calculateOntarioN4({
  sentDate: "2026-09-25",
  serviceMethod: "same-day",
  tenancyType: "standard",
});
assert.equal(n4PostSept.deemedReceivedDate, "2026-09-25");
assert.equal(n4PostSept.noticeDaysRequired, 7, "Post Sept 21 2026 amendment enforces 7 days for all tenancies");
assert.equal(n4PostSept.earliestTerminationDate, "2026-10-02");
assert.equal(n4PostSept.earliestL1FilingDate, "2026-10-03");

// Test 3: N12 Rental Period End Alignment (Monthly rent due on 1st, ends on last day of month)
const n12MonthEnd = findMonthlyPeriodEndOnOrAfter("2026-06-15", 1);
assert.equal(n12MonthEnd, "2026-06-30", "June 15 earliest date must align to June 30");

const n12Schedule = calculateOntarioN12({
  noticeGivenDate: "2026-04-10",
  monthlyRent: 2400,
  reason: "landlord-own-use",
  tenancyPeriod: "monthly",
  monthlyPeriodStartDay: 1,
});

assert.equal(n12Schedule.standard60Day.minimumNoticeDays, 60);
assert.equal(n12Schedule.standard60Day.earliestDateBeforePeriodAlignment, "2026-06-09");
assert.equal(n12Schedule.standard60Day.terminationDate, "2026-06-30", "Aligned to last day of monthly period");
assert.equal(n12Schedule.standard60Day.compensationAmount, 2400);
assert.equal(n12Schedule.standard60Day.compensationDueDate, "2026-06-30");
assert.equal(n12Schedule.standard60Day.l2LatestFilingDate, "2026-07-30", "L2 deadline is 30 days after termination date");

// Test 4: Fixed-term tenancy (Termination date cannot precede fixed-term end date)
const n12FixedTerm = calculateOntarioN12({
  noticeGivenDate: "2026-04-10",
  monthlyRent: 2200,
  reason: "purchaser-own-use",
  tenancyPeriod: "fixed-term",
  fixedTermEndDate: "2026-08-31",
});
assert.equal(n12FixedTerm.standard60Day.terminationDate, "2026-08-31", "Termination date cannot be before fixed term end date");
assert.equal(n12FixedTerm.standard60Day.l2LatestFilingDate, "2026-09-30");

console.log("All Ontario RTA Notice & Eviction Timing tests PASSED! 100% verified.");
