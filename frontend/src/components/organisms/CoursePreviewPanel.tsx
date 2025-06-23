import { Course, CourseDetails } from '@/types/plan';
import { Box, Text, Stack, Group, Dialog, Skeleton, Flex } from '@mantine/core';
import { useContext, useState, useEffect } from 'react';
import { BarChart } from '../atoms/course-preview/barchart';
import { AreaChart } from '../atoms/course-preview/areachart';
import { PreviewContext, PreviewPosition } from '@/contexts/PreviewContext';
import { getCourseDetails } from '@/types/planHandlers';

const mapPositionToCoords = (pos: PreviewPosition | null) => {
  const DEFAULT_MARGIN = 20;
  
  switch (pos) {
    case 'top-left':
      return { top: DEFAULT_MARGIN, left: DEFAULT_MARGIN };
    case 'top-right':
      return { top: DEFAULT_MARGIN, right: DEFAULT_MARGIN };
    case 'bottom-left':
      return { bottom: DEFAULT_MARGIN, left: DEFAULT_MARGIN };
    case 'bottom-right':
      return { bottom: DEFAULT_MARGIN, right: DEFAULT_MARGIN };
    case 'top':
      return { top: DEFAULT_MARGIN, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom':
      return { bottom: DEFAULT_MARGIN, left: '50%', transform: 'translateX(-50%)' };
    case 'left':
      return { left: DEFAULT_MARGIN, top: '50%', transform: 'translateY(-50%)' };
    case 'right':
      return { right: DEFAULT_MARGIN, top: '50%', transform: 'translateY(-50%)' };
    default:
      return { bottom: DEFAULT_MARGIN, right: DEFAULT_MARGIN }; // Default fallback
  }
};

export default function CoursePreviewPanel() {
  const { persistCourses, tempCourse } = useContext(PreviewContext);

  // Combine persistent and temporary previews
  const allPreviews = [
    ...persistCourses,
    ...(tempCourse ? [tempCourse] : []),
  ];

  return (
    <>
      {allPreviews.map((entry, index) => {
        const { course, pos } = entry;
        const coords = mapPositionToCoords(pos);
        const commonStyle = {
          position: 'fixed' as const,
          ...coords,
          width: '47.5%',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          pointerEvents: 'auto' as const,
          boxShadow: entry === tempCourse
            ? 'none'
            : '0 0 0 4px rgba(209, 99, 145, 0.25), 0 6px 18px rgba(0, 0, 0, 0.1)',
          border: entry === tempCourse
            ? '1px solid #ccc'
            : '1px solid #811331',
          transition: 'all 0.2s ease',
        };

        // Show skeleton if full details not yet loaded
        if (!('campus' in course)) {
          return (
            <Dialog 
              key={`skeleton-${entry === tempCourse ? 'temp' : 'persist'}-${course.id}`} 
              opened={true}
              withCloseButton={false}
              withinPortal={false}
              style={commonStyle}
            >
              <Stack gap="md">
                <Skeleton height={28} width="40%" radius="sm" />
                <Skeleton height={20} width="60%" radius="sm" />
                <Box style={{ width: '100%', height: '1px', backgroundColor: '#E5E5E5' }} />
                <Group justify="space-between" style={{ width: '100%' }}>
                  <Stack gap="xs" style={{ flexGrow: 1 }}>
                    <Skeleton height={16} width="25%" radius="sm" />
                    <Skeleton height={16} width="30%" radius="sm" />
                    {/* <Group gap="xs" style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: '0.95rem', color: '#555' }}>
                        <strong>Credits:</strong>
                      </Text>
                      <Skeleton height={16} width="10%" radius="sm" />
                    </Group>
                    <Group gap="xs" style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: '0.95rem', color: '#555' }}>
                        <strong>Total # of Students:</strong>
                      </Text>
                      <Skeleton height={16} width="15%" radius="sm" />
                    </Group> */}
                  </Stack>
                  {/* <Group align="center" style={{ flexShrink: 0 }}>
                    <Skeleton height={48} width={80} radius="sm" />
                    <Skeleton height={48} width={80} radius="sm" />
                  </Group> */}
                </Group>
                <Skeleton height={16} width="90%" radius="sm" />
                {/* <Group gap="xs" style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: '0.95rem', color: '#555' }}>
                    <strong>Description:</strong>
                  </Text>
                  <Skeleton height={16} width="90%" radius="sm" />
                </Group> */}
                <Skeleton height={16} width="85%" radius="sm" />
                <Skeleton height={16} width="75%" radius="sm" />
              </Stack>
            </Dialog>
          );
        }

        // Render full preview once CourseDetails is available
        return (
          <Dialog
            key={`preview-${entry === tempCourse ? 'temp' : 'persist'}-${course.id}`}
            opened={true}
            withCloseButton={false}
            withinPortal={false}
            style={commonStyle}
          >
            <Stack gap="md" style={{ alignItems: 'flex-start' }}>
              <Text style={{ fontSize: '1.375rem', fontWeight: 700, color: '#800000' }}>
                {course.dept_abbr} {course.course_num}
              </Text>
              <Text style={{ fontSize: '1.125rem', fontWeight: 500, color: '#333' }}>
                {course.class_desc}
              </Text>
              <Box style={{ width: '100%', height: '1px', backgroundColor: '#E5E5E5' }} />

              <Group justify="space-between" style={{ width: '100%' }}>
                <Stack gap="xs" style={{ flexGrow: 1 }}>
                  <Text style={{ fontSize: '0.95rem', color: '#555' }}>
                    <strong>Credits:</strong>{' '}
                    {course.cred_min === course.cred_max
                      ? course.cred_min
                      : `${course.cred_min} - ${course.cred_max}`}
                  </Text>
                  <Text style={{ fontSize: '0.95rem', color: '#555' }}>
                    <strong>Total # of Students:</strong> {course.total_students}
                  </Text>
                </Stack>
                <Group align="center" style={{ flexShrink: 0 }}>
                  <BarChart
                    distribution={{
                      grades: typeof course.total_grades === 'string'
                        ? JSON.parse(course.total_grades)
                        : course.total_grades,
                      isSummary: false,
                    }}
                    isMobile={false}
                  />
                  <AreaChart
                    distribution={{
                      grades: typeof course.total_grades === 'string'
                        ? JSON.parse(course.total_grades)
                        : course.total_grades,
                      isSummary: false,
                    }}
                    isMobile={false}
                  />
                </Group>
              </Group>

              <Text style={{ fontSize: '0.95rem', color: '#555' }}>
                <strong>Description:</strong> {course.onestop_desc}
              </Text>
            </Stack>
          </Dialog>
        );
      })}
    </>
  );
}