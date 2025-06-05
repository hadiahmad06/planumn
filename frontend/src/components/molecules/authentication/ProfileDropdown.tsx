import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Menu, Button, Avatar, Group, Text, Modal, Divider, Stack, Space } from "@mantine/core";
import {
  IconSettings,
  IconMessageCircle,
  IconPhoto,
  IconSearch,
  IconRefresh,
  IconTrash
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import SettingsModal from "@/components/molecules/authentication/SettingsModal";
import DeletionConfirmationModal from "./DeletionConfirmationModal";
import { UserSessionContext } from "@/contexts/UserSessionContext";
import { useContext } from "react";

export default function ProfileDropdown() {
  const { user, setUser } = useContext(UserSessionContext);
  const [openedSettings, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [openedDeletionConfirmation, { open: openDeletionConfirmation, close: closeDeletionConfirmation }] = useDisclosure(false);

  return (
    <>
      <Menu shadow="md">
        <Menu.Target>
          <Button variant="light" color="dark" radius="md" size="md" px="md" py="sm">
            <Group gap="sm">
              <Text fw={500} size="sm">{user?.email}</Text>
            </Group>
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Stack gap="0.25rem">
            <Space h="0.1rem" />
            <Text size="xs" c="dimmed" px="xs">Application</Text>

            <Menu.Item
              leftSection={<IconSettings size={16} />}
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
              onClick={openSettings}
            >
              Settings
            </Menu.Item>

            {/* <Menu.Item
              leftSection={<IconMessageCircle size={16} />}
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
            >
              Messages
            </Menu.Item>

            <Menu.Item
              leftSection={<IconPhoto size={16} />}
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
            >
              Gallery
            </Menu.Item>

            <Menu.Item
              leftSection={<IconSearch size={16} />}
              rightSection={
                <Text size="xs" c="dimmed">
                  ⌘K
                </Text>
              }
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
            >
              Search
            </Menu.Item> */}

            <Divider />
            <Space h="0.1rem" />

            <Text size="xs" c="dimmed" px="xs">Danger zone</Text>

            <Menu.Item
              leftSection={<IconRefresh size={16} />}
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
            >
              Log out
            </Menu.Item>

            <Menu.Item
              leftSection={<IconTrash size={16} />}
              color="red"
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
              onClick={openDeletionConfirmation}
            >
              Delete my account
            </Menu.Item>
          </Stack>
        </Menu.Dropdown>
      </Menu>

      <SettingsModal
        opened={openedSettings}
        onClose={closeSettings} 
        user={user}
      />

      <DeletionConfirmationModal
        opened={openedDeletionConfirmation}
        onClose={closeDeletionConfirmation}
        user={user}
      /> 
    </>
  );
}