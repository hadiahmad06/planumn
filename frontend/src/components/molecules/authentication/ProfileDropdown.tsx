import { Menu, UnstyledButton, Text, Divider, Avatar } from "@mantine/core";
import {
  IconLogout,
  IconTrash,
  IconUser,
  IconLayoutList,
  IconArrowsExchange,
  IconAdjustmentsHorizontal,
  IconChevronDown,
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: "var(--font-size-micro)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
        fontWeight: 600,
        padding: "var(--space-1) var(--space-2) calc(var(--space-1) / 2)",
      }}
    >
      {children}
    </Text>
  );
}

export default function ProfileDropdown() {
  const { user, setUser } = useContext(UserSessionContext);
  const { setPlan, changesSaved } = useContext(PlanContext);
  const [openedSettings, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [openedDeletionConfirmation, { open: openDeletionConfirmation, close: closeDeletionConfirmation }] = useDisclosure(false);
  const [openedDisplaySettings, { open: openDisplaySettings, close: closeDisplaySettings }] = useDisclosure(false);
  const router = useRouter();

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <Menu
        shadow="var(--shadow-overlay)"
        radius="var(--radius-md)"
        width={240}
        position="bottom-end"
        offset={6}
        styles={{
          dropdown: {
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            padding: "var(--space-1)",
          },
          item: {
            fontSize: "var(--font-size-body)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-sm)",
            padding: "calc(var(--space-1) * 0.75) var(--space-1)",
          },
        }}
      >
        <Menu.Target>
          <UnstyledButton
            style={{
              display: "flex",
              alignItems: "center",
              gap: "calc(var(--space-1) * 0.75)",
              padding: "calc(var(--space-1) / 2) var(--space-1)",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          >
            <Avatar
              radius="xl"
              size={26}
              styles={{
                root: {
                  backgroundColor: "var(--accent-primary)",
                  color: "var(--bg-surface)",
                },
              }}
            >
              {initial}
            </Avatar>
            <Text size="sm" style={{ color: "var(--text-primary)" }}>
              {user?.email}
            </Text>
            <IconChevronDown size={14} color="var(--text-tertiary)" />
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <SectionLabel>Plans</SectionLabel>

          <Menu.Item
            leftSection={<IconArrowsExchange size={16} color="var(--text-secondary)" />}
            onClick={() => router.push("/plan")}
          >
            Switch plan
          </Menu.Item>

          <Menu.Item
            leftSection={<IconLayoutList size={16} color="var(--text-secondary)" />}
            onClick={() => router.push("/plan")}
          >
            My plans
          </Menu.Item>

          <Divider my="var(--space-1)" color="var(--border-subtle)" />
          <SectionLabel>Application</SectionLabel>

          <Menu.Item
            leftSection={<IconAdjustmentsHorizontal size={16} color="var(--text-secondary)" />}
            onClick={openDisplaySettings}
          >
            Display settings
          </Menu.Item>

          <Divider my="var(--space-1)" color="var(--border-subtle)" />
          <SectionLabel>Account</SectionLabel>

          <Menu.Item
            leftSection={<IconUser size={16} color="var(--text-secondary)" />}
            onClick={openSettings}
          >
            Preferences
          </Menu.Item>

          <Divider my="var(--space-1)" color="var(--border-subtle)" />
          <SectionLabel>Danger zone</SectionLabel>

          <Menu.Item
            leftSection={<IconLogout size={16} color="var(--text-secondary)" />}
            onClick={() => handleLogout({ setUser, setPlan, changesSaved })}
          >
            Log out
          </Menu.Item>

          <Menu.Item
            leftSection={<IconTrash size={16} />}
            color="red"
            onClick={openDeletionConfirmation}
          >
            Delete my account
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <DisplaySettings opened={openedDisplaySettings} onClose={closeDisplaySettings} />

      <SettingsModal opened={openedSettings} onClose={closeSettings} user={user} />

      <DeletionConfirmationModal
        opened={openedDeletionConfirmation}
        onClose={closeDeletionConfirmation}
        user={user}
      />
    </>
  );
}
