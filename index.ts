/**
 * Ontario Residential Tenancies Act (RTA) Notice & Eviction Timing Engine
 *
 * Implements statutory calculation rules for Ontario Landlord and Tenant Board (LTB):
 * 1. Form N4 (Non-Payment of Rent):
 *    - Notice timing under RTA s. 59 (pre and post Sept 21, 2026 amendments)
 *    - Service method deemed receipt rules (LTB Rule 3 - mail adds 5 calendar days)
 * 2. Form N12 (Landlord / Purchaser Personal Use):
 *    - Notice timing under RTA s. 48 & 49 (60-day standard vs 120-day no-compensation path)
 *    - Rental period end-of-term alignment (monthly base day, weekly, fixed-term)
 *    - Mandatory L2 application deadline (RTA s. 69 - 30 days after termination date)
 *    - 1 month mandatory compensation calculation and due dates
 *
 * Attribution: UseCOS Engineering <team@usecos.app> (https://usecos.app)
 * Source of Truth: https://usecos.app/landlord/ontario/n4-timing and https://usecos.app/landlord/ontario/n12-rules
 */

export const ONTARIO_N4_SEVEN_DAY_ALL_TENANCIES_EFFECTIVE_DATE = "2026-09-21";
export const ONTARIO_N12_COMPENSATION_CHANGE_DATE = "2026-09-21";
export const ONTARIO_N12_CURRENT_NOTICE_DAYS = 60;
export const ONTARIO_N12_NO_COMPENSATION_NOTICE_DAYS = 120;
export const ONTARIO_N12_L2_DEADLINE_DAYS = 30;
export const ONTARIO_N12_TENANT_EARLY_NOTICE_DAYS = 10;

export type OntarioN4TenancyType = "standard" | "weekly";
export type OntarioN4ServiceMethod = "same-day" | "regular-mail" | "manual";

export type OntarioN12Reason = "landlord-own-use" | "purchaser-own-use";
export type OntarioN12TenancyPeriod = "monthly" | "weekly" | "fixed-term";

export interface OntarioN4Input {
  sentDate: string;
  serviceMethod: OntarioN4ServiceMethod;
  tenancyType: OntarioN4TenancyType;
  manualReceivedDate?: string;
}

export interface OntarioN4Result {
  sentDate: string;
  deemedReceivedDate: string;
  noticeDaysRequired: number;
  earliestTerminationDate: string;
  earliestL1FilingDate: string;
  ruleExplanation: string;
}

export interface OntarioN12Input {
  noticeGivenDate: string;
  monthlyRent: number;
  reason: OntarioN12Reason;
  tenancyPeriod: OntarioN12TenancyPeriod;
  monthlyPeriodStartDay?: number;
  weeklyPeriodEndDay?: number;
  fixedTermEndDate?: string;
}

export interface OntarioN12PathResult {
  id: "standard-60-day" | "extended-120-day";
  label: string;
  noticeGivenDate: string;
  minimumNoticeDays: number;
  earliestDateBeforePeriodAlignment: string;
  terminationDate: string;
  l2LatestFilingDate: string;
  compensationRequired: boolean;
  compensationAmount: number;
  compensationDueDate: string;
  available: boolean;
  status: "current-rule" | "future-rule" | "not-available";
  notes: string[];
}

export interface OntarioN12Schedule {
  standard60Day: OntarioN12PathResult;
  extended120Day: OntarioN12PathResult;
}

// Helper utilities
export function addCalendarDays(value: string, days: number): string {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
}

