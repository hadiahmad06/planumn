import { Text, Paper, Stack, Center, Group, Button, Space } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { LuUserRoundX } from "react-icons/lu"
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { MobileContext } from "@/contexts/MobileContext";


export default function PromptWrapper({ children }: { children: React.ReactNode }) {
  const { isMobile } = useContext(MobileContext);

  return (
    !isMobile ? (
      <Center 
        w="100vw"
        h="100vh"
      >
        <Paper
          withBorder
          shadow="sm"
          radius="2rem"
          px={32}
          py={64}
          style={{
            backgroundColor: "#fff8f8",
            boxShadow: '0 0 0 4px rgba(209, 99, 145, 0.25), 0 6px 18px rgba(0, 0, 0, 0.1)',
            border:'1px solid #811331',
            textAlign: "center",
          }}
        >
          <Stack align="center">
            {children}
          </Stack>
        </Paper>
      </Center>
    ) : (
      <Center w="100vw" h="100vh">
        <Stack
          align="center"
          justify="center"
          style={{
            width: "80vw",
            height: "100vh",
            textAlign: "center",
          }}
        >
          {children}
        </Stack>
      </Center>
    )
  );
}