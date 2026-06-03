import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useProfiles } from '@/hooks/use-profiles'
import { useAppStore } from '@/stores/app-store'
import { useIsDesktop } from '@/hooks/use-media'
import { ToastHost } from '@/components/shared/toast'
import { DesktopShell } from '@/components/layout/desktop-shell'
import { MobileShell } from '@/components/layout/mobile-shell'
import LoginPage from '@/pages/auth/login'

// ── Page imports ───────────────────────────────────────────────
import HomePage          from '@/pages/home/home-page'
import MonthlyPage       from '@/pages/monthly/monthly-page'
import AnnualPage        from '@/pages/annual/annual-page'
import InstallmentsPage  from '@/pages/installments/installments-page'
import CategoriesPage      from '@/pages/categories/categories-page'
import ExpensesPage        from '@/pages/expenses/expenses-page'
import IncomePage          from '@/pages/income/income-page'
import SubscriptionsPage    from '@/pages/subscriptions/subscriptions-page'
import ScheduledIncomePage from '@/pages/scheduled-income/scheduled-income-page'
import SettingsPage         from '@/pages/settings/settings-page'

// ── Loading / setup screens ────────────────────────────────────

function LoadingScreen({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bcanvas">
      <span className="text-[14px] font-medium text-bmuted">{text}</span>
    </div>
  )
}

function SetupScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bcanvas px-4 text-center">
      <div>
        <h1 className="text-xl font-bold text-bink">Setting up your account…</h1>
        <p className="mt-2 text-sm text-bink-2">
          This should only take a moment. Refresh if it takes too long.
        </p>
      </div>
    </div>
  )
}

// ── Guards ─────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user }                 = useAuth()
  const { data: profiles, isLoading } = useProfiles()
  const currentProfileId = useAppStore(s => s.currentProfileId)
  const activeOwnerId    = useAppStore(s => s.activeOwnerId)
  const switchProfile    = useAppStore(s => s.switchProfile)

  useEffect(() => {
    if (!profiles || profiles.length === 0 || !user) return

    const currentProfile = profiles.find(p => p.id === currentProfileId)

    if (!currentProfile) {
      // Pick the first profile that belongs to this user (own account first)
      const ownProfile = profiles.find(p => p.user_id === user.id) ?? profiles[0]
      switchProfile(ownProfile.id, ownProfile.user_id)
    } else if (currentProfile.user_id !== activeOwnerId) {
      // Sync activeOwnerId in case it was cleared (e.g. after store reset)
      switchProfile(currentProfile.id, currentProfile.user_id)
    }
  }, [profiles, currentProfileId, activeOwnerId, user, switchProfile])

  if (isLoading) return <LoadingScreen text="Loading profiles…" />
  if (!profiles || profiles.length === 0) return <SetupScreen />
  return <>{children}</>
}

// ── Layout switch ──────────────────────────────────────────────

function AppLayout() {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <DesktopShell
        monthly={<MonthlyPage />}
        annual={<AnnualPage />}
        expenses={<ExpensesPage />}
        income={<IncomePage />}
        installments={<InstallmentsPage />}
        subscriptions={<SubscriptionsPage />}
        scheduledIncome={<ScheduledIncomePage />}
        categories={<CategoriesPage />}
        settings={<SettingsPage />}
      />
    )
  }

  return (
    <MobileShell>
      <HomePage />
    </MobileShell>
  )
}

// ── Root ───────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <ProfileGate>
                <AppLayout />
              </ProfileGate>
            </AuthGuard>
          }
        />
      </Routes>

      {/* Outside Routes so it persists across navigation */}
      <ToastHost />
    </BrowserRouter>
  )
}
