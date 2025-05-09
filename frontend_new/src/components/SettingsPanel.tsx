"use client";

import { Box, Button, Text } from "@chakra-ui/react";

type Props = {
  colorByDepartment: boolean;
  colorByLevel: boolean;
  setColorByDepartment: (b: boolean) => void;
  setColorByLevel: (b: boolean) => void;
  onAutofill: () => void;
};

export default function SettingsPanel({
  colorByDepartment,
  colorByLevel,
  setColorByDepartment,
  setColorByLevel,
  onAutofill,
}: Props) {
  const handleColorModeChange = (value: string) => {
    if (value === "department") {
      setColorByDepartment(true);
      setColorByLevel(false);
    } else if (value === "level") {
      setColorByLevel(true);
      setColorByDepartment(false);
    } else {
      setColorByDepartment(false);
      setColorByLevel(false);
    }
  };

  return (
    <Box
      width={64}
      bg="white"
      border="1px"
      borderColor="border"
      shadow="sm"
      rounded="lg"
      p={4}
      height="fit-content"
      position="sticky"
      top={8}
    >
      <Text fontSize="lg" fontWeight="semibold" mb={4} color="foreground">Settings</Text>
      <Box fontSize="sm" color="secondary">
        <Text mb={2} fontWeight="medium">Color Coding:</Text>
        <select
          value={colorByDepartment ? "department" : colorByLevel ? "level" : "none"}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleColorModeChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginBottom: '1.5rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border)',
            backgroundColor: 'white',
            fontSize: '0.875rem',
          }}
        >
          <option value="none">None</option>
          <option value="department">By Department</option>
          <option value="level">By Course Level</option>
        </select>
        <Button
          onClick={onAutofill}
          width="full"
          bg="primary"
          _hover={{ bg: "primary-dark" }}
          color="white"
          fontSize="sm"
          py={2}
          px={4}
          rounded="md"
          shadow="sm"
        >
          Autofill Plan
        </Button>
      </Box>
    </Box>
  );
}

