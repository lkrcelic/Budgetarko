import { useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { seedDefaultCategories } from '@/services/categories'
import { createProfile } from '@/services/profiles'
import { upsertUserLookup } from '@/services/sharing'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

/**
 * Subscribe to Supabase auth state.
 *
 * On first sign-in (no profiles yet), automatically:
 *  1. seeds default categories
 *  2. creates a profile from the Google display name
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    // Listen for changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState({ user: session?.user ?? null, session, loading: false })

        // On every login: keep the email lookup table up to date
        if (event === 'SIGNED_IN' && session?.user) {
          const email = session.user.email
          if (email) {
            await upsertUserLookup(session.user.id, email).catch(() => {})
          }
          await bootstrapNewUser(session.user)
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return { ...state, signInWithGoogle, signOut }
}

// ── Bootstrap on first login ───────────────────────────────────

async function bootstrapNewUser(user: User): Promise<void> {
  // Check if this user already has profiles (= not a first login)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (existing && existing.length > 0) return

  // Seed default categories
  await seedDefaultCategories(user.id)

  // Create a profile from the Google name
  const fullName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Me'
  const firstName = fullName.split(' ')[0]
  const initials = firstName.charAt(0).toUpperCase()

  await createProfile({
    name: firstName,
    initials,
    tint: '#1f8a5b',
  })
}
