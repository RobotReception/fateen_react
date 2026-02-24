interface AvatarProps {
    name: string
    size?: number
    className?: string
}

const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
]

function getColor(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return COLORS[Math.abs(hash) % COLORS.length]
}

export function Avatar({ name, size = 36, className = "" }: AvatarProps) {
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                minWidth: size,
                borderRadius: "50%",
                background: getColor(name),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: size * 0.38,
                letterSpacing: "0.02em",
                flexShrink: 0,
            }}
        >
            {initials || "؟"}
        </div>
    )
}
