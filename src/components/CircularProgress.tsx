import React from 'react'
import clsx from 'clsx'
import css from './CircularProgress.module.css'

interface CircularProgressProps {
  progress: number
  progressColor?: string
  style?: React.CSSProperties
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  progressColor = '#3498db',
  style,
}) => {
  const circleColor = '#e0e0e0'
  const strokeWidth = 10
  const size = 30
  const viewBox = 140
  const normalizedProgress = Math.min(100, Math.max(0, progress))
  const radius = 100 / 2 - strokeWidth
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset =
    circumference - (normalizedProgress / 100) * circumference
  const progressRadius = (360 * progress) / 100 - 50

  return (
    <div
      className={clsx(css.container, { [css.complete]: progress === 100 })}
      style={{ width: size, height: size, ...style }}
    >
      {progress < 100 ? (
        <svg
          viewBox={`0 0 ${viewBox} ${viewBox}`}
          className={css.svg}
          width={size}
          height={size}
        >
          <circle
            className={css.circle}
            stroke={circleColor}
            cx={viewBox / 2}
            cy={viewBox / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className={css.progress}
            stroke={progressColor}
            cx={viewBox / 2}
            cy={viewBox / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
          <path
            d="M90,76 v +28 h +28"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            transform={`rotate(${progressRadius} ${viewBox / 2} ${viewBox / 2})`}
          ></path>
        </svg>
      ) : (
        <svg viewBox="0 0 100 100" width={size - 10} height={size - 10}>
          <circle cx={100 / 2} cy={100 / 2} r={45} fill={progressColor} />
        </svg>
      )}
    </div>
  )
}
