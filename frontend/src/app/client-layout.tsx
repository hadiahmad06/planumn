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
        style={{
          backgroundImage: "url('/your-image.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <Flex justify="space-between" align="center" style={{ padding: '16px' }}>
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