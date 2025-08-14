interface IncomeIconProps {
	color?: string;
}

export function IncomeIcon({ color = "#F8F6F1" }: IncomeIconProps) {
	return (
		<svg
			className="menu-icon"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="収入登録"
		>
			<title>収入登録</title>
			<circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
			<path
				d="M12 7V17M7 12H17"
				stroke="#F8B500"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
