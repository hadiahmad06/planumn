"use client";

import AnimatedTypingText from "@/components/atoms/AnimatedTypingTest";
import "@/styles/global.css"; // make sure this path is correct
import { Container, Flex, Button, Box, Stack, Text, Title, Group } from "@mantine/core";

export default function Home() {
  return (
    <Flex
      w="100vw"
      h="100vh"
      justify="center"
      align="center"
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
          <Box>
            <Title
              order={1}
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                color: "#0f172a",
                marginBottom: "0.5rem",
              }}
            >
              <AnimatedTypingText />
            </Title>
            <Text
              style={{
                fontSize: "1.5rem",
                color: "#334155",
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
              maxWidth: "40rem",
              color: "#334155",
              textAlign: "center",
            }}
          >
            The fast, visual graduation planner built by UMN students, for UMN students. Replace the clunky official Grad
            Planner with drag-and-drop course planning.
          </Text>

          <Group
            justify="center"
            gap="lg"
            style={{ paddingTop: "1rem" }}
          >
            <Button
              variant="gradient"
              gradient={{ from: "#811331", to: "#D16391", deg: 30 }}
              size="lg"
              style={{
                borderRadius: "1rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              onClick={() => (window.location.href = "/plan/id-example")}
            >
              Try Live Demo →
            </Button>
            <Button
              variant="outline"
              color="#334155"
              size="lg"
              style={{
                borderRadius: "1rem",
              }}
            >
              ▶ Watch Demo
            </Button>
          </Group>

          <Group
            justify="center"
            gap="lg"
            style={{ color: "#64748b", fontSize: "0.875rem", paddingTop: "2rem" }}
          >
            <Group gap="xs">
              <Box
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  backgroundColor: "#22c55e",
                  borderRadius: "50%",
                }}
              />
              <Text color="#334155">Live course data</Text>
            </Group>
            <Group gap="xs">
              <Box
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  backgroundColor: "#3b82f6",
                  borderRadius: "50%",
                }}
              />
              <Text color="#334155">SRT scores included</Text>
            </Group>
            <Group gap="xs">
              <Box
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  backgroundColor: "#811331",
                  borderRadius: "50%",
                }}
              />
              <Text color="#334155">Built by students</Text>
            </Group>
          </Group>
        </Stack>
      </Container>

      <Box
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          padding: "1rem 2rem",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1.5rem",
          zIndex: 2,
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#811331",
        }}
      >
        <Button
          component="a"
          href="/info/privacy"
          variant="subtle"
          style={{
            color: "#811331",
          }}
        >
          Privacy
        </Button>
        <Button
          component="a"
          href="/info/contact"
          variant="subtle"
          style={{
            color: "#811331",
          }}
        >
          Contact
        </Button>
      </Box>

      <style jsx global>{`
        @keyframes blink {
          50% {
            border-color: transparent;
          }
        }
      `}</style>
    </Flex>
  );
}
