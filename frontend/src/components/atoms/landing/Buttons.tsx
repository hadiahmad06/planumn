"use client";

import { Button, ButtonProps } from "@mantine/core";
import { IconEdit, IconUpload, IconBook2, IconFolderOpen } from "@tabler/icons-react";

interface LandingButtonProps extends ButtonProps {
    onClick: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export function ImportTranscriptButton({ onClick, style, onMouseEnter, onMouseLeave, ...props }: LandingButtonProps) {
    return (
        <Button
            leftSection={<IconUpload size={18} />}
            variant="gradient"
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                ...style
            }}
            {...props}
        >
            Import Transcript
        </Button>
    );
}

export function StartFromScratchButton({ onClick, style, onMouseEnter, onMouseLeave, ...props }: LandingButtonProps) {
    return (
        <Button
            leftSection={<IconEdit size={18} />}
            variant="gradient"
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                ...style
            }}
            {...props}
        >
            Start from Scratch
        </Button>
    );
}

export function ProgramCatalogButton({ onClick, style, onMouseEnter, onMouseLeave, ...props }: LandingButtonProps) {
    return (
        <Button
            leftSection={<IconBook2 size={18} />}
            variant="gradient"
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                ...style
            }}
            {...props}
        >
            View Program Catalog
        </Button>
    );
}

export function MyPlansButton({ onClick, style, onMouseEnter, onMouseLeave, ...props }: LandingButtonProps) {
    return (
        <Button
            leftSection={<IconFolderOpen size={18} />}
            variant="outline"
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ 
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)",
                ...style
            }}
            {...props}
        >
            My Plans
        </Button>
    );
}