import { isPlanEmpty, Plan } from "@/types/plan";
import { Button, Center, Stack, Text, Title, Paper } from "@mantine/core";
import { PlanContext } from "@/contexts/data/PlanContext"
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import PromptWrapper from "./PromptWrapper";

type OverwriteSavedPromptProps = { 
    setPromptVisible: (promptVisible: boolean) => void, 
    onOverwrite: () => void,
    message: string,
};

export default function OverwriteSavedPrompt({ setPromptVisible, onOverwrite, message }: OverwriteSavedPromptProps) {
  const router = useRouter();
  const { plan, planFetched } = useContext(PlanContext);

  useEffect(() => {
  if (planFetched && ((!plan || plan && isPlanEmpty(plan)))) {
      onOverwrite();
      setPromptVisible(false);
    }
  }, [planFetched]);

  if (!planFetched) return;

  return (
    <PromptWrapper>
      <Title order={1}>Overwrite Autosave?</Title>
      <Text size="md">{message}</Text>
      <Stack 
        gap="sm"
        style={{ marginTop: "1rem" }}
        miw="max(20vw, 150px)"
      >
        <Button
          color="#881311"
          onClick={() => {
            onOverwrite();
            setPromptVisible(false);
          }}
        >
          Overwrite Plan
        </Button>
        <Button variant="subtle" onClick={() => {
          setPromptVisible(false);
          router.push("/plan/autosave");
        }}>
          Don't Overwrite
        </Button>
      </Stack>
    </PromptWrapper>
  );
}