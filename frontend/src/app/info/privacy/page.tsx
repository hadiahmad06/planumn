"use client";

import { Container, Title, Text, Stack, Accordion } from "@mantine/core";

const linkStyle: React.CSSProperties = {
  color: "var(--accent-primary)",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

const accordionStyles = {
  item: {
    backgroundColor: "var(--bg-surface)",
    borderColor: "var(--border-subtle)",
    borderRadius: "var(--radius-md)",
  },
  control: {
    color: "var(--text-primary)",
    fontWeight: 600,
    fontSize: "var(--font-size-body)",
  },
  panel: {
    color: "var(--text-secondary)",
    fontSize: "var(--font-size-body)",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <Container size="sm" py="xl" style={{ backgroundColor: "var(--bg-canvas)", minHeight: "100vh" }}>
      <Stack align="center" gap="md">
        <Title
          order={1}
          style={{
            color: "var(--accent-primary)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Privacy Policy
        </Title>
        <Accordion variant="separated" radius="md" defaultValue="sources" styles={accordionStyles} style={{ width: "100%" }}>
          <Accordion.Item value="sources">
            <Accordion.Control>Where does your data come from?</Accordion.Control>
            <Accordion.Panel>
              Our data comes from{" "}
              <Text
                span
                component="a"
                href="https://umn.lol"
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                GopherGrades
              </Text>
              , a project maintained by Social Coding at the University of Minnesota.
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="data">
            <Accordion.Control>What data do you store?</Accordion.Control>
            <Accordion.Panel>
              We store only login information and graduation plans you&apos;ve saved manually or through autosave.
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
              You can download your graduation plans as JSON files. You&rsquo;ll also be able to delete specific plans through the menu{" "}
              <Text span style={{ color: "var(--text-tertiary)" }}>(coming soon)</Text>. You can request to delete all your data at any time.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="contact">
            <Accordion.Control>Who do I contact with questions?</Accordion.Control>
            <Accordion.Panel>
              For any privacy-related questions, please contact us via the{" "}
              <Text span component="a" href="/info/contact" style={linkStyle}>
                contact page
              </Text>
              .
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Container>
  );
}
