import { IconButton, Box, Dialog, Flex, Button, Text } from "@radix-ui/themes";
import { useFetcher } from "react-router";
import { BellIcon } from "@radix-ui/react-icons";

export default function InvitationNotification({
	invitations,
}: {
	invitations: { id: string; householdName: string; inviterName: string }[];
}) {
	const fetcher = useFetcher();

	function respond(id: string, intent: "accept" | "decline") {
		fetcher.submit({ intent, invitation_id: id }, { method: "post" });
	}

	const accept = (id: string) => respond(id, "accept");
	const decline = (id: string) => respond(id, "decline");
	return (
		<Dialog.Root>
			<Dialog.Trigger>
				<Box position="relative" display="inline-block">
					<IconButton variant="ghost" size="2" aria-label="招待通知">
						<BellIcon width={18} height={18} />
					</IconButton>
					{invitations.length > 0 && (
						<Box
							position="absolute"
							style={{
								top: "2px",
								right: "2px",
								width: "6px",
								height: "6px",
								backgroundColor: "red",
								borderRadius: "50%",
							}}
						/>
					)}
				</Box>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>招待通知</Dialog.Title>
				<Flex direction="column" gap="3">
					<Box style={{ listStyle: "none", padding: 0, margin: 0 }}>
						{invitations.length === 0 && (
							<Text size="1" color="gray">
								招待は来ていません
							</Text>
						)}
						{invitations.map((inv) => (
							<Flex
								key={inv.id}
								align="center"
								justify="between"
								px="3"
								py="2"
								gap="3"
							>
								<Flex direction="column" style={{ minWidth: 0 }}>
									<Text weight="bold">{inv.householdName}</Text>
									<Text size="1" color="gray" truncate>
										招待した人: {inv.inviterName}
									</Text>
								</Flex>
								<Flex gap="2" align="center">
									<Button
										size="2"
										variant="solid"
										onClick={() => accept(inv.id)}
									>
										参加
									</Button>
									<Button
										size="2"
										variant="outline"
										onClick={() => decline(inv.id)}
									>
										辞退
									</Button>
								</Flex>
							</Flex>
						))}
					</Box>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
