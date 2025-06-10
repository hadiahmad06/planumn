import { PlanContext } from "@/contexts/PlanContext";
import { Box, Flex, Skeleton, Title, Text } from "@mantine/core";
import { useContext } from "react";
import { formatDistanceToNow, isValid } from "date-fns";
import { UserSessionContext } from "@/contexts/UserSessionContext";

export default function PlanHeader() {
    const { plan, changesSaved, retryCount } = useContext(PlanContext);
    const { session } = useContext(UserSessionContext);

    if(!plan) return <Skeleton w="90%"/>

    return (
        <Flex
            style={{
                width: '100%',
                marginBottom: '1.5rem',
                justifyContent: 'flex-end',
            }}
            >
            <Box style={{ textAlign: 'right' }}>
                <Title order={2} style={{ marginBottom: "0.25rem", fontWeight: 700 }}>
                {plan.title}
                </Title>
                <Text size="md" c="dimmed" style={{marginBottom: "0.5rem"}}>
                    Program{plan.programs && plan.programs.length>0
                        ? (plan.programs.length === 1 
                        ? ": " + plan.programs[0] 
                        : "s: " + plan.programs.join(', ')) 
                    : ": Unknown"}
                </Text>
                {!session ? (
                <Text
                  size="md"
                  c="#811331"
                >
                  You must be logged in to Save to Cloud
                </Text>
              ) : (
                <Text size="md">
                  {changesSaved && plan.last_updated !== null ? (
                    (() => {
                      const date = new Date(plan.last_updated);
                      return isValid(date)
                        ? `Saved ${formatDistanceToNow(date, { addSuffix: true })}`
                        : '';
                    })()
                  ) : retryCount > 5 ? (
                    "Failed to save"
                  ) : retryCount !== 0 ? (
                    `Retrying... ${retryCount}`
                  ) : (
                    "Saving..."
                  )}
                </Text>
              )}
            </Box>
        </Flex>
    );
}