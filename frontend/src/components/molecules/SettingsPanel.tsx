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
import theme from "@/styles/theme";
import { useContext } from "react";
import { DisplaySettingsContext } from "@/contexts/visual/DisplaySettingsContext";

type Props = {
  onAutofill: () => void;
  hiddenSemesters: string[];
  setHiddenSemesters: (value: string[]) => void;
};

export default function SettingsPanel({
  onAutofill,
  hiddenSemesters,
  setHiddenSemesters,
}: Props) {
  const { colorKey, setColorKey } = useContext(DisplaySettingsContext);
  return (
    <Box
      style={{
        width: "max(375px, 50%)",
        backgroundColor: "#ffffff",
        border: "1px solid #e0e0e0",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        borderRadius: "12px",
        padding: "1rem",
        height: "fit-content",
        position: "sticky",
        top: theme.globalSearchLayoutStyles.heading.size,
      }}
    >
      <Accordion defaultValue="settings">
        <Accordion.Item value="settings">
          <Accordion.Control>
            <Text
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#811331",
              }}
            >
              Settings
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <SimpleGrid cols={1} spacing="lg" style={{ fontSize: "0.9rem", color: "#555" }}>
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
                    backgroundColor: "#811331",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#5e0f27";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#811331";
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
