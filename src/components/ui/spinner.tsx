import { cn } from "@/lib/utils";

export const Spinner = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
    return (
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className={cn("h-8 w-8 animate-spin", className)}
            {...props}
        >
            <g>
                {/* Apple-style spinner dashes */}
                {[...Array(8)].map((_, i) => (
                    <rect
                        key={i}
                        x="11"
                        y="1"
                        width="2"
                        height="5"
                        rx="1"
                        opacity={0.3 + (i / 8) * 0.7} // static opacity gradient, and we spin the whole SVG
                        transform={`rotate(${i * 45} 12 12)`}
                    />
                ))}
            </g>
        </svg>
    );
};
