"use client";

import { useContext, useEffect, useState } from "react";
import VideoPopup from "@/components/atoms/landing/VideoPopup";
import { Button, Group, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { ImportTranscriptButton, ProgramCatalogButton, StartFromScratchButton, MyPlansButton } from "@/components/atoms/landing/Buttons";
import { useMobile } from "@/contexts/MobileProvider";

export default function LoggedInLandingButtons() {
    const router = useRouter();
    const [hovered, setHovered] = useState([false, false, false]);
    const [hoveredPlans, setHoveredPlans] = useState(false);
    const { isMobile } = useMobile();

    return (
        <Stack gap="0rem" justify="center" align="center">
            <Group justify="center" gap="lg" style={{ paddingTop: "1rem" }}>
                <Button.Group>
                    <ImportTranscriptButton
                        gradient={{ from: "#6B102C", to: isMobile ? "#C15D8E" : "#9D3D5F", deg: 90 }}
                        size={isMobile ? "sm" : "lg"}
                        style={{
                            borderTopLeftRadius: "1rem",
                            borderBottomLeftRadius: "1rem",
                            borderTopRightRadius: "0.25rem",
                            borderBottomRightRadius: "0.25rem",
                            marginRight: hovered[0] ? "0.6rem" : "0.2rem",
                            transform: hovered[0] ? "scale(1.05)" : "scale(1)",
                            transition: "transform 0.2s ease, margin-right 0.2s ease",
                        }}
                        onClick={() => router.push("/plan/import")}
                        onMouseEnter={() => setHovered(prev => [...prev, prev[0] = true])}
                        onMouseLeave={() => setHovered(prev => [...prev, prev[0] = false])}
                    />
                    {!isMobile && (
                      <ProgramCatalogButton
                          gradient={{ from: "#9D3D5F", to: "#C96D94", deg: 90 }}
                          size={isMobile ? "sm" : "lg"}
                          style={{
                              borderRadius: "0.25rem",
                              marginLeft: hovered[1] ? "0.4rem" : undefined,
                              marginRight: hovered[1] ? "0.6rem" : "0.2rem",
                              transform: hovered[1] ? "scale(1.05)" : "scale(1)",
                              transition: "transform 0.2s ease, margin-left 0.2s ease, margin-right 0.2s ease",
                          }}
                          onClick={() => notifications.show({
                              color: "#811331",
                              title: 'Unadded Feature',
                              message: 'We are working on the program catalog page. Please check back later!',
                          })}
                          onMouseEnter={() => setHovered(prev => [...prev, prev[1] = true])}
                          onMouseLeave={() => setHovered(prev => [...prev, prev[1] = false])}
                      />
                    )}
                    <StartFromScratchButton
                        gradient={{ from: isMobile ? "#C15D8E" : "#C96D94", to: "#E78AB4", deg: 90 }}
                        size={isMobile ? "sm" : "lg"}
                        style={{
                            borderTopRightRadius: "1rem",
                            borderBottomRightRadius: "1rem",
                            borderTopLeftRadius: "0.25rem",
                            borderBottomLeftRadius: "0.25rem",
                            marginLeft: hovered[2] ? "0.4rem" : undefined,
                            transform: hovered[2] ? "scale(1.05)" : "scale(1)",
                            transition: "transform 0.2s ease, margin-left 0.2s ease",
                        }}
                        onClick={() => router.push("/plan/new")}
                        onMouseEnter={() => setHovered(prev => [...prev, prev[2] = true])}
                        onMouseLeave={() => setHovered(prev => [...prev, prev[2] = false])}
                    />
                </Button.Group>
            </Group>
            <Group justify="center" gap="sm" style={{ paddingTop: "1rem" }}>
                <MyPlansButton
                    size={isMobile ? "sm" : "lg"}
                    style={{ 
                        borderRadius: "1rem",
                        transform: hoveredPlans ? "scale(1.05)" : "scale(1)",
                        transition: "transform 0.2s ease"
                    }}
                    onClick={() => notifications.show({
                        color: "#811331",
                        title: 'Unadded Feature',
                        message: 'High priority feature! Will be added very soon twin',
                    })}
                    onMouseEnter={() => setHoveredPlans(true)}
                    onMouseLeave={() => setHoveredPlans(false)}
                />
                <VideoPopup buttonSize={isMobile ? "sm" : "lg"}/>
            </Group>
        </Stack>
    );
}