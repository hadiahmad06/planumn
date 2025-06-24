import { Course, CourseDetails } from '@/types/plan';
import { Box, Text, Stack, Group, Dialog, Skeleton, Flex } from '@mantine/core';
import { useContext, useState, useEffect, useRef, RefObject, createRef } from 'react';
import { BarChart } from '../atoms/course-preview/barchart';
import { AreaChart } from '../atoms/course-preview/areachart';
import { HydratedPreview, PreviewContext, PreviewPosition } from '@/contexts/PreviewContext';
import { getCourseDetails } from '@/types/planHandlers';
import Draggable from 'react-draggable';
import { CoursePreviewEntry, CoursePreviewSkeleton, mapPositionToCoords } from './CoursePreview';

export default function CoursePreviewPanel() {
  const { persistCourses, tempCourse } = useContext(PreviewContext);

  // Combine persistent and temporary previews
  const allPreviews = [
    ...persistCourses,
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
              <CoursePreviewSkeleton entry={entry} temp={true}/>
            );
          }
          // full details
          return (
            <CoursePreviewEntry entry={entry as HydratedPreview} temp={true}/>
          );
        }

        // Persistent preview: draggable
        const initialX = typeof coords.left === 'number' ? coords.left : 0;
        const initialY = typeof coords.top === 'number' ? coords.top : 0;

        if (!('campus' in course)) {
          // skeleton inside Draggable
          return (
            <Draggable nodeRef={nodeRef} defaultPosition={{ x: initialX, y: initialY }} key={`skeleton-persist-${course.id}`}>
              <div
                ref={nodeRef}
                style={{
                  position: 'fixed',
                  zIndex: 1000,
                  ...coords,
                  width: '100%',
                }}
              >
                <CoursePreviewSkeleton entry={entry} temp={false}/>
              </div>
            </Draggable>
          );
        }

        // full details inside Draggable
        return (
          <Draggable nodeRef={nodeRef} defaultPosition={{ x: initialX, y: initialY }} key={`preview-persist-${course.id}`}>
            <div
              ref={nodeRef}
              style={{
                position: 'fixed',
                zIndex: 1000,
                ...coords,
                width: '100%',
              }}
            >
              <CoursePreviewEntry entry={entry as HydratedPreview} temp={false}/>
            </div>
          </Draggable>
        );
      })}
    </>
  );
}