// Centered Contact Page with profile picture above name, and icons for links
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import { Container, Title, Text, Paper, Avatar, Group, ActionIcon, Stack } from '@mantine/core';

export default function ContactPage() {
  return (
    <Container size="md" py="xl" style={{ backgroundColor: "var(--bg-canvas)", minHeight: "100vh" }}>
      <Stack align="center">
        <Title
          order={1}
          mb="xs"
          style={{
            color: "var(--accent-primary)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Contact Us
        </Title>
        <Text
          mb="xl"
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-body)",
          }}
        >
          If you have any questions or need assistance, feel free to reach out to us:
        </Text>
        <Group justify="center" wrap="wrap" gap="xl">
          {[{
            name: "Hadi Ahmad",
            role: "Student at UMN",
            img: "/images/hadi.jpeg",
            linkedin: "https://www.linkedin.com/in/hadiahmad06",
            email: "mailto:ahmad287@umn.edu",
            github: "https://github.com/hadiahmad06"
          }, {
            name: "Michael Zewdie",
            role: "Student at UMN",
            img: "/images/michael.jpeg",
            linkedin: "https://www.linkedin.com/in/michaelzewdie06",
            email: "mailto:zewdi021@umn.edu",
            github: "https://github.com/Michael-Zewdie"
          }].map(({ name, role, img, linkedin, email, github }) => (
            <Paper
              key={name}
              p="md"
              withBorder
              style={{
                width: 280,
                textAlign: "center",
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Avatar src={img} size={120} radius={120} mx="auto" mb="sm" />
              <Text fw={600} size="lg" style={{ color: "var(--text-primary)" }}>{name}</Text>
              <Text size="sm" style={{ color: "var(--text-secondary)" }}>{role}</Text>
              <Group justify="center" mt="sm">
                <ActionIcon
                  size="lg"
                  component="a"
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <FiLinkedin />
                </ActionIcon>
                <ActionIcon
                  size="lg"
                  component="a"
                  href={email}
                  variant="subtle"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <FiMail />
                </ActionIcon>
                <ActionIcon
                  size="lg"
                  component="a"
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <FiGithub />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Group>
      </Stack>
    </Container>
  );
}
