"use client";

import AnimatedTypingText from "@/components/atoms/landing/AnimatedTypingTest";
import LoggedInLandingButtons from "@/components/molecules/landing/LoggedInLandingButtons";
import LoggedOutLandingButtons from "@/components/molecules/landing/LoggedOutLandingButtons";
import { useMobile } from "@/contexts/visual/MobileProvider";
import { UserSessionContext } from "@/contexts/data/UserSessionContext";
import "@/styles/global.css";
import {
  Container,
  Flex,
  Button,
  Box,
  Stack,
  Text,
  Title,
  Group,
  Space,
  Paper,
} from "@mantine/core";
import { IconDeviceMobile } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <Group gap={6}>
      <Box
        style={{
          width: 8,
          height: 8,
          backgroundColor: color,
          borderRadius: "50%",
        }}
      />
      <Text
        style={{
          fontSize: "var(--font-size-micro)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-tertiary)",
          fontWeight: 600,
        }}
      >
        {label}
      </Text>
    </Group>
  );
}

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
        backgroundColor: "var(--bg-canvas)",
      }}
    >
      <Container fluid style={{ textAlign: "center", maxWidth: 800 }}>
        <Stack gap="var(--space-3)" justify="center" align="center">
          <Space h="8vh" />

          <Box>
            <Title
              order={1}
              style={{
                fontSize: "clamp(2.75rem, 8vw, 4.5rem)",
                fontWeight: 700,
                marginBottom: "0.5rem",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              <AnimatedTypingText />
            </Title>
            <Text
              style={{
                fontSize: "var(--font-size-label)",
                color: "var(--text-secondary)",
                fontWeight: 400,
                marginTop: "0.5rem",
              }}
            >
              Plan your graduation
            </Text>
          </Box>

          <Text
            style={{
              fontSize: "var(--font-size-label)",
              maxWidth: "min(40rem, 85vw)",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            The fast, visual graduation planner built by UMN students, for UMN students.
            Replace the clunky official Grad Planner with drag-and-drop course planning.
          </Text>

          {user && session ? <LoggedInLandingButtons /> : <LoggedOutLandingButtons />}

          <Group justify="center" gap="var(--space-3)" style={{ paddingTop: "var(--space-2)" }}>
            <StatusDot color="var(--success)" label="Live course data" />
            <StatusDot color="var(--rose-500)" label="Past grade distributions" />
            <StatusDot color="var(--accent-primary)" label="Built by students" />
          </Group>

          {isMobile && (
            <Paper
              withBorder
              p="md"
              style={{
                backgroundColor: "var(--rose-100)",
                color: "var(--accent-primary)",
                borderColor: "var(--rose-200)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-card)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 500,
                fontSize: "var(--font-size-body)",
              }}
            >
              <IconDeviceMobile size={20} />
              Limited mobile version — plan editing on desktop
            </Paper>
          )}

          <Space h="6vh" />

          <Group justify="center" gap="var(--space-1)">
            <Button
              component="a"
              variant="subtle"
              style={{ color: "var(--text-secondary)", fontWeight: 500 }}
              onClick={() => router.push("/info/privacy")}
            >
              Privacy
            </Button>
            <Button
              component="a"
              variant="subtle"
              style={{ color: "var(--text-secondary)", fontWeight: 500 }}
              onClick={() => router.push("/info/contact")}
            >
              Contact
            </Button>
          </Group>
        </Stack>
      </Container>
    </Flex>
  );
}
