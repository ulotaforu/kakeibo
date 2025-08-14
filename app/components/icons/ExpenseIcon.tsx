interface ExpenseIconProps {
	color?: string;
}

export function ExpenseIcon({ color = "#F8F6F1" }: ExpenseIconProps) {
	return (
		<svg
			className="menu-icon"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="支出登録"
		>
			<title>支出登録</title>
			<circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
			<path
				d="M8 12H16"
				stroke="#F8B500"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
