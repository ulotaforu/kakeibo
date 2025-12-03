import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button, Box, Flex, Text } from "@radix-ui/themes";
import { DashboardIcon } from "./icons/DashboardIcon";
import { StatementIcon } from "./icons/StatementIcon";
import { ExpenseIcon } from "./icons/ExpenseIcon";
import { IncomeIcon } from "./icons/IncomeIcon";
import { FixedCostIcon } from "./icons/FixedConstIcon";
import { InviteIcon } from "./icons/InviteIcon";
import { HomeIcon } from "./icons/HomeIcon";

interface HamburgerMenuProps {
	householdId: string;
	isOwner?: boolean;
	onInviteClick?: () => void;
}

type MenuDisplay = "icon" | "iconText";

const year = new Date().getFullYear();
const month = new Date().getMonth() + 1;
const ym = `${year}-${String(month).padStart(2, "0")}`;

export function HamburgerMenu({
	householdId,
	isOwner,
	onInviteClick,
}: HamburgerMenuProps) {
	const [displayMode, setDisplayMode] = useState<MenuDisplay>("icon");

	// 初期CSS変数設定
	useEffect(() => {
		document.documentElement.style.setProperty("--sidebar-width", "45px");
	}, []);

	// TODO: ライトモード・ダークモードでカラー変更
	const iconColor = "#F8F6F1"; // 勝色背景に対しては白色を維持

	const menuItems = [
		{
			path: "/home",
			label: "ホーム",
			icon: <HomeIcon color={iconColor} />,
			ownerItem: false,
		},
		{
			path: `/${householdId}`,
			label: "ダッシュボード",
			icon: <DashboardIcon color={iconColor} />,
			ownerItem: false,
		},
		{
			path: `/${householdId}/summary?ym=${ym}`,
			label: "明細",
			icon: <StatementIcon color={iconColor} />,
			ownerItem: false,
		},
		{
			path: `/${householdId}/expenses`,
			label: "支出登録",
			icon: <ExpenseIcon color={iconColor} />,
			ownerItem: false,
		},
		{
			path: `/${householdId}/income`,
			label: "収入登録",
			icon: <IncomeIcon color={iconColor} />,
			ownerItem: false,
		},
		{
			path: `/${householdId}/fixed`,
			label: "固定費管理",
			icon: <FixedCostIcon color={iconColor} />,
			ownerItem: false,
		},
		{
			path: "",
			label: "招待",
			icon: <InviteIcon color={iconColor} />,
			ownerItem: true,
		},
	];

	const handleToggleDisplay = () => {
		setDisplayMode((prev) => {
			const newMode = prev === "icon" ? "iconText" : "icon";
			// CSS変数を更新してメインコンテンツのマージンを調整
			const width = newMode === "iconText" ? "200px" : "45px";
			document.documentElement.style.setProperty("--sidebar-width", width);
			return newMode;
		});
	};

	return (
		<Box
			style={{
				backgroundColor: "#2A4073",
				border: "1px solid #1a2d5c",
				borderRadius: "0 var(--radius-3) var(--radius-3) 0",
				padding: "var(--space-2)",
				minWidth: displayMode === "iconText" ? "200px" : "45px",
				height: "100vh",
				transition: "min-width 0.2s ease",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Flex direction="column" gap="1" style={{ height: "100%" }}>
				{/* トグルボタン */}
				<Button
					variant="ghost"
					onClick={handleToggleDisplay}
					style={{
						padding: "var(--space-2)",
						height: "40px",
						justifyContent: "flex-start",
						marginBottom: "var(--space-3)",
						color: "#F8F6F1",
					}}
				>
					<Flex align="center" gap="2">
						<Box
							style={{
								width: "24px",
								display: "flex",
								justifyContent: "center",
							}}
						>
							<Text size="3">{displayMode === "iconText" ? "◀" : "☰"}</Text>
						</Box>
						{displayMode === "iconText" && (
							<Text size="2" weight="medium">
								メニュー
							</Text>
						)}
					</Flex>
				</Button>

				{/* メニューアイテム */}
				{menuItems.map((item) => (
					<Button
						key={item.path}
						asChild
						variant="ghost"
						style={{
							justifyContent: "flex-start",
							width: "100%",
							padding: "var(--space-2)",
							marginBottom: "var(--space-1)",
							color: "#F8F6F1",
						}}
					>
						{item.ownerItem && isOwner ? (
							<Box onClick={onInviteClick} style={{ cursor: "pointer" }}>
								<Flex align="center" gap="2">
									<Box
										style={{
											width: "24px",
											display: "flex",
											justifyContent: "center",
										}}
									>
										{typeof item.icon === "string" ? (
											<Text size="3">{item.icon}</Text>
										) : (
											item.icon
										)}
									</Box>
									{displayMode === "iconText" && (
										<Text size="2" weight="medium">
											{item.label}
										</Text>
									)}
								</Flex>
							</Box>
						) : !item.ownerItem ? (
							<Link to={item.path}>
								<Flex align="center" gap="2">
									<Box
										style={{
											width: "24px",
											display: "flex",
											justifyContent: "center",
										}}
									>
										{typeof item.icon === "string" ? (
											<Text size="3">{item.icon}</Text>
										) : (
											item.icon
										)}
									</Box>
									{displayMode === "iconText" && (
										<Text size="2" weight="medium">
											{item.label}
										</Text>
									)}
								</Flex>
							</Link>
						) : null}
					</Button>
				))}
			</Flex>
		</Box>
	);
}
