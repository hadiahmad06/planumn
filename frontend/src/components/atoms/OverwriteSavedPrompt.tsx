import { isPlanEmpty, Plan } from "@/types/plan";
import { Button, Center, Stack, Text, Title, Paper } from "@mantine/core";
import { PlanContext } from "@/contexts/PlanContext"
import { useContext, useEffect } from "react";

type OverwriteSavedPromptProps = { 
    setPromptVisible: (promptVisible: boolean) => void, 
    onOverwrite: () => void,
    message: string,
};

export default function OverwriteSavedPrompt({ setPromptVisible, onOverwrite, message }: OverwriteSavedPromptProps) {
    const { plan, planFetched } = useContext(PlanContext);

    useEffect(() => {
    if (planFetched && ((!plan || plan && isPlanEmpty(plan)))) {
        onOverwrite();
        setPromptVisible(false);
      }
    }, [planFetched]);

    if (!planFetched) return;

    return (
        <Center
            w="100vw"
            h="100vh"
        >
            <Paper 
                shadow="md" 
                radius="4rem"
                style={{
                    paddingLeft: "10vw",
                    paddingRight: "10vw",
                    paddingTop: "10vh",
                    paddingBottom: "10vh"
                }}>
              <Stack align="center" justify="center">
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
                  <Button variant="subtle" onClick={() => setPromptVisible(false)}>
                    Don't Overwrite
                  </Button>
                </Stack>
              </Stack>
            </Paper>
        </Center>
    );
}