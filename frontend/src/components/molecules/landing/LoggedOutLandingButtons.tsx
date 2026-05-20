"use client";

import { useEffect, useState } from "react";
import VideoPopup from "@/components/atoms/landing/VideoPopup";
import { Button, Group } from "@mantine/core";
import { useRouter } from "next/navigation";
import { ImportTranscriptButton, StartFromScratchButton } from "@/components/atoms/landing/Buttons";
import { useMobile } from "@/contexts/visual/MobileProvider";

export default function LoggedOutLandingButtons() {
    const { isMobile } = useMobile();
    const router = useRouter();
    
    const [hoverLeft, setHoverLeft] = useState(false);
    const [hoverRight, setHoverRight] = useState(false);

    return (
        <Group justify="center" gap="lg" style={{ paddingTop: "1rem" }}>
            <Button.Group>
                <ImportTranscriptButton
                    gradient={{ from: "var(--rose-800)", to: "var(--rose-500)", deg: 90 }}
                    size={isMobile ? "sm" : "lg"}
                    style={{
                        borderTopLeftRadius: "1rem",
                        borderBottomLeftRadius: "1rem",
                        borderTopRightRadius: "0.25rem",
                        borderBottomRightRadius: "0.25rem",
                        marginRight: hoverLeft ? "0.6rem" : "0.2rem",
                        transform: hoverLeft ? "scale(1.05)" : "scale(1)",
                        transition: "transform 0.3s ease, margin-right 0.3s ease",
                    }}
                    onClick={() => router.push("/plan/import")}
                    onMouseEnter={() => setHoverLeft(true)}
                    onMouseLeave={() => setHoverLeft(false)}
                />
                <StartFromScratchButton
                    gradient={{ from: "var(--rose-500)", to: "var(--rose-300)", deg: 90 }}
                    size={isMobile ? "sm" : "lg"}
                    style={{
                        borderTopRightRadius: "1rem",
                        borderBottomRightRadius: "1rem",
                        borderTopLeftRadius: "0.25rem",
                        borderBottomLeftRadius: "0.25rem",
                        marginLeft: hoverRight ? "0.4rem" : undefined,
                        transform: hoverRight ? "scale(1.05)" : "scale(1)",
                        transition: "transform 0.3s ease, margin-left 0.3s ease",
                    }}
                    onClick={() => router.push("/plan/new")}
                    onMouseEnter={() => setHoverRight(true)}
                    onMouseLeave={() => setHoverRight(false)}
                />
            </Button.Group>
            <VideoPopup buttonSize={isMobile ? "sm" : "lg"}/>
        </Group>
    );
}