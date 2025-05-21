"use client";

import Link from "next/link";
import { Provider } from "@/components/ui/provider"
import { Box, Container, Flex, Text } from "@chakra-ui/react";
import GlobalSearch from "@/components/GlobalSearch";
import GlobalSearchLayout from "@/components/GlobalSearchLayout";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <GlobalSearchLayout>
        {children}
      </GlobalSearchLayout>
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
              <Link href="/privacy">
                <Text fontSize="sm" color="maroon.500" _hover={{ color: "maroon.600" }} transition="color 0.2s">
                  Privacy Policy
                </Text>
              </Link>
              <Link href="/terms">
                <Text fontSize="sm" color="maroon.500" _hover={{ color: "maroon.600" }} transition="color 0.2s">
                  Terms of Service
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Provider>
  );
} 