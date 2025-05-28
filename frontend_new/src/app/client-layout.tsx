"use client";

import Link from "next/link";
import { Provider } from "@/components/ui/provider"
import { Box, Container, Flex, Text } from "@chakra-ui/react";
import GlobalSearchLayout from "@/components/GlobalSearchLayout";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Provider>
      <Box
        backgroundImage="url('/your-image.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bg: "rgba(169, 0, 0, 0.5)", // dark overlay
          backdropFilter: "blur(4px)",
          zIndex: -1,
        }}
      >
        {(pathname.startsWith("/plan")) && (
          <GlobalSearchLayout>
            {children}
          </GlobalSearchLayout>
        )}
        {pathname === "/" || pathname.startsWith("/info") ? children : null}
      </Box>
    </Provider>
  );
}