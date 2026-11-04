type Props = { size?: number; className?: string };

export default function TricicloIcon({ size = 24, className = '' }: Props) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {/* Rueda delantera */}
            <circle cx="5" cy="17" r="2.5" />
            {/* Rueda trasera visible */}
            <circle cx="17" cy="17" r="2.5" />
            {/* Tercera rueda */}
            <circle cx="20" cy="14" r="1.5" />

            {/* Chasis */}
            <path d="M5 14.5 L5 11 L14 11 L17 14.5" />
            {/* Manubrio */}
            <path d="M4 11 L7 9 L10 11" />

            {/* Caja de carga */}
            <rect x="12" y="7" width="6" height="4" rx="0.5" />

            {/* Rayo eléctrico */}
            <path d="M15 7.5 L14 9 L15.5 9 L14.5 10.5" strokeWidth={1.2} />
        </svg>
    );
}