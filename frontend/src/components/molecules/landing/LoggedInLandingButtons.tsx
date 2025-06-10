"use client";

import VideoPopup from "@/components/atoms/landing/VideoPopup";
import { Button, Group, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconUpload, IconBook2, IconFolderOpen } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function LoggedInLandingButtons() {
    const router = useRouter();
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
                            marginRight: "0.2rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                        }}
                        onClick={() => (
                            router.push("/plan/import")
                        )}
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
                            marginRight: "0.2rem",
                        }}
                        onClick={() =>
                            notifications.show({
                            color: "#811331",
                            title: 'Unadded Feature',
                            message: 'We are working on the program catalog page. Please check back later!',
                            })
                        }
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
                        }}
                        onClick={() => (
                            router.push("/plan/new")
                        )}
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
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)" }}
                    onClick={() =>
                        notifications.show({
                        color: "#811331",
                        title: 'Unadded Feature',
                        message: 'High priority feature! Will be added very soon twin',
                        })
                    }
                >
                    My Plans
                </Button>
                <VideoPopup />
            </Group>
        </Stack>
    );
}