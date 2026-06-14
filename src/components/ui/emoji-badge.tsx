type EmojiBadgeProps = {
	emoji?: string | null;
	color: string;
	className?: string;
};

export function EmojiBadge({
	emoji,
	color,
	className = "",
}: EmojiBadgeProps) {
	return (
		<span
			aria-hidden="true"
			style={{
				backgroundColor: `color-mix(in srgb, ${color} 100%, transparent)`,
			}}
			className={`flex h-10 w-10 items-center justify-center rounded-md [text-shadow:0_4px_4px_rgba(0,0,0,10)] ${className}`}
		>
			{emoji || "🏷️"}
		</span>
	);
}
