import { Modal, Text, Stack, Group } from "@mantine/core";
import { User } from "@supabase/supabase-js";

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
}

function Row({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="var(--space-2)">
      <Text
        style={{
          fontSize: "var(--font-size-micro)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-tertiary)",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: "var(--font-size-body)",
          color: "var(--text-primary)",
          wordBreak: "break-word",
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </Group>
  );
}

export default function SettingsModal({ opened, onClose, user }: ProfileModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="md"
      title={
        <Text
          style={{
            fontSize: "var(--font-size-label)",
            fontWeight: 600,
            color: "var(--accent-primary)",
          }}
        >
          Account
        </Text>
      }
      radius="var(--radius-lg)"
      overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
      styles={{
        content: {
          backgroundColor: "var(--bg-surface)",
          boxShadow: "var(--shadow-overlay)",
          border: "1px solid var(--border-subtle)",
        },
        header: {
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        },
        body: {
          padding: "var(--space-2)",
        },
      }}
    >
      <Stack gap="var(--space-2)">
        <Row label="Email" value={user?.email} />
        <Row label="User ID" value={user?.id} />
        <Row label="Name" value={user?.user_metadata?.full_name} />
        <Row label="Phone" value={user?.phone} />
      </Stack>
    </Modal>
  );
}
