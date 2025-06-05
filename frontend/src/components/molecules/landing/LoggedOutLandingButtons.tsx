"use client";

import VideoPopup from "@/components/atoms/VideoPopup";
import { Button, Group } from "@mantine/core";
import { IconEdit, IconUpload } from "@tabler/icons-react";


export default function LoggedOutLandingButtons() {
    return (
        <Group
        justify="center"
        gap="lg"
        style={{ paddingTop: "1rem" }}
        >
        <Button.Group>
            <Button
            leftSection={<IconUpload size={18} />}
            variant="gradient"
            gradient={{ from: "#6B102C", to: "#C15D8E", deg: 90 }}
            size="lg"
            style={{
                borderTopLeftRadius: "1rem",
                borderBottomLeftRadius: "1rem",
                borderTopRightRadius: "0.25rem",
                borderBottomRightRadius: "0.25rem",
                marginRight: "0.2rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            }}
            onClick={() => (window.location.href = "/plan/import")}
            >
            Import Transcript
            </Button>
            <Button
            leftSection={<IconEdit size={18} />}
            variant="gradient"
            gradient={{ from: "#C15D8E", to: "#E78AB4", deg: 90 }}
            size="lg"
            style={{
                borderTopRightRadius: "1rem",
                borderBottomRightRadius: "1rem",
                borderTopLeftRadius: "0.25rem",
                borderBottomLeftRadius: "0.25rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            }}
            onClick={() => (window.location.href = "/plan")}
            >
            Start from Scratch
            </Button>
        </Button.Group>
        <VideoPopup/>
        </Group>
    )
};