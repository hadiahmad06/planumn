"use client";

import Link from "next/link";
import { Box, Button, Container, Flex, Grid, Heading, Text, VStack } from "@chakra-ui/react";

export default function Home() {
  return (
    <Container maxW="container.xl">
      <VStack align="stretch" gap={8}>
        <Box as="section" py={12} textAlign="center">
          <Heading as="h1" size="2xl" mb={6}>
            Plan Your Academic Journey with <Text as="span" color="primary">Planumn</Text>
          </Heading>
          <Text fontSize="xl" color="secondary" maxW="2xl" mx="auto" mb={8}>
            A graduation planning tool built for UMN students. Plan your courses, stay on track, and graduate with clarity.
          </Text>
          <Link href="/plan">
            <Button
              size="lg"
              bg="primary"
              color="white"
              _hover={{ bg: "primary-dark" }}
              px={8}
              py={4}
              shadow="sm"
            >
              Get Started
            </Button>
          </Link>
        </Box>

        <Box as="section" py={12} bg="white">
          <Heading as="h2" size="xl" textAlign="center" mb={12}>Why Choose Planumn?</Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8}>
            <Box p={6} rounded="lg" bg="card" border="1px" borderColor="border" shadow="sm" _hover={{ shadow: "md" }}>
              <Heading as="h3" size="md" mb={3}>Smart Course Planning</Heading>
              <Text color="secondary">
                Create and manage your academic plan with an intuitive interface designed for UMN students.
              </Text>
            </Box>
            <Box p={6} rounded="lg" bg="card" border="1px" borderColor="border" shadow="sm" _hover={{ shadow: "md" }}>
              <Heading as="h3" size="md" mb={3}>Stay On Track</Heading>
              <Text color="secondary">
                Visualize your progress and ensure you're meeting all graduation requirements.
              </Text>
            </Box>
            <Box p={6} rounded="lg" bg="card" border="1px" borderColor="border" shadow="sm" _hover={{ shadow: "md" }}>
              <Heading as="h3" size="md" mb={3}>Make Informed Decisions</Heading>
              <Text color="secondary">
                Access course information and make better choices for your academic future.
              </Text>
            </Box>
          </Grid>
        </Box>

        <Box as="section" py={12} bg="white">
          <Container textAlign="center">
            <Heading as="h2" size="xl" mb={6}>Ready to Start Planning?</Heading>
            <Text fontSize="xl" color="secondary" mb={8}>
              Join thousands of UMN students who have already planned their academic journey with Planumn.
            </Text>
            <Link href="/plan">
              <Button
                size="lg"
                bg="primary"
                color="white"
                _hover={{ bg: "primary-dark" }}
                px={8}
                py={4}
                shadow="sm"
              >
                Create Your Plan
              </Button>
            </Link>
          </Container>
        </Box>
      </VStack>
    </Container>
  );
}
