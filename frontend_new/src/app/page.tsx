"use client";

import Link from "next/link";
import { Box, Button, Container, Flex, Grid, Heading, Text, VStack } from "@chakra-ui/react";

export default function Home() {
  return (
    <Container maxW="container.xl" py={12} minH="100vh" display="flex" flexDirection="column" justifyContent="space-between">
      <VStack align="stretch" gap={12} flex="1">
        {/* Hero Section */}
        <Box as="section" textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            Plan Your Academic Journey with <Text as="span" color="primary">PlanUMN</Text>
          </Heading>
          <Text fontSize="lg" color="secondary" maxW="2xl" mx="auto" mb={6}>
            Simplify your graduation planning with a tool designed for UMN students. Stay on track and graduate with confidence.
          </Text>
          <Link href="/plan">
            <Button
              size="lg"
              bg="primary"
              color="white"
              _hover={{ bg: "primary-dark" }}
              px={8}
              py={4}
              shadow="md"
              borderRadius="full"
            >
              Get Started
            </Button>
          </Link>
        </Box>

        {/* Features Section */}
        <Box as="section" py={12} borderRadius="lg">
          <Heading as="h2" size="xl" textAlign="center" mb={8}>Why Choose PlanUMN?</Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            {[
              {
                title: "Smart Course Planning",
                description: "Easily create and manage your academic plan with a user-friendly interface tailored for UMN students."
              },
              {
                title: "Stay On Track",
                description: "Monitor your progress and ensure you meet all graduation requirements with ease."
              },
              {
                title: "Make Informed Decisions",
                description: "Access detailed course information to make the best choices for your academic future."
              }
            ].map((feature, index) => (
              <Box key={index} p={6} bg="white" borderRadius="lg" shadow="sm" _hover={{ shadow: "md" }}>
                <Heading as="h3" size="md" mb={3}>{feature.title}</Heading>
                <Text color="secondary">{feature.description}</Text>
              </Box>
            ))}
          </Grid>
        </Box>
      </VStack>

      {/* Call to Action Section */}
      <Box as="section" textAlign="center" py={12}>
        <Heading as="h2" size="xl" mb={4}>Ready to Start Planning?</Heading>
        <Text fontSize="lg" color="secondary" maxW="lg" mx="auto" mb={6}>
          Join thousands of UMN students who have successfully planned their academic journey with PlanUMN.
        </Text>
        <Link href="/plan">
          <Button
            size="lg"
            bg="primary"
            color="white"
            _hover={{ bg: "primary-dark" }}
            px={8}
            py={4}
            shadow="md"
            borderRadius="full"
          >
            Create Your Plan
          </Button>
        </Link>
      </Box>
    </Container>
  );
}
