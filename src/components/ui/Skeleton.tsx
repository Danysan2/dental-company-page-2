import React from 'react'

interface SkeletonProps {
  width?:  number | string
  height?: number
  radius?: number
  circle?: boolean
  style?:  React.CSSProperties
}

export default function Skeleton({
  width  = '100%',
  height = 16,
  radius = 8,
  circle = false,
  style  = {},
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width:        circle ? height : width,
        height,
        borderRadius: circle ? '50%' : radius,
        background:   'linear-gradient(90deg, var(--color-warm-2) 25%, var(--color-warm-3) 50%, var(--color-warm-2) 75%)',
        backgroundSize: '400% 100%',
        animation:    'shimmer 1.4s ease infinite',
        flexShrink:   0,
        ...style,
      }}
    />
  )
}
