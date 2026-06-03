import { NavLink } from 'react-router-dom'
import { Wallet, Calendar, LayoutGrid, Layers, Repeat, CalendarCheck, Tag, Settings, ArrowLeftRight } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar'
import { useProfiles } from '@/hooks/use-profiles'
import { useSharedWithMe } from '@/hooks/use-sharing'
import { useAuth } from '@/hooks/use-auth'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

const NAV = [
  { to: '/monthly',           label: 'Monthly',           Icon: Calendar      },
  { to: '/annual',            label: 'Annual matrix',     Icon: LayoutGrid    },
  { to: '/installments',      label: 'Installments',      Icon: Layers        },
  { to: '/subscriptions',     label: 'Subscriptions',     Icon: Repeat        },
  { to: '/scheduled-income',  label: 'Scheduled income',  Icon: CalendarCheck },
  { to: '/categories',        label: 'Categories',        Icon: Tag           },
] as const

export function Sidebar() {
  const { user }              = useAuth()
  const { data: profiles }    = useProfiles()
  const { data: sharedWithMe } = useSharedWithMe()

  const currentProfileId = useAppStore(s => s.currentProfileId)
  const activeOwnerId    = useAppStore(s => s.activeOwnerId)
  const switchProfile    = useAppStore(s => s.switchProfile)

  const profile = profiles?.find(p => p.id === currentProfileId)

  // Profiles that belong to the current active account
  const activeProfiles: Profile[] = profiles?.filter(p => p.user_id === activeOwnerId) ?? []

  // Profiles that belong to other users who shared with me
  const sharedOwnerIds = new Set(sharedWithMe?.map(s => s.owner_user_id) ?? [])
  const sharedProfiles: Profile[] = profiles?.filter(p => sharedOwnerIds.has(p.user_id)) ?? []

  // Group shared profiles by owner for display
  const sharedByOwner = sharedProfiles.reduce<Record<string, Profile[]>>((acc, p) => {
    if (!acc[p.user_id]) acc[p.user_id] = []
    acc[p.user_id].push(p)
    return acc
  }, {})

  // Determine if we're currently viewing a shared account
  const isViewingShared = activeOwnerId && activeOwnerId !== user?.id

  return (
    <aside className="flex w-[226px] shrink-0 flex-col border-r border-bline bg-bsurface px-4 py-[22px]">

      {/* Brand */}
      <div className="mb-[22px] flex items-center gap-2.5 px-1.5">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-bgreen">
          <Wallet size={18} className="text-white" />
        </div>
        <span className="text-[17px] font-extrabold tracking-tight text-bink">Budgetarko</span>
      </div>

      {/* Profile block */}
      {profile && (
        <div className="mb-[18px] rounded-[15px] border border-bline bg-bsurface-2 p-3">
          {/* Current profile header */}
          <div className="mb-[11px] flex items-center gap-2.5">
            <Avatar profile={profile} size={34} />
            <div>
              <div className="text-[14.5px] font-bold text-bink">{profile.name}</div>
              <div className="text-[11.5px] text-bmuted">
                {isViewingShared ? 'Shared account' : 'Personal budget'}
              </div>
            </div>
          </div>

          {/* Profile switcher — profiles of the active account */}
          <div className="flex gap-1.5">
            {activeProfiles.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => switchProfile(p.id, p.user_id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border px-1.5 py-[7px] text-[12.5px] font-semibold transition-colors',
                  p.id === currentProfileId
                    ? 'border-bink bg-bink text-white'
                    : 'border-bline bg-bsurface text-bink-2 hover:bg-bsurface-2',
                )}
              >
                <Avatar profile={p} size={22} />
                {p.name}
              </button>
            ))}
          </div>

          {/* Back to my account (when viewing shared) */}
          {isViewingShared && profiles && user && (
            <button
              type="button"
              onClick={() => {
                const myProfile = profiles.find(p => p.user_id === user.id)
                if (myProfile) switchProfile(myProfile.id, myProfile.user_id)
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-bline py-[7px] text-[12px] font-semibold text-bink-2 hover:bg-bsurface transition-colors"
            >
              <ArrowLeftRight size={13} />
              My account
            </button>
          )}

          {/* Shared accounts section */}
          {!isViewingShared && Object.keys(sharedByOwner).length > 0 && (
            <div className="mt-3 border-t border-bline-2 pt-3">
              <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.07em] text-bmuted">
                Shared with me
              </div>
              {Object.entries(sharedByOwner).map(([ownerId, ownerProfiles]) => {
                const shareInfo = sharedWithMe?.find(s => s.owner_user_id === ownerId)
                const firstProfile = ownerProfiles[0]
                return (
                  <button
                    key={ownerId}
                    type="button"
                    onClick={() => switchProfile(firstProfile.id, firstProfile.user_id)}
                    className="mb-1 flex w-full items-center gap-2 rounded-[10px] px-2 py-[7px] text-left text-[12.5px] font-semibold text-bink-2 transition-colors hover:bg-bsurface"
                  >
                    <div
                      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: '#0e7490' }}
                    >
                      {(shareInfo?.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <span className="truncate">{shareInfo?.email ?? ownerId}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-[3px]">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-[11px] rounded-[11px] px-3 py-[10px] text-[14px] font-semibold transition-colors',
                isActive
                  ? 'bg-bgreen-soft text-bgreen'
                  : 'text-bink-2 hover:bg-bsurface-2',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-bgreen' : 'text-bmuted'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-[18px]">
        <div className="mb-3 flex items-center gap-2 text-[12px] text-bmuted">
          <span className="h-2 w-2 rounded-full bg-bgreen shadow-[0_0_0_3px_var(--green-soft)]" />
          Synced
        </div>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex w-full items-center gap-[11px] rounded-[11px] px-3 py-[10px] text-[14px] font-semibold transition-colors',
              isActive
                ? 'bg-bgreen-soft text-bgreen'
                : 'text-bink-2 hover:bg-bsurface-2',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={18} className={isActive ? 'text-bgreen' : 'text-bmuted'} />
              Settings
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
