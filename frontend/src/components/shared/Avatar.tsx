import { useState } from 'react'

type AvatarProps = {
  name: string
  imageUrl?: string | null
  size?: number
  className?: string
}

const PALETTE = [
  'bg-slate-100 text-slate-700 border border-slate-200',
  'bg-zinc-100 text-zinc-700 border border-zinc-200',
  'bg-stone-100 text-stone-700 border border-stone-200',
  'bg-neutral-100 text-neutral-700 border border-neutral-200',
  'bg-gray-100 text-gray-700 border border-gray-200',
  'bg-slate-200 text-slate-800 border border-slate-300',
]

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

/**
 * Renders an image avatar when a valid `imageUrl` is provided, falling back
 * to a deterministic initials badge if there's no image or it fails to load.
 */
export function Avatar({ name, imageUrl, size = 40, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(imageUrl) && !failed
  const dimension = `${size}px`

  if (showImage) {
    return (
      <img
        src={imageUrl ?? undefined}
        alt={name}
        onError={() => setFailed(true)}
        style={{ width: dimension, height: dimension }}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      style={{ width: dimension, height: dimension, fontSize: size * 0.38 }}
      className={`flex items-center justify-center rounded-full font-semibold ${colorFor(name)} ${className}`}
    >
      {initialsFor(name)}
    </div>
  )
}
