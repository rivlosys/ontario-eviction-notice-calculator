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
export declare const ONTARIO_N4_SEVEN_DAY_ALL_TENANCIES_EFFECTIVE_DATE = "2026-09-21";
export declare const ONTARIO_N12_COMPENSATION_CHANGE_DATE = "2026-09-21";
export declare const ONTARIO_N12_CURRENT_NOTICE_DAYS = 60;
export declare const ONTARIO_N12_NO_COMPENSATION_NOTICE_DAYS = 120;
export declare const ONTARIO_N12_L2_DEADLINE_DAYS = 30;
export declare const ONTARIO_N12_TENANT_EARLY_NOTICE_DAYS = 10;
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
export declare function addCalendarDays(value: string, days: number): string;
export declare function findMonthlyPeriodEndOnOrAfter(targetDate: string, startDay?: number): string;
export declare function findWeeklyPeriodEndOnOrAfter(targetDate: string, endDay?: number): string;
/**
 * Calculates complete Form N4 Non-Payment of Rent deadlines and deemed service dates
 */
export declare function calculateOntarioN4(input: OntarioN4Input): OntarioN4Result;
/**
 * Aligns N12 earliest date to the statutory end of the rental period
 */
export declare function alignOntarioN12TerminationDate({ earliestDate, tenancyPeriod, monthlyPeriodStartDay, weeklyPeriodEndDay, fixedTermEndDate, }: {
    earliestDate: string;
    tenancyPeriod: OntarioN12TenancyPeriod;
    monthlyPeriodStartDay?: number;
    weeklyPeriodEndDay?: number;
    fixedTermEndDate?: string;
}): string;
/**
 * Calculates Form N12 Landlord/Purchaser Personal Use termination dates, compensation, and L2 filing limits
 */
export declare function calculateOntarioN12(input: OntarioN12Input): OntarioN12Schedule;
