import { Modal, Text, Stack, Button, TextInput, PasswordInput } from "@mantine/core";
import { User } from "@supabase/supabase-js";
import { useState } from "react";

interface DeletionConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
}

export default function DeletionConfirmationModal({ opened, onClose, user }: DeletionConfirmationModalProps) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  return (
    <Modal
        opened={opened}
        onClose={onClose}
        title="Data Deletion Confirmation"
        centered
    >
        <Stack gap="xs">
            <TextInput
              label="Confirm Email"
              placeholder="Enter your email"
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
              label='Type "Delete all my data" to confirm'
              placeholder="Delete all my data"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.currentTarget.value)}
            />
            <Button
              variant="filled"
              color="red"
              disabled={
                confirmEmail !== user?.email ||
                confirmPassword.length < 1 ||
                confirmationText !== "Delete all my data"
              }
              onClick={async () => {
                alert("feature disabled for now, please contact ahmad287@umn.edu and ill delete it manually");
                // const res = await fetch("/api/deleteUser", {
                //   method: "POST",
                //   headers: {
                //     "Content-Type": "application/json",
                //   },
                //   body: JSON.stringify({
                //     email: confirmEmail,
                //     password: confirmPassword,
                //   }),
                // });

                // if (res.ok) {
                //   alert("Account successfully deleted.");
                //   onClose();
                // } else {
                //   alert("Failed to delete account. Please try again.");
                // }
              }}
            >
              Delete My Account
            </Button>
        </Stack>
    </Modal>
  );
}