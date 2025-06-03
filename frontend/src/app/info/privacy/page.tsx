"use client";

import { Container, Title, Text, Stack, Accordion } from "@mantine/core";

export default function PrivacyPolicyPage() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="md">
        <Title order={1}>Privacy Policy</Title>
        <Accordion variant="separated" radius="md" defaultValue="sources">
          <Accordion.Item value="sources">
            <Accordion.Control>Where does your data come from?</Accordion.Control>
            <Accordion.Panel>
              Our data comes from <Text span component="a" href="https://umn.lol" target="_blank" rel="noopener noreferrer" c="blue">GopherGrades</Text>, a project maintained by Social Coding at the University of Minnesota.
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="data">
            <Accordion.Control>What data do you store?</Accordion.Control>
            <Accordion.Panel>
              We store only login information and graduation plans you've saved manually or through autosave.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="analytics">
            <Accordion.Control>Do you track users?</Accordion.Control>
            <Accordion.Panel>
              We use Supabase for authentication and data storage. We also use Vercel Analytics to measure general page views—this data is anonymous and not stored in any personal way.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="downloads">
            <Accordion.Control>Can I download or delete my data?</Accordion.Control>
            <Accordion.Panel>
              You can download your graduation plans as JSON files. You’ll also be able to delete specific plans through the menu <Text span c="dimmed">(coming soon)</Text>. You can request to delete all your data at any time.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="contact">
            <Accordion.Control>Who do I contact with questions?</Accordion.Control>
            <Accordion.Panel>
              For any privacy-related questions, please contact us via the <Text span component="a" href="/info/contact" c="blue">contact page</Text>.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Container>
  );
}