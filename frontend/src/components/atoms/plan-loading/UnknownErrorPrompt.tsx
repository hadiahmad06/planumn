import { Text, Paper, Stack, Center, Group, Button, Space } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { BiSolidError } from "react-icons/bi"
import { useRouter } from "next/navigation";
import PromptWrapper from "./PromptWrapper";


export default function UnknownErrorPrompt() {
  const router = useRouter();
  return (
    <PromptWrapper>
      <Group>
        <BiSolidError size={80}/>
      </Group>
      <Space/>
      <Stack gap="0.3rem">
        <Text size="xl" fw={800} c="#811331">
            Something went wrong..
        </Text>
        <Text size="md" c="dimmed">
            Please try again in a moment. If the issue persists,{" "}
            <Text
            span
            c="#811331"
            style={{ cursor: "pointer", fontWeight: 600}}
            onClick={() => router.push("/info/contact")}
            >
            contact us.
            </Text>
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