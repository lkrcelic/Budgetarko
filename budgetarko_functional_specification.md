# Budgetarko Functional Specification

## 1. Application Overview

Budgetarko is a personal finance tracking application based on an existing Excel budgeting workbook. The goal of the application is to replace manual Excel entries and formulas with a faster, simpler, and more user-friendly experience.

The application allows users to track income, expenses, card installments, subscriptions, and yearly financial summaries. The main focus is fast mobile input and a clearer, more detailed financial overview on desktop or laptop.

Budgetarko should not simply copy the Excel file. Instead, it should transform the Excel logic into an application with quick data entry, automatic calculations, and clean monthly and yearly reports.

---

## 2. Main Goal

The main goal of the application is to allow the user to quickly enter a financial item and let the application automatically calculate where that item should appear in the monthly and yearly overview.

The most important part of the application is the handling of expenses paid in installments. These expenses must be automatically distributed across the correct months according to predefined rules.

The application must be:

- fast to use
- simple on mobile
- focused on quick entry
- more detailed on desktop/laptop
- reliable in how it distributes installments and recurring payments

---

## 3. Authentication and User Profiles

The application supports Google login only.

Each Google account can have its own financial workspace. The application should also support switching between profiles/accounts in a simple way, similar to switching accounts in Instagram.

Each profile has its own:

- income entries
- expense entries
- installment payments
- subscriptions
- categories
- yearly summaries
- statistics

### Profile Switching

The user must be able to switch between accounts/profiles from the UI without a complicated logout/login flow.

Example behavior:

- the currently active profile is visible in the app
- the user can open a profile/account menu
- the user can switch to another connected profile
- after switching, the app immediately shows the selected profile's data

---

## 4. Home Screen

The home screen should be optimized for fast entry.

The primary action on the home screen is adding a new financial item.

The financial overview should exist, but it should be secondary and minimal on mobile. The mobile experience should not be overloaded with charts, tables, or complex reports.

### Mobile Home Screen Priorities

On mobile, the home screen should prioritize:

- quick expense entry
- quick income entry
- quick installment entry
- quick subscription entry
- current month basic summary
- recent entries

### Desktop/Laptop Priorities

On desktop or laptop, the app can show more details, such as:

- monthly overview
- yearly overview
- category breakdowns
- active installments
- subscription overview
- charts and statistics

---

## 5. Financial Item Entry

The user can add a new financial item through a simple form.

The first question in the form is the entry type.

Available entry types:

- Expense
- Income
- Card installment
- Subscription

The form changes depending on the selected entry type.

---

## 6. Expense Entry

An expense is a standard one-time cost.

### Required Fields

- amount
- category
- description

### Default Fields

- year: current year
- month: current month

### Category Behavior

If the user cannot find the required category, they must be able to add a custom category directly through the UI.

Example:

- entry type: Expense
- amount: 80 €
- category: Groceries
- description: Weekly groceries
- year: current year
- month: current month

The full amount is displayed in the selected month.

---

## 7. Income Entry

Income works similarly to a standard expense, but it is treated as positive cash flow.

### Required Fields

- amount
- category
- description

### Default Fields

- year: current year
- month: current month

Example income categories:

- Salary
- Side job
- Refund
- Gift
- Other income

The full income amount is displayed in the selected month.

---

## 8. Card Installment Entry

A card installment is an expense that is paid across multiple months.

It uses the same basic fields as an expense, with additional installment-specific fields.

### Required Fields

- amount
- category
- description
- number of installments

### Default Fields

- year: current year
- month: current month
- installment start month: current month + 1

### Optional Fields

- custom installment start month

Example:

- entry type: Card installment
- amount: 330 €
- category: Card installment
- description: Vitapur mattress
- number of installments: 6
- month of entry: June 2026
- installment start month: default

Result:

- July 2026: 55 €
- August 2026: 55 €
- September 2026: 55 €
- October 2026: 55 €
- November 2026: 55 €
- December 2026: 55 €

---

## 9. Installment Logic

Installment logic is one of the key business rules of the application.

### Rules

1. If the number of installments is empty or equal to 1, the full amount is assigned to the entry month.
2. If the number of installments is greater than 1 and the installment start month is not manually selected, installments start from the next month after the entry month.
3. If the installment start month is manually selected, installments start from that selected month.
4. The total amount is divided by the number of installments.
5. If installments continue into the next year, the application must automatically display them in the correct months of the next year.
6. Each installment must remain connected to the original financial item.
7. If the original item is edited, the installment schedule must be recalculated.
8. If the original item is deleted, all related installments must also be removed.

### Example

An expense of 330 € entered in June 2026 with 6 installments and no custom start month should be distributed as follows:

- July 2026: 55 €
- August 2026: 55 €
- September 2026: 55 €
- October 2026: 55 €
- November 2026: 55 €
- December 2026: 55 €

---

## 10. Subscription Entry

A subscription is a recurring cost.

