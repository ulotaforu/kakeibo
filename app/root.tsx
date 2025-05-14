import { Outlet, Scripts } from "react-router";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
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
