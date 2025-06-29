"use client";

import { Box, Container, Flex, Group, Text } from '@mantine/core';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import AuthButton from '@/components/molecules/authentication/AuthenticationModal';
import { useContext, useEffect, useState } from 'react';
import ProfileDropdown from '@/components/molecules/authentication/ProfileDropdown';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { PlanContext } from '@/contexts/data/PlanContext';
import { UserSessionContext } from '@/contexts/data/UserSessionContext';
import CoursePreviewPanel from '@/components/organisms/CoursePreviewPanel';
import { PreviewProvider } from '@/contexts/visual/PreviewProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const {plan} = useContext(PlanContext);
  const {user, session} = useContext(UserSessionContext);

  const handleDragEnd = (result: DropResult) => {
      if (!result.destination) return;
  
      // Forward the drag end event to the plan page if we're on a plan page
      // if (pathname.startsWith('/plan')) {
        window.postMessage({ type: 'DRAG_END', result }, '*');
      // }
    };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <PreviewProvider>
        <Box
          style={{
            position: 'relative',
            backgroundImage: 'url("/images/backgroundblur.png")',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            minHeight: '100vh',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 0,
            }}
          />
          <Flex
            justify="space-between"
            align="center"
            style={{ 
              // padding: '16px', 
              position: 'relative', 
              zIndex: 1 
            }}
          >
            {children}
            <Box style={{ position: 'absolute', top: '16px', right: '16px' }}>
              {user && session ? <ProfileDropdown /> : <AuthButton />}
            </Box>
          </Flex>
          <Box style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
            <CoursePreviewPanel/>
          </Box>
          <SpeedInsights />
          <Analytics />
        </Box>
      </PreviewProvider>
    </DragDropContext>
  );
}