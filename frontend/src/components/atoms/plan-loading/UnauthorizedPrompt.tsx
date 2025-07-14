import AuthButton from "@/components/molecules/authentication/AuthenticationModal";
import { Text, Paper, Stack, Center, Group, Button, Space } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { BiSolidError } from "react-icons/bi"
import { useRouter } from "next/navigation";
import PromptWrapper from "./PromptWrapper";


export default function UnauthorizedPrompt() {
  const router = useRouter();
  return (
    <PromptWrapper>
      <Group>
        <BiSolidError size={80}/>
      </Group>
      <Space/>
      <Stack gap="0.3rem">
        <Text size="xl" fw={800} c="#811331">
            You're not logged in
        </Text>
        <Text size="md" c="dimmed">
            Log in to save and share your plans
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
        {/* <AuthButton /> */}
      </Group>
    </PromptWrapper>
  );
}