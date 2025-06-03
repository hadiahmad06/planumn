"use client";

import AnimatedTypingText from "@/components/atoms/AnimatedTypingTest";
import "@/styles/global.css"; // make sure this path is correct
import { Container, Flex, Button, Box, Stack, Text, Title, Group, Center, Space } from "@mantine/core";
import { IconEdit, IconEye, IconPlayerPlay, IconUpload, IconPlayerPlayFilled } from "@tabler/icons-react";

export default function Home() {
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
            <Button.Group>
              <Button
                leftSection={<IconUpload size={18} />}
                variant="gradient"
                gradient={{ from: "#6B102C", to: "#C15D8E", deg: 90 }}
                size="lg"
                style={{
                  borderTopLeftRadius: "1rem",
                  borderBottomLeftRadius: "1rem",
                  borderTopRightRadius: "0.25rem",
                  borderBottomRightRadius: "0.25rem",
                  marginRight: "0.2rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                }}
                onClick={() => (window.location.href = "/plan/import")}
              >
                Import Transcript
              </Button>
              <Button
              leftSection={<IconEdit size={18} />}
                variant="gradient"
                gradient={{ from: "#C15D8E", to: "#E78AB4", deg: 90 }}
                size="lg"
                style={{
                  borderTopRightRadius: "1rem",
                  borderBottomRightRadius: "1rem",
                  borderTopLeftRadius: "0.25rem",
                  borderBottomLeftRadius: "0.25rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                }}
                onClick={() => (window.location.href = "/plan")}
              >
                Start from Scratch
              </Button>
            </Button.Group>
              <Button
                leftSection={<IconPlayerPlayFilled size={18} />}
                variant="outline"
                color="#334155"
                size="lg"
                style={{
                  borderRadius: "1rem",
                }}
              >
                Watch Demo
              </Button>
          </Group>
          {/* ▶  */}

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
        </Stack>
      </Container>
    </Flex>
  );
}
