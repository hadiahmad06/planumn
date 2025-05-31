"use client";

import "@/styles/global.css"; // make sure this path is correct
import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import Link from "next/link";

export default function Home() {
  return (
    <Box
      position="relative"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      // bgGradient="linear(to-br, #f8fafc, white, #eff6ff)"
      overflow="hidden"
    >
      {/* Background decorations */}
      <Box
        position="absolute"
        inset="0"
        zIndex={-1}
        // bg="gray.100"
        // style={{
        //   maskImage: "linear-gradient(0deg, white, rgba(255,255,255,0.6))",
        //   WebkitMaskImage: "linear-gradient(0deg, white, rgba(255,255,255,0.6))",
        // }}
      />
      <Box
        position="absolute"
        top="5rem"
        left="2.5rem"
        w="18rem"
        h="18rem"
        bg="#fddede"
        borderRadius="full"
        opacity={0.2}
        filter="blur(80px)"
        animation="float 6s ease-in-out infinite"
        zIndex={-1}
      />
      <Box
        position="absolute"
        bottom="5rem"
        right="2.5rem"
        w="24rem"
        h="24rem"
        bg="#fff7cc"
        borderRadius="full"
        opacity={0.2}
        filter="blur(80px)"
        animation="float 6s ease-in-out infinite"
        zIndex={-1}
        style={{ animationDelay: "1s" }}
      />

      <Container maxW="4xl" textAlign="center" zIndex="1" px={4}>
        <VStack gap={6}>
          <Box>
            <Heading
              as="h1"
              fontSize={["4xl", "6xl"]}
              fontWeight="bold"
              color="#0f172a"
              mb={2}
            >
              <Box
                as="span"
                fontFamily="mono"
                color="#811331"
                display="inline-flex"
                alignItems="center"
                className="animate-typing"
                whiteSpace="nowrap"
                overflow="hidden"
              >
                planu.mn
                <Box
                  as="span"
                  className="blinking-cursor"
                  ml="1"
                  w="1px"
                  h="1.2em"
                  bg="#811331"
                />
              </Box>
            </Heading>
            <Text
              fontSize={["lg", "2xl"]}
              color="#334155"
              fontWeight="light"
              mt={2}
            >
              plan your graduation
            </Text>
          </Box>

          <Text fontSize="xl" maxW="2xl" color="#475569">
            The fast, visual graduation planner built by UMN students, for UMN students.
            Replace the clunky official Grad Planner with drag-and-drop course planning.
          </Text>

          <Stack
            direction={["column", "row"]}
            gap={4}
            justify="center"
            align="center"
            pt={4}
          >
            <Button
              size="lg"
              bg="#811331"
              _hover={{ bg: "#600f28" }}
              color="white"
              px={8}
              py={6}
              fontSize="lg"
              fontWeight="semibold"
              borderRadius="xl"
              boxShadow="lg"
              onClick={() => (window.location.href = "/plan/hadi2025")}
            >
              Try Live Demo →
            </Button>
            <Button
              variant="outline"
              size="lg"
              px={8}
              py={6}
              fontSize="lg"
              borderRadius="xl"
              border="2px solid"
              bg="white"
              borderColor="gray.500"
              
              _hover={{
                bg: "gray.200",
              }}
            >
              <Text as="span" fontSize="lg" fontWeight="semibold" color="gray.700">
                ▶ Watch Demo
              </Text>
            </Button>
          </Stack>

          <HStack
            gap={8}
            color="#64748b"
            fontSize="sm"
            pt={8}
            className="animate-fade-in-up"
          >
            <HStack>
              <Box w={2} h={2} bg="green.500" borderRadius="full" className="animate-pulse" />
              <Text>Live course data</Text>
            </HStack>
            <HStack>
              <Box w={2} h={2} bg="blue.500" borderRadius="full" className="animate-pulse" />
              <Text>SRT scores included</Text>
            </HStack>
            <HStack>
              <Box w={2} h={2} bg="#811331" borderRadius="full" className="animate-pulse" />
              <Text>Built by students</Text>
            </HStack>
          </HStack>
        </VStack>
      </Container>
      {/* Bottom bar with privacy/contact and images/names */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        width="100%"
        py={4}
        px={8}
        bg="rgba(255, 255, 255, 0.95)"
        borderTop="1px solid #e2e8f0"
        display="flex"
        flexDirection="column"
        alignItems="center"
        zIndex={2}
      >
        <HStack justify="center" gap={8} mb={2}>
          <Link href="/info/privacy" passHref legacyBehavior>
          <Button as="a" color="#811331" fontWeight="bold" textAlign="center">
              Privacy
            </Button>
          </Link>
          <Link href="/info/contact" passHref legacyBehavior>
            <Button as="a" color="#811331" fontWeight="bold" textAlign="center">
              Contact
            </Button>
          </Link>
        </HStack>
      </Box>
    </Box>
  );
}
