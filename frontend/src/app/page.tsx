"use client";

import AnimatedTypingText from "@/components/atoms/landing/AnimatedTypingTest";
import VideoPopup from "@/components/atoms/landing/VideoPopup";
import LoggedInLandingButtons from "@/components/molecules/landing/LoggedInLandingButtons";
import LoggedOutLandingButtons from "@/components/molecules/landing/LoggedOutLandingButtons";
import { useMobile } from "@/contexts/visual/MobileProvider";
import { UserSessionContext } from "@/contexts/data/UserSessionContext";
import "@/styles/global.css"; // make sure this path is correct
import { Container, Flex, Button, Box, Stack, Text, Title, Group, Center, Space, Paper } from "@mantine/core";
import { IconEdit, IconEye, IconPlayerPlay, IconUpload, IconPlayerPlayFilled, IconDeviceMobile } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";

export default function Home() {
  const { user, session } = useContext(UserSessionContext);
  const { isMobile } = useMobile();
  const router = useRouter();
  return (
    <Flex
      w="100vw"
      mih="100vh"
      justify="center"
      align="center"
      style={{
        overflow: "hidden",
      }}
    >
      <Container
        fluid
        style={{
          textAlign: "center",
          maxWidth: "800px",
        }}
      >
        <Stack
          gap="lg"
          justify="center"
          align="center"
        >
          <Space h="8vh" />
          <Box>
            <Title
              order={1}
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                // color: "#0f172a",
                marginBottom: "0.5rem",
              }}
            >
              <AnimatedTypingText />
            </Title>
            <Text
              style={{
                fontSize: "1.5rem",
                color: "var(--text-secondary)",
                fontWeight: "300",
                marginTop: "0.5rem",
              }}
            >
              Plan your graduation
            </Text>
          </Box>

          <Text
            style={{
              fontSize: "1.25rem",
              maxWidth: "min(40rem, 85vw)",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            The fast, visual graduation planner built by UMN students, for UMN students. Replace the clunky official Grad
            Planner with drag-and-drop course planning.
          </Text>

          {user && session ? <LoggedInLandingButtons /> : <LoggedOutLandingButtons />}
          {/* ▶  */}

          <Group
            justify="center"
            gap="lg"
            style={{ color: "var(--text-secondary)", fontSize: "0.875rem", paddingTop: "2rem" }}
          >
            <Group gap="xs">
              <Box
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  backgroundColor: "var(--success)",
                  borderRadius: "50%",
                }}
              />
              <Text color="var(--text-secondary)">Live course data</Text>
            </Group>
            <Group gap="xs">
              <Box
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  backgroundColor: "var(--info)",
                  borderRadius: "50%",
                }}
              />
              <Text color="var(--text-secondary)">Past grade distributions</Text>
            </Group>
            <Group gap="xs">
              <Box
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  backgroundColor: "var(--accent-primary)",
                  borderRadius: "50%",
                }}
              />
              <Text color="var(--text-secondary)">Built by students</Text>
            </Group>
            {isMobile && (
              <Paper
                shadow="sm"
                withBorder
                p="md"
                style={{
                  margin: "0",
                  backgroundColor: "var(--rose-100)",
                  color: "var(--accent-primary)",
                  borderColor: "var(--rose-200)",
                  textAlign: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 500,
                }}
              >
                <IconDeviceMobile size={20} />
                Limited Mobile Version: Plan editing on desktop
              </Paper>
            )}
          </Group>
          <Space h="8vh" />
          <Box
            style={{
              // position: "absolute",
              // bottom: 0,
              // left: 0,
              width: "100%",
              height: "5vh",
              // padding: "1rem 2rem",
              // backgroundColor: "rgba(255, 255, 255, 0.3)",
              // borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1.5rem",
              // zIndex: 2,
              // fontSize: "4rem",
              fontWeight: 500,
              color: "var(--accent-primary)",
            }}
          >
            <Button
              component="a"
              variant="subtle"
              style={{
                color: "var(--accent-primary)",
              }}
              onClick={() => {
                router.push("/info/privacy")
              }}
            >
              Privacy
            </Button>
            <Button
              component="a"
              variant="subtle"
              style={{
                color: "var(--accent-primary)",
              }}
              onClick={() => {
                router.push("/info/contact")
              }}
            >
              Contact
            </Button>
          </Box>
        </Stack>
      </Container>
    </Flex>
  );
}
