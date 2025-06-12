import { PlanContext } from "@/contexts/PlanContext";
import { Box, Flex, Skeleton, Title, Text } from "@mantine/core";
import { useContext } from "react";
import { formatDistance, formatDistanceToNow, isAfter, isValid } from "date-fns";
import { UserSessionContext } from "@/contexts/UserSessionContext";

export default function PlanHeader() {
    const { plan, changesSaved, retryCount, setRetryCount, error } = useContext(PlanContext);
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
                  {retryCount > 5 ? (
                    <Text
                      style={{ color: "#811331" }}
                    >
                      Saving disabled due to repeated failures (limit reached).
                    </Text>
                  ) : error ? (
                    <Text
                      onClick={() => setRetryCount(retryCount + 1)}
                      style={{ color: "#811331", textDecoration: "underline", cursor: "pointer" }}
                    >
                      {error}
                    </Text>
                  ) : changesSaved && plan.last_updated !== null ? (() => {
                    const offset = new Date().getTimezoneOffset();
                    const now = new Date(Date.now() + offset * 60 * 1000);
                    
                    // console.log(now, plan.last_updated)
                    return isAfter(now, plan.last_updated)
                      ? `Saved ${formatDistance(plan.last_updated, now, { addSuffix: true })}`
                      : "Saved just now."
                  })() 
                    : "Saving..." 
                  }
                </Text>
              )}
            </Box>
        </Flex>
    );
}