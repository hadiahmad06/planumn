"use client";

import { useContext } from "react";
import Link from "next/link";
import { Box, Button, Flex, Group, Tooltip } from "@mantine/core";
import { IconShare3 } from "@tabler/icons-react";
import { UserSessionContext } from "@/contexts/data/UserSessionContext";
import ProfileDropdown from "@/components/molecules/authentication/ProfileDropdown";
import AuthButton from "@/components/molecules/authentication/AuthenticationModal";
import SearchDropdown from "@/components/molecules/SearchDropdown";

export default function TopBar() {
  const { user, session } = useContext(UserSessionContext);

  return (
    <Box
      component="header"
      style={{
        width: "100%",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "12px 24px",
      }}
    >
      <Flex align="center" gap="md" wrap="nowrap">
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            flexShrink: 0,
          }}
        >
          planu.mn
        </Link>

        <Box style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <SearchDropdown />
        </Box>

        <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Tooltip label="Coming soon" withArrow>
            <Button
              leftSection={<IconShare3 size={16} />}
              radius="xl"
              variant="default"
              data-disabled
              onClick={(e) => e.preventDefault()}
              styles={{
                root: {
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-subtle)",
                  cursor: "not-allowed",
                  opacity: 0.7,
                },
              }}
            >
              Share
            </Button>
          </Tooltip>

          {user && session ? <ProfileDropdown /> : <AuthButton />}
        </Group>
      </Flex>
    </Box>
  );
}
