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
      {(pathname === "/" || pathname.startsWith("/plan")) && (
        <GlobalSearchLayout>
          {children}
        </GlobalSearchLayout>
      )}
      {pathname.startsWith("/info") && children}
      <Box as="footer" bg="white" borderTop="1px" borderColor="gold.200" py={8}>
        <Container maxW="1200px">
          <Flex 
            flexDirection={{ base: "column", md: "row" }} 
            justifyContent="space-between" 
            alignItems="center" 
            gap={4}
          >
            <Text fontSize="sm" color="maroon.500">
              © {new Date().getFullYear()} Planumn. All rights reserved.
            </Text>
            <Flex gap={4}>
              <Link href="/info/privacy">
                <Text fontSize="sm" color="maroon.500" _hover={{ color: "maroon.600" }} transition="color 0.2s">
                  Privacy Policy
                </Text>
              </Link>
              <Link href="/info/contact">
                <Text fontSize="sm" color="maroon.500" _hover={{ color: "maroon.600" }} transition="color 0.2s">
                  Contact Us
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Provider>
  );
}