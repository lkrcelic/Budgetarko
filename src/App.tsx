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
import CategoriesPage    from '@/pages/categories/categories-page'

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
  const { data: profiles, isLoading } = useProfiles()
  const currentProfileId = useAppStore(s => s.currentProfileId)
  const setProfileId     = useAppStore(s => s.setProfileId)

  useEffect(() => {
    if (!profiles || profiles.length === 0) return
    if (!profiles.some(p => p.id === currentProfileId)) {
      setProfileId(profiles[0].id)
    }
  }, [profiles, currentProfileId, setProfileId])

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
        installments={<InstallmentsPage />}
        categories={<CategoriesPage />}
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
