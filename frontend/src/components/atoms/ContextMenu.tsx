"use client";

import { Portal, Box, Flex, ActionIcon, Tooltip } from "@mantine/core";
import { useRef, useEffect } from "react";

export interface MenuButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

export interface MenuRow {
  buttons: MenuButton[];
}

interface ContextMenuProps {
  opened: boolean;
  onClose: () => void;
  rows: MenuRow[];
  position?: { x: number; y: number };
}

const ROW_HEIGHT = 36;

export default function ContextMenu({ opened, onClose, rows, position }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (opened) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [opened, onClose]);

  if (!opened) {
    return null;
  }

  return (
    <Portal>
      <Box
        ref={menuRef}
        onMouseDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
        style={{
          position: "fixed",
          left: position?.x ?? 0,
          top: position?.y ?? 0,
          zIndex: 1000,
          backgroundColor: "white",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          padding: "4px",
          minWidth: "180px",
        }}
      >
        {rows.map((row, rowIndex) => (
          <Flex key={rowIndex} gap="2px" style={{ marginBottom: rowIndex < rows.length - 1 ? "2px" : 0 }}>
            {row.buttons.map((button, buttonIndex) => (
              <Tooltip key={buttonIndex} label={button.label} position="top" withArrow offset={5}>
                <ActionIcon
                  size={ROW_HEIGHT - 8}
                  variant={button.color ? "filled" : "light"}
                  color={button.color || "gray"}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    event.preventDefault();
                    button.onClick();
                    onClose();
                  }}
                  disabled={button.disabled}
                  style={{
                    flex: 1,
                  }}
                >
                  {button.icon}
                </ActionIcon>
              </Tooltip>
            ))}
          </Flex>
        ))}
      </Box>
    </Portal>
  );
}