function monthStartDate(year: number, monthIndex: number, startDay: number): Date {
  const day = Math.min(Math.max(1, Math.round(startDay || 1)), daysInMonth(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

function addMonthsToStart(date: Date, months: number, startDay: number): Date {
  return monthStartDate(date.getUTCFullYear(), date.getUTCMonth() + months, startDay);
}

export function findMonthlyPeriodEndOnOrAfter(targetDate: string, startDay = 1): string {
  const target = new Date(`${targetDate}T12:00:00Z`);
  if (isNaN(target.getTime())) return "";

  const base = monthStartDate(
    target.getUTCFullYear(),
    target.getUTCMonth() - 1,
    startDay,
  );

  for (let offset = 0; offset < 36; offset += 1) {
    const nextStart = addMonthsToStart(base, offset + 1, startDay);
    const end = new Date(nextStart);
    end.setUTCDate(end.getUTCDate() - 1);
    if (end >= target) return end.toISOString().slice(0, 10);
  }

  return "";
}

export function findWeeklyPeriodEndOnOrAfter(targetDate: string, endDay = 6): string {
  const target = new Date(`${targetDate}T12:00:00Z`);
  if (isNaN(target.getTime())) return "";
  const normalizedEndDay = Math.min(6, Math.max(0, Math.round(endDay)));
  const currentDay = target.getUTCDay();
  const daysToAdd = (normalizedEndDay - currentDay + 7) % 7;
  return addCalendarDays(targetDate, daysToAdd);
}

function laterDate(...values: string[]): string {
  return values.filter(Boolean).sort().at(-1) || "";
}

/**
 * Calculates complete Form N4 Non-Payment of Rent deadlines and deemed service dates
 */
export function calculateOntarioN4(input: OntarioN4Input): OntarioN4Result {
  let deemedReceivedDate = input.sentDate;
  if (input.serviceMethod === "regular-mail") {
    deemedReceivedDate = addCalendarDays(input.sentDate, 5);
  } else if (input.serviceMethod === "manual" && input.manualReceivedDate) {
    deemedReceivedDate = input.manualReceivedDate;
  }

  let noticeDays = 14;
  let ruleExplanation = "";

  if (deemedReceivedDate >= ONTARIO_N4_SEVEN_DAY_ALL_TENANCIES_EFFECTIVE_DATE) {
    noticeDays = 7;
    ruleExplanation = "Service date is on or after September 21, 2026: 7-day statutory notice period applies to all tenancies.";
  } else if (input.tenancyType === "weekly") {
    noticeDays = 7;
    ruleExplanation = "Service date is before September 21, 2026: weekly/daily tenancy requires 7 days notice.";
  } else {
    noticeDays = 14;
    ruleExplanation = "Service date is before September 21, 2026: standard monthly tenancy requires 14 days notice.";
  }

  const earliestTerminationDate = addCalendarDays(deemedReceivedDate, noticeDays);
  // L1 application can be filed the day AFTER the termination date expires without payment
  const earliestL1FilingDate = addCalendarDays(earliestTerminationDate, 1);

  return {
    sentDate: input.sentDate,
    deemedReceivedDate,
    noticeDaysRequired: noticeDays,
    earliestTerminationDate,
    earliestL1FilingDate,
    ruleExplanation,
  };
}

/**
 * Aligns N12 earliest date to the statutory end of the rental period
 */
export function alignOntarioN12TerminationDate({
  earliestDate,
  tenancyPeriod,
  monthlyPeriodStartDay = 1,
  weeklyPeriodEndDay = 6,
  fixedTermEndDate,
}: {
  earliestDate: string;
  tenancyPeriod: OntarioN12TenancyPeriod;
  monthlyPeriodStartDay?: number;
  weeklyPeriodEndDay?: number;
  fixedTermEndDate?: string;
}): string {
  if (!earliestDate) return "";

  if (tenancyPeriod === "weekly") {
    return findWeeklyPeriodEndOnOrAfter(earliestDate, weeklyPeriodEndDay);
  }

  if (tenancyPeriod === "fixed-term") {
    return laterDate(earliestDate, fixedTermEndDate || "");
  }

  const monthlyEnd = findMonthlyPeriodEndOnOrAfter(earliestDate, monthlyPeriodStartDay);
  return laterDate(monthlyEnd, fixedTermEndDate || "");
}

/**
 * Calculates Form N12 Landlord/Purchaser Personal Use termination dates, compensation, and L2 filing limits
 */
export function calculateOntarioN12(input: OntarioN12Input): OntarioN12Schedule {
  const { noticeGivenDate, monthlyRent, tenancyPeriod, monthlyPeriodStartDay, weeklyPeriodEndDay, fixedTermEndDate } = input;

  // Path 1: Standard 60-day notice with 1 month compensation
  const earliest60 = addCalendarDays(noticeGivenDate, ONTARIO_N12_CURRENT_NOTICE_DAYS);
  const termination60 = alignOntarioN12TerminationDate({
    earliestDate: earliest60,
    tenancyPeriod,
    monthlyPeriodStartDay,
    weeklyPeriodEndDay,
    fixedTermEndDate,
  });
  const l2Deadline60 = addCalendarDays(termination60, ONTARIO_N12_L2_DEADLINE_DAYS);

  const standard60Day: OntarioN12PathResult = {
    id: "standard-60-day",
    label: "Standard 60-Day Notice (with 1-Month Compensation)",
    noticeGivenDate,
    minimumNoticeDays: ONTARIO_N12_CURRENT_NOTICE_DAYS,
    earliestDateBeforePeriodAlignment: earliest60,
    terminationDate: termination60,
    l2LatestFilingDate: l2Deadline60,
    compensationRequired: true,
    compensationAmount: monthlyRent,
    compensationDueDate: termination60, // Due on or before the termination date specified in the notice
    available: true,
    status: "current-rule",
    notes: [
      "Requires minimum 60 days notice ending on the last day of the rental period.",
      `Landlord must pay 1 month compensation ($${monthlyRent.toLocaleString()}) on or before ${termination60}. Failure to pay before the termination date voids the notice under RTA s. 48.1.`,
      `Application to the LTB (Form L2) must be filed no later than ${l2Deadline60} (30 days after the termination date).`,
    ],
  };

  // Path 2: 120-day notice path (Bill 97 amendment framework)
  const isPostSept2026 = noticeGivenDate >= ONTARIO_N12_COMPENSATION_CHANGE_DATE;
  const earliest120 = addCalendarDays(noticeGivenDate, ONTARIO_N12_NO_COMPENSATION_NOTICE_DAYS);
  const termination120 = alignOntarioN12TerminationDate({
    earliestDate: earliest120,
    tenancyPeriod,
    monthlyPeriodStartDay,
    weeklyPeriodEndDay,
    fixedTermEndDate,
  });
  const l2Deadline120 = addCalendarDays(termination120, ONTARIO_N12_L2_DEADLINE_DAYS);

  const extended120Day: OntarioN12PathResult = {
    id: "extended-120-day",
    label: "Extended 120-Day Notice",
    noticeGivenDate,
    minimumNoticeDays: ONTARIO_N12_NO_COMPENSATION_NOTICE_DAYS,
    earliestDateBeforePeriodAlignment: earliest120,
    terminationDate: termination120,
    l2LatestFilingDate: l2Deadline120,
    compensationRequired: false,
    compensationAmount: 0,
    compensationDueDate: "",
    available: isPostSept2026,
    status: isPostSept2026 ? "future-rule" : "not-available",
    notes: isPostSept2026
      ? [
          "Extended 120-day notice route under amended RTA provisions.",
          `Termination date must be on or after ${termination120} aligned to rental period end.`,
          `L2 filing must occur before ${l2Deadline120}.`,
        ]
      : [
          "The 120-day alternate notice option is not valid for notices served before September 21, 2026.",
          "Notices served prior to this date must use the standard 60-day path with 1 month compensation.",
        ],
  };

  return { standard60Day, extended120Day };
}
