// Centered Contact Page with profile picture above name, and icons for links
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import { Container, Title, Text, Paper, Avatar, Group, ActionIcon, Stack } from '@mantine/core';

export default function ContactPage() {
  return (
    <Container size="md" py="xl">
      <Stack align="center">
        <Title order={1} mb="xs">Contact Us</Title>
        <Text mb="xl">
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
            <Paper key={name} shadow="sm" radius="md" p="md" withBorder style={{ width: 280, textAlign: "center" }}>
              <Avatar src={img} size={120} radius={120} mx="auto" mb="sm" />
              <Text fw={500} size="lg">{name}</Text>
              <Text c="dimmed" size="sm">{role}</Text>
              <Group justify="center" mt="sm">
                <ActionIcon size="lg" component="a" href={linkedin} target="_blank" rel="noopener noreferrer" color="gray">
                  <FiLinkedin />
                </ActionIcon>
                <ActionIcon size="lg" component="a" href={email} color="gray">
                  <FiMail />
                </ActionIcon>
                <ActionIcon size="lg" component="a" href={github} target="_blank" rel="noopener noreferrer" color="gray">
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