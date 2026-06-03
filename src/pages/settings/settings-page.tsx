import { useState } from 'react'
import { Settings, Share2, Users, Trash2, Mail, CheckCircle2, XCircle } from 'lucide-react'
import {
  useMyShares,
  useSharedWithMe,
  useShareWithUser,
  useRevokeShare,
} from '@/hooks/use-sharing'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/shared/toast'

export default function SettingsPage() {
  const { user, signOut }   = useAuth()
  const { data: myShares = [] }      = useMyShares()
  const { data: sharedWithMe = [] }  = useSharedWithMe()

  const shareWith = useShareWithUser()
  const revoke    = useRevokeShare()

  const [email, setEmail] = useState('')
  const [shareError, setShareError] = useState<string | null>(null)

  async function handleShare() {
    const target = email.trim().toLowerCase()
    if (!target) return
    if (target === user?.email?.toLowerCase()) {
      setShareError("You can't share with yourself.")
      return
    }
    setShareError(null)

    try {
      await shareWith.mutateAsync(target)
      toast('Access granted — they can now view your account.')
      setEmail('')
    } catch (err: any) {
      setShareError(err?.message ?? 'Something went wrong.')
    }
  }

  async function handleRevoke(shareId: string, recipientEmail: string) {
    await revoke.mutateAsync(shareId)
    toast(`Access removed for ${recipientEmail}.`)
  }

  return (
    <div className="min-h-full p-7">

      {/* ── Page header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.07em] text-bmuted">
          <Settings size={13} />
          Settings
        </div>
        <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight text-bink">
          Account settings
        </h1>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-6">

        {/* ── Account info ── */}
        <section className="rounded-[20px] border border-bline bg-bsurface p-5">
          <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.06em] text-bmuted">
            Signed in as
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bgreen text-[16px] font-bold text-white">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="text-[15px] font-semibold text-bink">{user?.email}</div>
              <div className="text-[12px] text-bmuted">Google account</div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="ml-auto rounded-[10px] border border-bline px-3 py-1.5 text-[12.5px] font-semibold text-bink-2 transition-colors hover:bg-bred-soft hover:text-bred"
            >
              Sign out
            </button>
          </div>
        </section>

        {/* ── Share your account ── */}
        <section className="rounded-[20px] border border-bline bg-bsurface p-5">
          <div className="mb-1 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-bmuted">
            <Share2 size={12} />
            Share your account
          </div>
          <p className="mb-4 text-[13px] text-bink-2">
            Give someone full access to view and edit your budget data.
            They must already have a Budgetarko account.
          </p>

          {/* Email input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bmuted" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setShareError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleShare() } }}
                placeholder="friend@example.com"
                className="h-[42px] w-full rounded-[12px] border border-bline bg-bsurface-2 pl-9 pr-3 text-[14px] text-bink outline-none transition-colors focus:border-bink"
              />
            </div>
            <button
              type="button"
              onClick={handleShare}
              disabled={!email.trim() || shareWith.isPending}
              className="h-[42px] rounded-[12px] bg-bink px-4 text-[13.5px] font-semibold text-white transition-opacity disabled:opacity-40"
            >
              {shareWith.isPending ? 'Sharing…' : 'Share access'}
            </button>
          </div>

          {/* Inline error */}
          {shareError && (
            <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-bred">
              <XCircle size={13} />
              {shareError}
            </div>
          )}

          {/* List of people I've shared with */}
          {myShares.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[12px] font-bold text-bmuted">Shared with</div>
              <div className="flex flex-col gap-[6px]">
                {myShares.map(share => (
                  <div
                    key={share.id}
                    className="flex items-center gap-3 rounded-[12px] border border-bline bg-bsurface-2 px-3 py-2.5"
                  >
                    <CheckCircle2 size={15} className="shrink-0 text-bgreen" />
                    <span className="flex-1 text-[13.5px] font-semibold text-bink">
                      {share.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRevoke(share.id, share.email)}
                      disabled={revoke.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-[8px] text-bmuted transition-colors hover:bg-bred-soft hover:text-bred"
                      aria-label="Revoke access"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Accounts shared with me ── */}
        {sharedWithMe.length > 0 && (
          <section className="rounded-[20px] border border-bline bg-bsurface p-5">
            <div className="mb-1 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-bmuted">
              <Users size={12} />
              Accounts shared with me
            </div>
            <p className="mb-4 text-[13px] text-bink-2">
              These people have given you access to their budget.
              Switch accounts from the sidebar to view their data.
            </p>
            <div className="flex flex-col gap-[6px]">
              {sharedWithMe.map(share => (
                <div
                  key={share.id}
                  className="flex items-center gap-3 rounded-[12px] border border-bline bg-bsurface-2 px-3 py-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e0f7fa] text-[12px] font-bold text-[#0e7490]">
                    {share.email[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="text-[13.5px] font-semibold text-bink">{share.email}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
