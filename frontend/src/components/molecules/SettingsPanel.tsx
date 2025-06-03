"use client";

import { ColorKey } from "@/types/plan";
import { Box, Button, Text, Select } from "@mantine/core";
import theme from "@/styles/theme";

type Props = {
  colorKey: ColorKey;
  setColorKey: (key: ColorKey) => void; // Updated to use ColorKey type
  onAutofill: () => void;
};

export default function SettingsPanel({
  colorKey,
  setColorKey,
  onAutofill,
}: Props) {
  return (
    <Box
      style={{
        width: theme.globalSearchLayoutStyles.heading.size /* 64 */,
        backgroundColor: theme.globalSearchLayoutStyles.container.bg /* "white" */,
        border: "1px solid",
        borderColor: theme.globalSearchLayoutStyles.container.borderColor /* "border" */,
        boxShadow: "sm",
        borderRadius: "lg",
        padding: theme.globalSearchLayoutStyles.container.padding /* 4 */,
        height: "fit-content",
        position: "sticky",
        top: theme.globalSearchLayoutStyles.heading.size /* 8 */,
      }}
    >
      <Text
        style={{
          fontSize: theme.globalSearchLayoutStyles.heading.size /* "lg" */,
          fontWeight: "semibold",
          marginBottom: theme.globalSearchLayoutStyles.heading.margin /* 4 */,
          color: "foreground",
        }}
      >
        Settings
      </Text>
      <Box style={{ fontSize: "sm", color: "secondary" }}>
        <Text
          style={{
            marginBottom: theme.globalSearchLayoutStyles.heading.margin /* 2 */,
            fontWeight: "medium",
          }}
        >
          Color Coding:
        </Text>
        <Select
          value={colorKey}
          onChange={(value) => setColorKey(value as ColorKey)}
          data={[
            { value: "none", label: "None" },
            { value: "department", label: "By Department" },
            { value: "level", label: "By Course Level" },
          ]}
          style={{
            width: "100%",
            marginBottom: "1.5rem",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
          }}
        />
        <Button
          onClick={onAutofill}
          fullWidth
          style={{
            backgroundColor: "primary",
            color: "white",
            fontSize: "sm",
            padding: "0.5rem 1rem",
            borderRadius: "md",
            boxShadow: "sm",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "primary-dark";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "primary";
          }}
        >
          Autofill Plan
        </Button>
      </Box>
    </Box>
  );
}

