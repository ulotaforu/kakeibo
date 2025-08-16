import { Outlet, Scripts, useLocation } from "react-router";
import { Theme } from "@radix-ui/themes";
import { useEffect } from "react";
import themeCssUrl from "@radix-ui/themes/styles.css?url";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Kakeibo</title>
				<meta name="description" content="共有できる家計簿webAPP" />
				<link rel="stylesheet" href={themeCssUrl} />
			</head>
			<body style={{ margin: 0 }}>
				<Theme>{children}</Theme>
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
