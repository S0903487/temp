import { useState } from 'react'

type AvatarProps = {
  name: string
  imageUrl?: string | null
  size?: number
  className?: string
}

const PALETTE = [
  'bg-violet-500/20 text-violet-300',
  'bg-cyan-500/20 text-cyan-300',
  'bg-amber-500/20 text-amber-300',
  'bg-emerald-500/20 text-emerald-300',
  'bg-rose-500/20 text-rose-300',
  'bg-sky-500/20 text-sky-300',
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
