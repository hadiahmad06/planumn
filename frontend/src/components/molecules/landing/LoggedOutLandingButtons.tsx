"use client";

import VideoPopup from "@/components/atoms/landing/VideoPopup";
import { Button, Group } from "@mantine/core";
import { IconEdit, IconUpload } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function LoggedOutLandingButtons() {
    const router = useRouter();
    const [hoverLeft, setHoverLeft] = useState(false);
    const [hoverRight, setHoverRight] = useState(false);

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
                marginRight: hoverLeft ? "0.6rem" : "0.2rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                transform: hoverLeft ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.3s ease, margin-right 0.3s ease",
            }}
            onClick={() => (
                router.push("/plan/import")
            )}
            onMouseEnter={() => setHoverLeft(true)}
            onMouseLeave={() => setHoverLeft(false)}
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
                marginLeft: hoverRight ? "0.4rem" : undefined,
                transform: hoverRight ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.3s ease, margin-left 0.3s ease",
            }}
            onClick={() => (
                router.push("/plan/new")
            )}
            onMouseEnter={() => setHoverRight(true)}
            onMouseLeave={() => setHoverRight(false)}
            >
            Start from Scratch
            </Button>
        </Button.Group>
        <VideoPopup/>
        </Group>
    )
};