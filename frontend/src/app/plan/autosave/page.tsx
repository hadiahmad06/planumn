"use client";

import PlanDisplay from "@/components/organisms/plan-display/PlanDisplay";
import { PlanContext } from "@/contexts/data/PlanContext";
import { useContext } from "react";
import { Box, Text, Anchor, Center, Container, Paper, Stack, Title, Button } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function LoadLocalPlanPage() {
    const router = useRouter();
    const {plan} = useContext(PlanContext);
    return plan ?
        <PlanDisplay/>
        : (
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
                <Title order={1}>No Autosave Found.</Title>
                <Stack 
                    gap="sm"
                    style={{ marginTop: "1rem" }}
                    miw="max(20vw, 150px)"
                >
                    <Button
                    color="var(--accent-primary)"
                    onClick={() => {
                        router.push("/");
                    }}
                    >
                        Go back to Home Page
                    </Button>
                </Stack>
                </Stack>
            </Paper>
        </Center>
        );
}
