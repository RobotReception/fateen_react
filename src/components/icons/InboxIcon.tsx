import React from "react"

interface InboxIconProps {
    size?: number
    color?: string
    strokeWidth?: number
    className?: string
    style?: React.CSSProperties
}

/**
 * Custom inbox tray icon — matches the brand icon:
 * An open tray with curved sides and a down-arrow going into it.
 */
export function InboxIcon({
    size = 24,
    color = "currentColor",
    strokeWidth = 1.7,
    className,
    style,
}: InboxIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
        >
            {/* Down arrow */}
            <line x1="12" y1="2" x2="12" y2="12" />
            <polyline points="8.5 8.5 12 12 15.5 8.5" />

            {/* Tray body — rounded rectangle bottom */}
            <path d="M2 12h4l2 3h8l2-3h4" />
            <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />

            {/* Open curved top arms */}
            <path d="M6 12V7a2 2 0 0 1 1.5-1.94" />
            <path d="M18 12V7a2 2 0 0 0-1.5-1.94" />
        </svg>
    )
}
