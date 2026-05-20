import { Menu, Button, Group, Text, Divider, Stack, Space } from "@mantine/core";
import {
  IconSettings,
  IconRefresh,
  IconTrash,
  IconUser,
  IconLayoutList,
  IconArrowsExchange,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import SettingsModal from "@/components/molecules/authentication/SettingsModal";
import DeletionConfirmationModal from "./DeletionConfirmationModal";
import { UserSessionContext } from "@/contexts/data/UserSessionContext";
import { useContext } from "react";
import { PlanContext } from "@/contexts/data/PlanContext";
import DisplaySettings from "../DisplaySettings";
import { handleLogout } from "./authenticationActions";

export default function ProfileDropdown() {
  const { user, setUser } = useContext(UserSessionContext);
  const { setPlan, changesSaved } = useContext(PlanContext);
  const [openedSettings, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [openedDeletionConfirmation, { open: openDeletionConfirmation, close: closeDeletionConfirmation }] = useDisclosure(false);
  const [openedDisplaySettings, { open: openDisplaySettings, close: closeDisplaySettings }] = useDisclosure(false);
  const router = useRouter();

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
            <Text size="xs" c="dimmed" px="xs">Plans</Text>

            <Menu.Item
              leftSection={<IconArrowsExchange size={16} style={{ marginLeft: "6px" }} />}
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
              onClick={() => router.push("/plan")}
            >
              Switch plan
            </Menu.Item>

            <Menu.Item
              leftSection={<IconLayoutList size={16} style={{ marginLeft: "6px" }} />}
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
              onClick={() => router.push("/plan")}
            >
              My plans
            </Menu.Item>

            <Divider />
            <Space h="0.1rem" />
            <Text size="xs" c="dimmed" px="xs">Application</Text>

            <Menu.Item
              leftSection={<IconSettings size={16} style={{ marginLeft: "6px" }} />}
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
              onClick={openDisplaySettings}
            >
              Display Settings
            </Menu.Item>

            <Divider />
            <Space h="0.1rem" />
            <Text size="xs" c="dimmed" px="xs">Account</Text>
            <Menu.Item
              leftSection={
                <IconUser size={20} color="var(--text-primary)" />
              }
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
              onClick={openSettings}
            >
              Preferences
            </Menu.Item>

            <Divider />
            <Space h="0.1rem" />

            <Text size="xs" c="dimmed" px="xs">Danger zone</Text>

            <Menu.Item
              leftSection={<IconRefresh size={16} />}
              style={{ fontSize: "0.95rem", paddingRight: "1rem" }}
              onClick={() => {handleLogout({ setUser, setPlan, changesSaved})}}
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

      <DisplaySettings
        opened={openedDisplaySettings}
        onClose={closeDisplaySettings}
      />

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