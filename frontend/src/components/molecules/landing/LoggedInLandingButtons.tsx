"use client";

import { useState } from "react";
import VideoPopup from "@/components/atoms/landing/VideoPopup";
import { Button, Group, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconUpload, IconBook2, IconFolderOpen } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function LoggedInLandingButtons() {
    const router = useRouter();
    const [hovered, setHovered] = useState([false, false, false]);
    const [hoveredPlans, setHoveredPlans] = useState(false);
    return (
        <Stack gap="sm" justify="center" align="center">
            <Group justify="center" gap="lg" style={{ paddingTop: "1rem" }}>
                <Button.Group>
                    <Button
                        leftSection={<IconUpload size={18} />}
                        variant="gradient"
                        gradient={{ from: "#6B102C", to: "#9D3D5F", deg: 90 }}
                        size="lg"
                        style={{
                            borderTopLeftRadius: "1rem",
                            borderBottomLeftRadius: "1rem",
                            borderTopRightRadius: "0.25rem",
                            borderBottomRightRadius: "0.25rem",
                            marginRight: hovered[0] ? "0.6rem" : "0.2rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                            transform: hovered[0] ? "scale(1.05)" : "scale(1)",
                            transition: "transform 0.2s ease, margin-right 0.2s ease",
                        }}
                        onClick={() => (
                            router.push("/plan/import")
                        )}
                        onMouseEnter={() => {
                            setHovered(prev => {
                                const updated = [...prev];
                                updated[0] = true;
                                return updated;
                            });
                        }}
                        onMouseLeave={() => {
                            setHovered(prev => {
                                const updated = [...prev];
                                updated[0] = false;
                                return updated;
                            });
                        }}
                    >
                        Import Transcript
                    </Button>
                    <Button
                        leftSection={<IconBook2 size={18} />}
                        variant="gradient"
                        gradient={{ from: "#9D3D5F", to: "#C96D94", deg: 90 }}
                        size="lg"
                        style={{
                            borderRadius: "0.25rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                            marginLeft: hovered[1] ? "0.4rem" : undefined,
                            marginRight: hovered[1] ? "0.6rem" : "0.2rem",
                            transform: hovered[1] ? "scale(1.05)" : "scale(1)",
                            transition: "transform 0.2s ease, margin-left 0.2s ease, margin-right 0.2s ease",
                        }}
                        onClick={() =>
                            notifications.show({
                            color: "#811331",
                            title: 'Unadded Feature',
                            message: 'We are working on the program catalog page. Please check back later!',
                            })
                        }
                        onMouseEnter={() => {
                            setHovered(prev => {
                                const updated = [...prev];
                                updated[1] = true;
                                return updated;
                            });
                        }}
                        onMouseLeave={() => {
                            setHovered(prev => {
                                const updated = [...prev];
                                updated[1] = false;
                                return updated;
                            });
                        }}
                    >
                        View Program Catalog
                    </Button>
                    <Button
                        leftSection={<IconEdit size={18} />}
                        variant="gradient"
                        gradient={{ from: "#C96D94", to: "#E78AB4", deg: 90 }}
                        size="lg"
                        style={{
                            borderTopRightRadius: "1rem",
                            borderBottomRightRadius: "1rem",
                            borderTopLeftRadius: "0.25rem",
                            borderBottomLeftRadius: "0.25rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                            marginLeft: hovered[2] ? "0.4rem" : undefined,
                            transform: hovered[2] ? "scale(1.05)" : "scale(1)",
                            transition: "transform 0.2s ease, margin-left 0.2s ease",
                        }}
                        onClick={() => (
                            router.push("/plan/new")
                        )}
                        onMouseEnter={() => {
                            setHovered(prev => {
                                const updated = [...prev];
                                updated[2] = true;
                                return updated;
                            });
                        }}
                        onMouseLeave={() => {
                            setHovered(prev => {
                                const updated = [...prev];
                                updated[2] = false;
                                return updated;
                            });
                        }}
                    >
                        Start from Scratch
                    </Button>
                </Button.Group>
            </Group>
            <Group justify="center" gap="sm" style={{ paddingTop: "1rem" }}>
                <Button
                    leftSection={<IconFolderOpen size={18} />}
                    variant="outline"
                    size="lg"
                    style={{ 
                    borderRadius: "1rem", 
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)",
                    transform: hoveredPlans ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.2s ease"
                    }}
                    onClick={() =>
                        notifications.show({
                        color: "#811331",
                        title: 'Unadded Feature',
                        message: 'High priority feature! Will be added very soon twin',
                        })
                    }
                    onMouseEnter={() => setHoveredPlans(true)}
                    onMouseLeave={() => setHoveredPlans(false)}
                >
                    My Plans
                </Button>
                <VideoPopup />
            </Group>
        </Stack>
    );
}