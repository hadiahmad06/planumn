"use client";

import { Box, Container, Flex, Text } from '@mantine/core';
import Link from 'next/link';
import GlobalSearchLayout from '@/components/organisms/GlobalSearchLayout';
import { usePathname } from 'next/navigation';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import AuthButton from '@/components/molecules/AuthButton';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  console.log(`Rendering ClientLayout with pathname: ${pathname}`);

  let content;
  if (pathname.startsWith('/plan')) {
    content = <GlobalSearchLayout>{children}</GlobalSearchLayout>;
  } else if (pathname === '/' || pathname.startsWith('/info')) {
    content = children;
  }

  return (
    // <Provider>
      <Box
          // background: 
          //   `radial-gradient(circle at 20% 30%, rgba(255, 203, 245, 0.3), transparent 60%),
          //   radial-gradient(circle at 80% 20%, rgba(203, 235, 255, 0.25), transparent 50%),
          //   linear-gradient(135deg, #fce4ec, #f3e5f5)`,
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
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            zIndex: 0,
          }}
        />
        <Flex
          justify="space-between"
          align="center"
          style={{ padding: '16px', position: 'relative', zIndex: 1 }}
        >
          {content}
          <Box style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <AuthButton />
          </Box>
        </Flex>
        <SpeedInsights />
        <Analytics />
      </Box>
    // </Provider>
  );
}