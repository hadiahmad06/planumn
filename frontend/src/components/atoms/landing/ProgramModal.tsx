"use client"

import programOptions from "@/lib/programOptions.json";
import {Modal, MultiSelect, Button} from "@mantine/core";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProgramModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function ProgramModal({ opened, onClose }: ProgramModalProps) {
  const [selectedProgram, setSelectedProgram] = useState<string[] | undefined>(undefined);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedProgram || selectedProgram.length === 0) return;

    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programGroupIds: selectedProgram }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch program data');
      }

      const result = await response.json();
      console.log("Fetched program data:", result.data);
    } catch (error) {
      console.error("Error fetching program data:", error);
    }

  };

  return (

    <Modal opened={opened} onClose={onClose} centered>
      <MultiSelect
        data={programOptions}
        searchable
        placeholder="What Program r u in twin?"
        value={selectedProgram}
        onChange={setSelectedProgram}
      />
      <Button
          bg={"red"}
        fullWidth
        mt="md"
        disabled={!selectedProgram}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </Modal>
  );
}