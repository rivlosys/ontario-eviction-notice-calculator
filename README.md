# Ontario Eviction Notice Timing & LTB Statutory Engine 🏛️🇨🇦

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg)](https://www.typescriptlang.org/)
[![Live Interactive Tool](https://img.shields.io/badge/Live%20Tool-usecos.app%2Flandlord-brightgreen.svg)](https://usecos.app/landlord/ontario/n4-timing)

> **Zero-dependency, production-tested calculation engine for Ontario Residential Tenancies Act (RTA) notice requirements, deemed service rules (LTB Rule 3), rental period alignment, compensation deadlines, and LTB statutory filing cutoffs.**

---

## 📌 Why This Exists

More than **35% of eviction applications filed with the Ontario Landlord and Tenant Board (LTB) are dismissed outright without a hearing on the merits** due to technical timing defects in the underlying notice:

1. **Failure to account for Deemed Service**: Under LTB Rule of Practice 3, service by regular mail adds **5 calendar days** before notice is legally deemed received. Calculating notice from the mail date renders the notice void ab initio.
2. **Failure to align with the Rental Period End**: Under RTA s. 48 & 49 (Form N12), the termination date must not only satisfy the minimum notice period (60 days) but must fall on the **exact last day of a rental period** (e.g. the 30th/31st of the month if rent is paid on the 1st).
3. **Statutory Compensation Traps**: Under RTA s. 48.1, the 1-month statutory compensation for Form N12 must be paid to the tenant **on or before the termination date specified in the notice**. If paid one day late, the notice is legally invalid.
4. **The 30-Day L2 Application Cliff**: Under RTA s. 69, an application to the LTB (Form L2) must be filed no later than **30 days after the termination date**. Missing this deadline permanently voids the notice.

This engine provides formal, statutory date arithmetic according to current Ontario legislation.

---

## 🚀 Installation

```bash
npm install ontario-eviction-notice-calculator
```

---

## 💻 Quickstart

### 1. Form N4: Non-Payment of Rent (Service & Filing Deadlines)

```typescript
import { calculateOntarioN4 } from "ontario-eviction-notice-calculator";

const n4 = calculateOntarioN4({
  sentDate: "2026-08-01",
  serviceMethod: "regular-mail", // adds 5 days deemed receipt under LTB Rule 3
  tenancyType: "standard",
});

console.log(n4);
// {
//   sentDate: '2026-08-01',
//   deemedReceivedDate: '2026-08-06',
//   noticeDaysRequired: 14,
//   earliestTerminationDate: '2026-08-20',
//   earliestL1FilingDate: '2026-08-21',
//   ruleExplanation: 'Service date is before September 21, 2026: standard monthly tenancy requires 14 days notice.'
// }
```

### 2. Form N12: Landlord / Purchaser Personal Use

```typescript
import { calculateOntarioN12 } from "ontario-eviction-notice-calculator";

const schedule = calculateOntarioN12({
  noticeGivenDate: "2026-04-10",
  monthlyRent: 2400,
  reason: "landlord-own-use",
  tenancyPeriod: "monthly",
  monthlyPeriodStartDay: 1, // rent due on the 1st of each month
});

console.log(schedule.standard60Day);
// {
//   id: 'standard-60-day',
//   minimumNoticeDays: 60,
//   earliestDateBeforePeriodAlignment: '2026-06-09',
//   terminationDate: '2026-06-30', // Automatically aligned to month end!
//   l2LatestFilingDate: '2026-07-30', // 30-day LTB deadline
//   compensationAmount: 2400,
//   compensationDueDate: '2026-06-30'
// }
```

---

## 📚 Interactive Decision Calculators

For full interactive landlord decision workflows, decision checklists, and procedural forms:
* **[Ontario N4 Notice Timing Calculator](https://usecos.app/landlord/ontario/n4-timing)**
* **[Ontario N12 Notice Rules & Calculator](https://usecos.app/landlord/ontario/n12-rules)**
* **[Ontario Landlord Hub](https://usecos.app/landlord/ontario)**

---

## 📄 License & Attribution

Distributed under the **MIT License**. Maintained by **UseCOS Engineering** (`team@usecos.app`).
