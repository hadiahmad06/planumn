import { Modal, Text, Stack, Select, Button } from "@mantine/core";
import { useState } from "react";

type SemesterModalProps = {
  opened: boolean;
  onClose: () => void;
};

export default function SemesterModal({ opened, onClose }: SemesterModalProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string | null>(currentYear.toString());
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  // Generate next 6 years as options
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear + i).toString(),
    label: (currentYear + i).toString()
  }));

  const semesterOptions = [
    { value: "fall", label: "🍂 Fall" },
    { value: "spring", label: "🌱 Spring" },
    { value: "summer", label: "☀️ Summer" }
  ];

  const handleAddSemester = () => {
    console.log("Adding semester", selectedYear, selectedSemester);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Semester"
      centered
      size="sm"
    >
      <Stack gap="md">
        <Select
          label="Academic Year"
          placeholder="Select year"
          data={yearOptions}
          value={selectedYear}
          onChange={setSelectedYear}
          withScrollArea
        />
        <Select
          label="Semester"
          placeholder="Select semester"
          data={semesterOptions}
          value={selectedSemester}
          onChange={setSelectedSemester}
          withScrollArea
        />
        <Button
            onClick={handleAddSemester}
            disabled={!selectedYear || !selectedSemester}
            fullWidth
            style={{
              backgroundColor: "#811331",
              color: "#fff",
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#5e0f27";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#811331";
            }}
          >
            Add Semester
        </Button>
      </Stack>
    </Modal>
  );
}