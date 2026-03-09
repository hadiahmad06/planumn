"use client";

import { Menu, Portal, ActionIcon } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

interface ContextMenuProps {
  opened: boolean;
  onClose: () => void;
  items: MenuItem[];
  position?: { x: number; y: number };
  trigger?: React.ReactNode;
}

export default function ContextMenu({ opened, onClose, items, position, trigger }: ContextMenuProps) {
  const menuContent = (
    <Menu.Dropdown>
      {items.map((item, index) => (
        <Menu.Item
          key={index}
          leftSection={item.icon}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          color={item.color}
          disabled={item.disabled}
        >
          {item.label}
        </Menu.Item>
      ))}
    </Menu.Dropdown>
  );

  if (trigger) {
    return (
      <Menu opened={opened} onChange={onClose} closeOnItemClick={false}>
        <Menu.Target>{trigger}</Menu.Target>
        <Portal>{menuContent}</Portal>
      </Menu>
    );
  }

  return (
    <Menu
      opened={opened}
      onChange={onClose}
      closeOnItemClick={false}
      position="bottom-start"
      offset={0}
    >
      <div
        style={{
          position: "fixed",
          left: position?.x ?? 0,
          top: position?.y ?? 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      >
        <Portal>{menuContent}</Portal>
      </div>
    </Menu>
  );
}