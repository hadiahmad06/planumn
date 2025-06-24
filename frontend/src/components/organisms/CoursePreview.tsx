import { CourseDetails } from "@/types/plan"
import { Stack, Text, Box, Group, CloseButton, Collapse } from "@mantine/core"
import { BarChart } from "../atoms/course-preview/barchart"
import { AreaChart } from "../atoms/course-preview/areachart"
import { CoursePreview, HydratedPreview, PreviewContext, PreviewPosition } from "@/contexts/PreviewContext"

export const mapPositionToCoords = (pos: PreviewPosition | null) => {
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

function getPreviewStyle(pos: PreviewPosition, temp: boolean): React.CSSProperties {
  const coords = mapPositionToCoords(pos);
  return {
    position: 'fixed',
    ...(temp ? coords : {}),
    width: temp ? '47.5%' : '25%',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    pointerEvents: 'auto',
    boxShadow: temp
      ? 'none'
      : '0 0 0 4px rgba(209, 99, 145, 0.25), 0 6px 18px rgba(0, 0, 0, 0.1)',
    border: temp
      ? '1px solid #ccc'
      : '1px solid #811331',
    transition: 'all 0.2s ease',
    zIndex: 1000,
  };
}

function GradeChartsRow({ course, temp }: { course: CourseDetails; temp: boolean }) {
  return (
    <Group
      justify="flex-end"
      style={{
        display: "flex",
        flexWrap: 'nowrap',
        width: temp ? '80%' : '100%',
        height: temp ? 70 : 50,
        gap: 16,
        alignItems: 'stretch'
      }}
    >
      <Box style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <BarChart
          distribution={{
            grades: typeof course.total_grades === 'string'
              ? JSON.parse(course.total_grades)
              : course.total_grades,
            isSummary: false,
          }}
          isMobile={false}
        />
      </Box>
      <Box style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <AreaChart
          distribution={{
            grades: typeof course.total_grades === 'string'
              ? JSON.parse(course.total_grades)
              : course.total_grades,
            isSummary: false,
          }}
          isMobile={false}
        />
      </Box>
    </Group>
  );
}

type CoursePreviewEntryProps = {
  entry: HydratedPreview;
  temp: boolean;
  // ref?: RefObject<HTMLDivElement | null>
};

export function CoursePreviewEntry({ entry, temp,}: CoursePreviewEntryProps) {
  const { removePersistPreview } = useContext(PreviewContext);
  const { course, pos } = entry;
  const commonStyle = getPreviewStyle(pos, temp);
  const [descHover, setDescHover] = useState(false);

  function enableHover() {
    setDescHover(true);
  }

  function disableHover() {
    setDescHover(false);
  }
  const [ opened, { toggle } ] = useDisclosure(false);

  return (
    <Box key={`preview-${temp ? "temp-" : "persist-"}${course.id}`} className="drag-handle" style={commonStyle}>
      <Stack 
        gap="sm" 
        style={{ alignItems: 'flex-start' }} 
        onPointerOver={enableHover}
        onPointerLeave={disableHover}
      >
        <Group justify="space-between" align="center" style={{ width: '100%', flexWrap: "nowrap" }}>
          <Stack gap="0.2rem" style={{ minWidth: '40%'}}>
            <Group justify="space-between" style={{ width: '100%' }}>
              <Group gap="0">
                <Text style={{ fontSize: '1.375rem', fontWeight: 700, color: '#800000' }}>
                  {course.dept_abbr} {course.course_num} 
                </Text>
                {!temp && (
                  <Text style={{ fontSize: '1.125rem', fontWeight: 600, color: '#800000' }}>
                    &nbsp;– {course.cred_min === course.cred_max ? course.cred_min : `${course.cred_min}-${course.cred_max}`} cr
                  </Text>
                )}
              </Group>
              {!temp && (
              <CloseButton
                onClick={() => removePersistPreview(course.id)}
                size="lg"
              />
              )}
            </Group>
            <Text style={{ fontSize: '1.125rem', fontWeight: 500, color: '#333' }}>
              {course.class_desc}
            </Text>
          </Stack>
          {temp && <GradeChartsRow course={course} temp={temp} />}
        </Group>
        <Box style={{ width: '100%', height: '1px', backgroundColor: '#E5E5E5' }} />

        <Group 
          justify="space-between" 
          style={{ 
            width: '100%', 
            flexWrap: temp ? 'wrap' : 'wrap'
          }}
        >
          {!temp && <GradeChartsRow course={course} temp={temp} />}
          <Box style={{ width: '100%' }}>
            <Group justify="flex-start" onClick={temp ? undefined : toggle} style={{ cursor: 'pointer' }}>
              <Text style={{
                  fontSize: '0.95rem', 
                  color: '#555', 
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
              }}>
                  Description:
                  {!temp && <IconChevronUp
                  size={16}
                  style={{
                      transform: opened ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                  }}
                  />}
              </Text>
            </Group>
            <Collapse in={temp || opened || descHover} transitionDuration={500} transitionTimingFunction="ease">
              <Text style={{ fontSize: '0.95rem', color: '#555' }}>
                {course.onestop_desc}
              </Text>
            </Collapse>
          </Box>
        </Group>
      </Stack>
    </Box>
    // </div>
  )
}

import { Skeleton } from "@mantine/core";
import { RefObject, useContext, useState } from "react"
import { useDisclosure } from "@mantine/hooks"
import { FiChevronDown } from "react-icons/fi"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"

type CoursePreviewSkeletonProps = {
  entry: CoursePreview;
  temp: boolean;
};

export function CoursePreviewSkeleton({ entry, temp }: CoursePreviewSkeletonProps) {
  const { course, pos } = entry;
  const commonStyle = getPreviewStyle(pos, temp);

  return (
    <Box key={`skeleton-${temp ? "temp-" : "persist-"}${course.id}`} className="drag-handle" style={commonStyle}>
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
    </Box>
  );
}