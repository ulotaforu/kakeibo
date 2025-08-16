import { Flex, IconButton, Text } from "@radix-ui/themes";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
	currentMonth: string;
	fetcher: any;
}

export function PaginationControls({
	currentPage,
	totalPages,
	currentMonth,
	fetcher,
}: PaginationControlsProps) {
	return (
		<Flex
			justify="center"
			align="center"
			gap="2"
			style={{ marginTop: "var(--space-4)" }}
		>
			<fetcher.Form method="get" style={{ display: "contents" }}>
				<input type="hidden" name="ym" value={currentMonth} />
				<input
					type="hidden"
					name="page"
					value={String(Math.max(1, currentPage - 1))}
				/>
				<IconButton
					type="submit"
					variant="soft"
					disabled={currentPage <= 1}
				>
					<ChevronLeftIcon />
				</IconButton>
			</fetcher.Form>

			<Text size="2">
				{currentPage} / {totalPages}
			</Text>

			<fetcher.Form method="get" style={{ display: "contents" }}>
				<input type="hidden" name="ym" value={currentMonth} />
				<input
					type="hidden"
					name="page"
					value={String(Math.min(totalPages, currentPage + 1))}
				/>
				<IconButton
					type="submit"
					variant="soft"
					disabled={currentPage >= totalPages}
				>
					<ChevronRightIcon />
				</IconButton>
			</fetcher.Form>
		</Flex>
	);
}