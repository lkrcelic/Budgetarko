import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './sidebar'

interface DesktopShellProps {
  /** Page components for each route — injected by App so the shell stays decoupled */
  monthly: ReactNode
  annual: ReactNode
  expenses: ReactNode
  income: ReactNode
  installments: ReactNode
  subscriptions: ReactNode
  scheduledIncome: ReactNode
  categories: ReactNode
  settings: ReactNode
}

/**
 * Desktop layout: fixed sidebar on the left, scrollable main on the right.
 * Matches .d-root from prototype.
 */
export function DesktopShell({ monthly, annual, expenses, income, installments, subscriptions, scheduledIncome, categories, settings }: DesktopShellProps) {
  return (
    <div className="flex min-h-dvh bg-bbg text-[14px]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/annual" replace />} />
          <Route path="/monthly"       element={monthly}       />
          <Route path="/annual"        element={annual}        />
          <Route path="/expenses"     element={expenses}      />
          <Route path="/income"       element={income}        />
          <Route path="/installments"  element={installments}  />
          <Route path="/subscriptions"    element={subscriptions}    />
          <Route path="/scheduled-income" element={scheduledIncome}  />
          <Route path="/categories"       element={categories}       />
          <Route path="/settings"      element={settings}      />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/annual" replace />} />
        </Routes>
      </main>
    </div>
  )
}
