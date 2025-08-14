interface DashboardIconProps {
	color?: string;
}

export function DashboardIcon({ color = "#F8F6F1" }: DashboardIconProps) {
	return (
		<svg
			className="menu-icon"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="ダッシュボード"
		>
			<title>ダッシュボード</title>
			<rect
				x="3"
				y="3"
				width="7"
				height="7"
				rx="1.5"
				stroke={color}
				strokeWidth="1.5"
			/>
			<rect
				x="14"
				y="3"
				width="7"
				height="7"
				rx="1.5"
				stroke={color}
				strokeWidth="1.5"
			/>
			<rect
				x="3"
				y="14"
				width="7"
				height="7"
				rx="1.5"
				stroke={color}
				strokeWidth="1.5"
			/>
			<rect
				x="14"
				y="14"
				width="7"
				height="7"
				rx="1.5"
				stroke={color}
				strokeWidth="1.5"
			/>
			<circle cx="6.5" cy="6.5" r="1.5" fill="#F8B500" />
		</svg>
	);
}
