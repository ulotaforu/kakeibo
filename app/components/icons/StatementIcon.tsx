interface StatementIconProps {
	color?: string;
}

export function StatementIcon({ color = "#F8F6F1" }: StatementIconProps) {
	return (
		<svg
			className="menu-icon"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="明細"
		>
			<title>明細</title>
			<rect
				x="4"
				y="3"
				width="16"
				height="18"
				rx="2"
				stroke={color}
				strokeWidth="1.5"
			/>
			<path d="M4 7H20" stroke="#F8B500" strokeWidth="1" opacity="0.5" />
			<path
				d="M8 3V5"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<path
				d="M16 3V5"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<path
				d="M7 10H12"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<circle cx="15" cy="10" r="0.5" fill="#F8B500" />
			<path
				d="M17 10H18"
				stroke="#F8B500"
				strokeWidth="1"
				strokeLinecap="round"
			/>
		</svg>
	);
}
