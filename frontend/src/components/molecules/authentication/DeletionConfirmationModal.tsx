import { Modal, Text, Stack, Button, TextInput, PasswordInput } from "@mantine/core";
import { User } from "@supabase/supabase-js";
import { useState } from "react";

interface DeletionConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
}

const CONFIRM_PHRASE = "Delete all my data";

export default function DeletionConfirmationModal({
  opened,
  onClose,
  user,
}: DeletionConfirmationModalProps) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  const canDelete =
    confirmEmail === user?.email &&
    confirmPassword.length >= 1 &&
    confirmationText === CONFIRM_PHRASE;

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
          Delete account
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
        <Text
          style={{
            fontSize: "var(--font-size-body)",
            color: "var(--text-secondary)",
          }}
        >
          This is permanent. Your plans and account data will be removed.
        </Text>

        <TextInput
          label="Confirm email"
          placeholder={user?.email ?? "you@example.com"}
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.currentTarget.value)}
        />
        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
        />
        <TextInput
          label={`Type "${CONFIRM_PHRASE}" to confirm`}
          placeholder={CONFIRM_PHRASE}
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.currentTarget.value)}
        />

        <Button
          variant="filled"
          color="red"
          radius="var(--radius-md)"
          disabled={!canDelete}
          onClick={() => {
            alert(
              "feature disabled for now, please contact ahmad287@umn.edu and ill delete it manually"
            );
          }}
        >
          Delete my account
        </Button>
      </Stack>
    </Modal>
  );
}
