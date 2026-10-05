import { initials } from '@/lib/formatters'

type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { box: string; text: string }> = {
  sm: { box: 'h-7 w-7', text: 'text-[11px]' },
  md: { box: 'h-9 w-9', text: 'text-[13px]' },
  lg: { box: 'h-14 w-14', text: 'text-lg' },
}

export function ProfileAvatar({
  name,
  src,
  size = 'md',
}: {
  name: string | null | undefined
  src?: string | null
  size?: Size
}) {
  const dimension = SIZES[size]

  if (src) {
    return (
      // Plain img: the avatar URL is user supplied and Next domains are unknown.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${dimension.box} shrink-0 rounded-full border border-line object-cover`}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={`${dimension.box} ${dimension.text} flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold uppercase text-brand-700 dark:bg-brand-500/20 dark:text-brand-200`}
    >
      {initials(name)}
    </span>
  )
}

export function NameCell({
  name,
  meta,
  avatar,
}: {
  name: string
  meta?: string
  avatar?: string | null
}) {
  return (
    <div className="flex items-center gap-2.5">
      <ProfileAvatar name={name} src={avatar} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink">{name}</p>
        {meta && <p className="truncate text-xs text-muted">{meta}</p>}
      </div>
    </div>
  )
}