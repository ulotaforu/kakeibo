interface HomeIconProps {
	color?: string;
}

export function HomeIcon({ color = "#F8F6F1" }: HomeIconProps) {
	return (
		<svg
			className="menu-icon"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="ホームに戻る"
		>
			<title>ホームに戻る</title>
			<path
				d="M12 3L4 9V19C4 19.5523 4.44772 20 5 20H9V14H15V20H19C19.5523 20 20 19.5523 20 19V9L12 3Z"
				stroke={color}
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
			<path
				d="M12 3L4 9"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M12 3L20 9"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<rect x="9" y="14" width="6" height="6" fill="#F8B500" opacity="0.3" />
		</svg>
	);
}
