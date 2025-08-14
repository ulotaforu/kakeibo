interface FixedCostIconProps {
	color?: string;
}

export function FixedCostIcon({ color = "#F8F6F1" }: FixedCostIconProps) {
	return (
		<svg
			className="menu-icon"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="固定費管理"
		>
			<title>固定費管理</title>
			<rect
				x="4"
				y="5"
				width="16"
				height="14"
				rx="2"
				stroke={color}
				strokeWidth="1.5"
			/>
			<path d="M4 9H20" stroke={color} strokeWidth="1.5" />
			<rect x="14" y="12" width="3" height="3" rx="0.5" fill="#F8B500" />
		</svg>
	);
}
