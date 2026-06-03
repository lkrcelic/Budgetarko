import { NavLink } from 'react-router-dom'
import { Wallet, Calendar, LayoutGrid, Layers, Tag } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar'
import { useProfiles } from '@/hooks/use-profiles'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/monthly',       label: 'Monthly',       Icon: Calendar    },
  { to: '/annual',        label: 'Annual matrix', Icon: LayoutGrid  },
  { to: '/installments',  label: 'Installments',  Icon: Layers      },
  { to: '/categories',    label: 'Categories',    Icon: Tag         },
] as const

export function Sidebar() {
  const { data: profiles } = useProfiles()
  const currentProfileId = useAppStore(s => s.currentProfileId)
  const setProfileId = useAppStore(s => s.setProfileId)
  const profile = profiles?.find(p => p.id === currentProfileId)

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
      {profile && profiles && (
        <div className="mb-[18px] rounded-[15px] border border-bline bg-bsurface-2 p-3">
          <div className="mb-[11px] flex items-center gap-2.5">
            <Avatar profile={profile} size={34} />
            <div>
              <div className="text-[14.5px] font-bold text-bink">{profile.name}</div>
              <div className="text-[11.5px] text-bmuted">Personal budget</div>
            </div>
          </div>

          {/* Profile switcher buttons */}
          <div className="flex gap-1.5">
            {profiles.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfileId(p.id)}
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
        <div className="flex items-center gap-2 text-[12px] text-bmuted">
          <span className="h-2 w-2 rounded-full bg-bgreen shadow-[0_0_0_3px_var(--green-soft)]" />
          Synced
        </div>
      </div>
    </aside>
  )
}
