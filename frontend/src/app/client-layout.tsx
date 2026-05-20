"use client";

import { Box, Flex } from '@mantine/core';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import AuthButton from '@/components/molecules/authentication/AuthenticationModal';
import { useContext } from 'react';
import ProfileDropdown from '@/components/molecules/authentication/ProfileDropdown';
import { UserSessionContext } from '@/contexts/data/UserSessionContext';
import CoursePreviewPanel from '@/components/organisms/CoursePreviewPanel';
import { PreviewProvider } from '@/contexts/visual/PreviewProvider';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, session } = useContext(UserSessionContext);
  const pathname = usePathname();

  // Plan view owns its own top bar (TopBar) and its own DragDropContext.
  // Suppress the global floating avatar on the plan view so it doesn't double up.
  const isPlanView = !!pathname?.startsWith('/plan/');

  return (
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
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children}
          {!isPlanView && (
            <Box style={{ position: 'absolute', top: '16px', right: '16px' }}>
              {user && session ? <ProfileDropdown /> : <AuthButton />}
            </Box>
          )}
        </Flex>
        <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <CoursePreviewPanel />
        </Box>
        <SpeedInsights />
        <Analytics />
      </Box>
    </PreviewProvider>
  );
}
