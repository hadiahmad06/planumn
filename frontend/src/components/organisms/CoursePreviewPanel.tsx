import { Course, CourseDetails } from '@/types/plan';
import { Box, Text, Stack, Group, Dialog, Skeleton, Flex } from '@mantine/core';
import { useContext, useState, useEffect, useRef, RefObject, createRef } from 'react';
import { BarChart } from '../atoms/course-preview/barchart';
import { AreaChart } from '../atoms/course-preview/areachart';
import { HydratedPreview, PreviewContext, PreviewPosition } from '@/contexts/visual/PreviewContext';
import { getCourseDetails } from '@/types/planHandlers';
import Draggable from 'react-draggable';
import { CoursePreviewEntry, CoursePreviewSkeleton, getXYFromCoords, mapPositionToCoords } from './CoursePreview';

export default function CoursePreviewPanel() {
  const { persistCourses, tempCourse, focusPersistPreview } = useContext(PreviewContext);

  // Combine persistent and temporary previews
  const allPreviews = [
    ...Object.values(persistCourses).sort((a, b) => a.zIndex - b.zIndex),
    ...(tempCourse ? [tempCourse] : []),
  ];

  // Persist refs for each course.id across renders
  const nodeRefs = useRef<Record<string, RefObject<HTMLDivElement>>>({});

  return (
    <>
      {allPreviews.map((entry, index) => {
        const { course, pos } = entry;
        // Ensure nodeRef for this course.id exists
        if (!nodeRefs.current[course.id]) {
          nodeRefs.current[course.id] = createRef() as RefObject<HTMLDivElement>;
        }
        const nodeRef = nodeRefs.current[course.id];
        const coords = mapPositionToCoords(pos);

        if (entry === tempCourse) {
          // Temporary preview: fixed, no drag
          if (!('campus' in course)) {
            // skeleton
            return (
              <CoursePreviewSkeleton key={index} entry={entry} temp={true}/>
            );
          }
          // full details
          return (
            <CoursePreviewEntry key={index} entry={entry as HydratedPreview} temp={true}/>
          );
        }

        // Persistent preview: draggable
        const { x: initialX, y: initialY } = getXYFromCoords(coords);
        console.log(`${initialX}, ${initialY}`)

        return (
          <Draggable
            nodeRef={nodeRef}
            defaultPosition={{ x: initialX, y: initialY }}
            key={`preview-persist-${course.id}`}
            bounds={{
              left: 0,
              top: 0,
              right: window.innerWidth * 0.75,
              bottom: window.innerHeight * 0.9,
            }}
          >
            <div
              ref={nodeRef}
              style={{
                position: 'fixed',
                zIndex: 1000,
                width: '100%',
              }}
              onMouseDownCapture={() => focusPersistPreview(course.id)}
            >
              {'campus' in course ? (
                <CoursePreviewEntry key={index} entry={entry as HydratedPreview} temp={false} />
              ) : (
                <CoursePreviewSkeleton key={index} entry={entry} temp={false} />
              )}
            </div>
          </Draggable>
        );
      })}
    </>
  );
}