It uses the same basic fields as an expense, with additional recurrence fields.

### Required Fields

- amount
- category
- description
- duration
- billing frequency

### Default Fields

- year: current year
- month: current month

### Billing Frequency Options

The application should support different billing frequencies, for example:

- monthly
- yearly
- one-time
- custom frequency

Examples:

- Netflix, monthly
- Spotify, monthly
- yearly software subscription
- yearly insurance
- custom recurring payment

### Subscription Logic

The application must automatically generate subscription costs according to the selected frequency and duration.

Examples:

Monthly subscription:

- amount: 10 €
- start: January 2026
- duration: 12 months
- frequency: monthly
- result: 10 € appears every month from January to December 2026

Yearly subscription:

- amount: 120 €
- start: March 2026
- duration: 1 year
- frequency: yearly
- result: 120 € appears in March 2026

---

## 11. Categories

The application must have a category system.

Each category has:

- name
- type: income or expense
- status: active or inactive
- ownership: default category or custom user category

### Income Category Examples

- Salary
- Side job
- Refund
- Gift
- Other income

### Expense Category Examples

- Living expenses
- Housing
- Loan
- Credit card installment
- Car
- Travel
- Gifts
- Groceries
- Subscriptions
- Health
- Entertainment

### Custom Categories

The user must be able to create a custom category directly while entering a financial item.

For example, if the user is adding an expense and cannot find the right category, they can create a new category without leaving the form.

---

## 12. Monthly Overview

For each month, the application displays a summary of the user's finances.

The monthly overview includes:

- total income
- total expenses
- difference between income and expenses
- expenses by category
- active installments included in that month
- active subscriptions included in that month
- list of individual entries

The monthly overview should quickly show whether the month is positive or negative.

On mobile, this overview should be simple and minimal.

---

## 13. Yearly Overview

For each profile and year, the application displays a table-based yearly overview.

The yearly overview includes:

- income by month
- expenses by month
- monthly surplus or deficit
- total yearly income
- total yearly expenses
- total yearly result
- cumulative result throughout the year

This screen replaces the yearly sheets from the original Excel workbook.

The yearly overview is especially important for desktop/laptop usage.

---

## 14. Editing and Deleting Entries

Every financial item must be editable and deletable.

The user must be able to edit:

- amount
- category
- description
- year
- month
- number of installments
- installment start month
- subscription duration
- subscription frequency

### Editing Installments

If an installment entry is edited, the application must recalculate the installment schedule.

Example:

If the user changes:

- amount from 330 € to 360 €
- number of installments from 6 to 3

The application must remove the old generated installment schedule and create a new one.

### Deleting Installments

If the original installment entry is deleted, all generated monthly installment records must also be deleted.

---

## 15. Export

The application should support exporting data to Excel format.

The export should include:

- yearly overview by month
- list of all financial entries
- installment schedule
- subscription schedule
- category summary

The goal of export is to allow the user to keep a familiar Excel-style overview similar to the original workbook.

---

## 16. MVP Scope

The first version of the application should focus only on the core functionality.

### MVP Includes

- Google login
- profile/account switching
- adding expenses
- adding income
- adding card installments
- adding subscriptions
- custom categories
- automatic installment distribution
- automatic transfer of installments into the next year
- monthly overview
- yearly overview
- editing entries
- deleting entries
- Excel export

### Later Features

The following features can be added after the MVP:

- planned budgets by category
- warnings when a category budget is exceeded
- charts
- advanced statistics
- shared budgets between multiple users
- notifications
- receipt upload
- automatic bank import
- PWA/mobile app improvements
- desktop-optimized reporting view

---

## 17. Design and UX Requirements

The application must be fast and simple to use on mobile.

Mobile usage is mainly for quick data entry.

Laptop/desktop usage is mainly for reviewing finances, analyzing spending, and working with yearly reports.

### Mobile UX Principles

- minimal number of taps
- large buttons
- simple forms
- no complex tables on small screens
- quick category selection
- easy custom category creation
- clear primary action for adding a new item

### Desktop UX Principles

- more detailed overviews
- yearly table
- filters
- category summaries
- charts
- export options

---

## 18. Open Questions

The following questions should be clarified before creating the detailed technical specification:

1. Should account switching mean switching between different Google accounts, or switching between profiles inside one Google account?
2. Should one user be able to manage multiple profiles, for example Lovro and Patricija, under the same Google login?
3. Should Lovro and Patricija have a shared view, or only separate personal views?
4. Should shared expenses be supported?
5. Should subscriptions have an end date, or can they continue indefinitely until manually stopped?
6. Should installment amounts be rounded automatically if the total amount cannot be divided equally?
7. Should the app support only EUR, or should currency be configurable?
8. Should deleted entries be permanently deleted, or moved to an archive/trash?
9. Should users be able to attach receipts or photos to expenses in the future?
10. Should the Excel export exactly match the current workbook layout, or only contain the same information in a cleaner format?
