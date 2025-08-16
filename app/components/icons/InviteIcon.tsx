interface InviteIconProps {
	color?: string;
}

export function InviteIcon({ color = "#F8F6F1" }: InviteIconProps) {
	return (
		<svg
			className="menu-icon"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="招待"
		>
			<title>招待</title>
			<path
				d="M3 8L12 13L21 8"
				stroke="#F8B500"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<rect
				x="3"
				y="6"
				width="18"
				height="12"
				rx="2"
				stroke={color}
				strokeWidth="1.5"
			/>
		</svg>
	);
}
