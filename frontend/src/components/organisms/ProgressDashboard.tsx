"use client";

import { Box, Progress, Stack, Text, Title, Card, Grid, Badge, Group } from '@mantine/core';
import { IconCheck, IconClock, IconX, IconBook, IconStar } from '@tabler/icons-react';
import { useContext } from 'react';
import { PlanAuditContext } from '@/contexts/data/PlanAuditContext';
import { PlanContext } from '@/contexts/data/PlanContext';
import styles from './progressDashboard.module.css';

export default function ProgressDashboard() {
  const { requirementCompletion, reqGroups } = useContext(PlanAuditContext);
  const { plan } = useContext(PlanContext);

  const requisites = reqGroups["requisitesSimple"] || [];

  const calculateOverallStats = () => {
    const total = requisites.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    for (const req of requisites) {
      const completion = requirementCompletion[req.id];
      if (completion) {
        if (completion.completed) {
          completed++;
        } else if (completion.completionPercentage > 0) {
          inProgress++;
        } else {
          notStarted++;
        }
      }
    }

    const overallPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, notStarted, overallPercentage };
  };

  const calculateCourseStats = () => {
    let totalRequired = 0;
    let totalEarned = 0;
    let totalRequiredCredits = 0;
    let totalEarnedCredits = 0;

    for (const [key, completion] of Object.entries(requirementCompletion)) {
      if (completion) {
        totalRequired += completion.requiredCourses;
        totalEarned += completion.earnedCourses;
        totalRequiredCredits += completion.requiredCredits;
        totalEarnedCredits += completion.earnedCredits;
      }
    }

    const coursePercentage = totalRequired > 0 ? Math.round((totalEarned / totalRequired) * 100) : 0;
    const creditPercentage = totalRequiredCredits > 0 ? Math.round((totalEarnedCredits / totalRequiredCredits) * 100) : 0;

    return {
      totalRequired,
      totalEarned,
      totalRequiredCredits,
      totalEarnedCredits,
      coursePercentage,
      creditPercentage,
    };
  };

  const overallStats = calculateOverallStats();
  const courseStats = calculateCourseStats();

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <Card padding="md" radius="md" withBorder shadow="sm" className={styles.statCard}>
      <Group justify="space-between" align="flex-start" mb="xs">
        <Box style={{ color }}>
          {icon}
        </Box>
        <Badge color={color} variant="light">
          {title}
        </Badge>
      </Group>
      <Title order={3}>{value}</Title>
      {subtitle && (
        <Text size="sm" c="dimmed" mt="xs">
          {subtitle}
        </Text>
      )}
    </Card>
  );

  return (
    <Box className={styles.dashboard} p="md" mb="md">
      <Title order={4} mb="md">Overall Progress</Title>

      <Grid>
        <Grid.Col span={12}>
          <Card padding="lg" radius="md" withBorder shadow="sm" className={styles.overallCard}>
            <Group justify="space-between" mb="sm">
              <Text size="lg" fw={600}>Overall Completion</Text>
              <Badge size="xl" color={overallStats.overallPercentage === 100 ? 'green' : overallStats.overallPercentage > 0 ? 'yellow' : 'gray'}>
                {overallStats.overallPercentage}%
              </Badge>
            </Group>
            <Progress
              value={overallStats.overallPercentage}
              color={overallStats.overallPercentage === 100 ? 'green' : overallStats.overallPercentage > 0 ? 'yellow' : 'gray'}
              size="xl"
              radius="md"
            />
            <Text size="sm" c="dimmed" mt="xs">
              {overallStats.completed} of {overallStats.total} requirements completed
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Completed"
            value={overallStats.completed}
            subtitle={`${Math.round(overallStats.total > 0 ? (overallStats.completed / overallStats.total) * 100 : 0)}% of total`}
            icon={<IconCheck size={24} />}
            color="green"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="In Progress"
            value={overallStats.inProgress}
            subtitle={`${Math.round(overallStats.total > 0 ? (overallStats.inProgress / overallStats.total) * 100 : 0)}% of total`}
            icon={<IconClock size={24} />}
            color="yellow"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Not Started"
            value={overallStats.notStarted}
            subtitle={`${Math.round(overallStats.total > 0 ? (overallStats.notStarted / overallStats.total) * 100 : 0)}% of total`}
            icon={<IconX size={24} />}
            color="gray"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total"
            value={overallStats.total}
            subtitle="All requirements"
            icon={<IconStar size={24} />}
            color="blue"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card padding="md" radius="md" withBorder shadow="sm" className={styles.courseCard}>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Courses Progress</Text>
              <IconBook size={20} />
            </Group>
            <Progress
              value={courseStats.coursePercentage}
              color="blue"
              size="md"
              radius="md"
              mb="xs"
            />
            <Group justify="space-between">
              <Text size="sm">{courseStats.totalEarned} planned</Text>
              <Text size="sm" c="dimmed">of {courseStats.totalRequired} required</Text>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card padding="md" radius="md" withBorder shadow="sm" className={styles.creditCard}>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Credits Progress</Text>
              <IconStar size={20} />
            </Group>
            <Progress
              value={courseStats.creditPercentage}
              color="grape"
              size="md"
              radius="md"
              mb="xs"
            />
            <Group justify="space-between">
              <Text size="sm">{courseStats.totalEarnedCredits} planned</Text>
              <Text size="sm" c="dimmed">of {courseStats.totalRequiredCredits} required</Text>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
}