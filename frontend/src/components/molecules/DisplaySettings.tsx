"use client";

import { ColorKey } from "@/types/plan";
import {
  Box,
  Button,
  Text,
  SegmentedControl,
  MultiSelect,
  SimpleGrid,
  ActionIcon,
  Paper
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import theme from "@/styles/theme";
import { useContext, useState, useRef, useEffect } from "react";
import { DisplaySettingsContext } from "@/contexts/DisplaySettingsContext";

type Props = {
  opened: boolean;
  onClose: () => void;
};

const BOX_HEIGHT = 400; // Adjust if your box is taller/shorter

export default function DisplaySettings({ opened, onClose }: Props) {
  const { colorKey, setColorKey } = useContext(DisplaySettingsContext);
  const [hiddenSemesters, setHiddenSemesters] = useState<string[]>([]);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const wasOpened = useRef(false);

  // Set initial position to bottom left when opened
  useEffect(() => {
    if (opened && !wasOpened.current) {
      setPosition({
        x: 24,
        y: window.innerHeight - BOX_HEIGHT - 24,
      });
      wasOpened.current = true;
    }
    if (!opened) {
      wasOpened.current = false;
    }
  }, [opened]);

  if (!opened) return null;

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const onMouseUp = () => {
    dragging.current = false;
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  return (
    <Paper
      shadow="lg"
      radius="md"
      withBorder
      onMouseDown={onMouseDown}
      style={{
        position: "fixed",
        zIndex: 2000,
        width: "min(400px, 90vw)",
        backgroundColor: "#fff",
        padding: "2rem 1.5rem 1.5rem 1.5rem",
        minWidth: 320,
        left: position.x,
        top: position.y,
        userSelect: dragging.current ? "none" : "auto",
        cursor: "move",
      }}
    >
      <ActionIcon
        onClick={onClose}
        style={{ position: "absolute", top: 12, right: 12, zIndex: 10, cursor: "pointer" }}
        size="lg"
        variant="subtle"
        aria-label="Close display settings"
      >
        <IconX size={22} />
      </ActionIcon>
      <Text
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#811331",
          textAlign: "left",
          marginBottom: "1.5rem",
        }}
      >
        Display Settings
      </Text>
      <SimpleGrid cols={1} spacing="lg" style={{ fontSize: "0.9rem", color: "#555" }}>
        <Box>
          <Text style={{ marginBottom: "0.5rem", fontWeight: 500 }}>Color Coding:</Text>
          <SegmentedControl
            fullWidth
            value={colorKey}
            onChange={(value) => setColorKey(value as any)}
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
            Autofill Plan
          </Button>
        </Box>
      </SimpleGrid>
    </Paper>
  );
}
