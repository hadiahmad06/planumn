

import { Text, Paper, Stack, Center, Group, Button, Space } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { LuUserRoundX } from "react-icons/lu"
import { useRouter } from "next/navigation";
import PromptWrapper from "./PromptWrapper";


export default function NoAccessPrompt() {
  const router = useRouter();
  return (
    <PromptWrapper>
      <Group>
        <LuUserRoundX size={80}/>
      </Group>
      <Space/>
      <Stack gap="0.3rem">
        <Text size="xl" fw={800} c="#811331">
          You don't have access to this plan.
        </Text>
        <Text size="md" c="dimmed">
          Ask the plan's owner to share it with you, or view your own plans.
        </Text>
      </Stack>
      <Space/>
      <Group justify="space-between" style={{width: '90%'}}>
        <Button 
          color="#811331"
          radius="md"
          variant="outline"
          leftSection={<IconArrowLeft size={16}/>}
          onClick={() => router.push("/")}
        >
          Home Page
        </Button>
        <Button 
          color="#811331"
          radius="md"
          variant="filled"
          rightSection={<IconArrowRight size={16}/>}
          onClick={() => router.push("/plan")}
        >
          View My Plans
        </Button>
      </Group>
    </PromptWrapper>
  );
}