import { memo } from "react"

/**
 * A thin, animated progress bar shown at the top of a table/card container
 * when data is being refreshed in the background (isFetching && !isLoading).
 *
 * Usage:
 *   <div className="relative ...">
 *     <FetchingBar visible={isFetching && !isLoading} />
 *     ... table content ...
 *   </div>
 */
export const FetchingBar = memo(function FetchingBar({ visible }: { visible: boolean }) {
    if (!visible) return null
    return (
        <div className="absolute inset-x-0 top-0 z-20 h-[3px] overflow-hidden rounded-t-2xl">
            <div className="fetching-bar-track" />
            <style>{`
                @keyframes fetchingSlide {
                    0%   { transform: translateX(100%) }
                    100% { transform: translateX(-100%) }
                }
                .fetching-bar-track {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, #6366f1 40%, #818cf8 60%, transparent);
                    animation: fetchingSlide 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    )
})
