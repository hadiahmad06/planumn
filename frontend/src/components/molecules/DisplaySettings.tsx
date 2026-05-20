"use client";

import { ColorKey } from "@/types/plan";
import {
  Box,
  Button,
  Modal,
  Text,
  SegmentedControl,
  MultiSelect,
  Stack,
} from "@mantine/core";
import { useContext } from "react";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";

type Props = {
  opened: boolean;
  onClose: () => void;
};

export default function DisplaySettings({ opened, onClose }: Props) {
  const { colorKey, setColorKey, hiddenSemesters, setHiddenSemesters } =
    useContext(DisplaySettingsContext);

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
          Display Settings
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
        <Box>
          <Text
            style={{
              marginBottom: "var(--space-1)",
              fontWeight: 500,
              fontSize: "var(--font-size-body)",
              color: "var(--text-primary)",
            }}
          >
            Color Coding
          </Text>
          <SegmentedControl
            fullWidth
            value={colorKey}
            onChange={(value) => setColorKey(value as ColorKey)}
            data={[
              { label: "None", value: "none" },
              { label: "Department", value: "department" },
              { label: "Level", value: "level" },
            ]}
          />
        </Box>

        <Box>
          <Text
            style={{
              marginBottom: "var(--space-1)",
              fontWeight: 500,
              fontSize: "var(--font-size-body)",
              color: "var(--text-primary)",
            }}
          >
            Hide Semesters
          </Text>
          <MultiSelect
            data={[
              { value: "fall", label: "Fall" },
              { value: "spring", label: "Spring" },
              { value: "summer", label: "Summer" },
            ]}
            value={hiddenSemesters}
            onChange={setHiddenSemesters}
            placeholder="Choose semesters to hide"
            clearable
          />
        </Box>

        <Button
          disabled
          fullWidth
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "var(--bg-surface)",
            fontSize: "var(--font-size-body)",
            borderRadius: "var(--radius-md)",
          }}
        >
          Autofill Plan
        </Button>
      </Stack>
    </Modal>
  );
}
