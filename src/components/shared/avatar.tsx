import type { Profile } from '@/types'

interface AvatarProps {
  profile: Pick<Profile, 'initials' | 'tint' | 'name'>
  size?: number
}

/** Circular profile avatar — coloured background + initials. */
export function Avatar({ profile, size = 32 }: AvatarProps) {
  return (
    <div
      aria-label={profile.name}
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: profile.tint,
        fontSize: size * 0.42,
      }}
      className="flex shrink-0 items-center justify-center font-semibold tracking-[0.02em] text-white"
    >
      {profile.initials}
    </div>
  )
}
