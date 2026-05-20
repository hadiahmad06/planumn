"use client";

import { ColorKey } from "@/types/plan";
import {
  Box,
  Button,
  Text,
  SegmentedControl,
  MultiSelect,
  SimpleGrid,
  Accordion,
} from "@mantine/core";
import { useContext } from "react";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";

type Props = {
  onAutofill: () => void;
};

export default function SettingsPanel({
  onAutofill,
}: Props) {
  const { colorKey, setColorKey, hiddenSemesters, setHiddenSemesters } = useContext(DisplaySettingsContext);
  return (
    <Box
      style={{
        width: "max(375px, 50%)",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem",
        height: "fit-content",
        position: "sticky",
        top: 0,
      }}
    >
      <Accordion defaultValue="settings">
        <Accordion.Item value="settings">
          <Accordion.Control>
            <Text
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--accent-primary)",
              }}
            >
              Settings
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <SimpleGrid cols={1} spacing="lg" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              <Box>
                <Text style={{ marginBottom: "0.5rem", fontWeight: 500 }}>Color Coding:</Text>
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
                <Text style={{ marginBottom: "0.5rem", fontWeight: 500 }}>Hide Semesters:</Text>
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

              <Box>
                <Button
                  disabled
                  onClick={onAutofill}
                  fullWidth
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "var(--bg-surface)",
                    fontSize: "0.9rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-primary-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-primary)";
                  }}
                >
                  Autofill Plan
                </Button>
              </Box>
            </SimpleGrid>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
}
