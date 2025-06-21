import { Modal, Text, Stack, Button } from "@mantine/core";
import { User } from "@supabase/supabase-js";

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
}

export default function SettingsModal({ opened, onClose, user }: ProfileModalProps) {
  return (
    <Modal
        opened={opened}
        onClose={onClose}
        title="Account Settings"
        centered
    >
        <Stack gap="xs">
            <Text size="sm"><strong>Email:</strong> {user?.email}</Text>
            <Text size="sm"><strong>User ID:</strong> {user?.id}</Text>
            {user?.user_metadata?.full_name && (
            <Text size="sm"><strong>Name:</strong> {user.user_metadata.full_name}</Text>
            )}
            {user?.phone && (
            <Text size="sm"><strong>Phone:</strong> {user.phone}</Text>
            )}
            {/* <Button
            variant="light"
            color="pink"
            mt="md"
            onClick={async () => {
                if (user?.email) {
                await supabase.auth.resetPasswordForEmail(user.email);
                alert("Password reset email sent!");
                }
            }}
            >
            Reset Password
            </Button> */}
        </Stack>
    </Modal>
  );
}