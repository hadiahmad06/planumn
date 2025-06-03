"use client";

import PlanDisplay from '@/components/organisms/PlanDisplay';
import { Plan, PlanNullable, PlanDetails } from '@/types/plan';
import { getPlanDetails } from '@/types/planHandlers';
import { Box, Group, Text, Button, FileButton, Container, Center, Stack, Space } from '@mantine/core';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { useEffect, useState } from 'react';
import { IconUpload, IconPhoto, IconX, IconFileText } from '@tabler/icons-react';
import { error } from 'console';


export default function PlanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planState, setPlanState] = useState<PlanDetails | null>(null);


  useEffect(() => {
    if (!file) return;

    const uploadFile = async () => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/parseTranscript", {
          method: "POST",
          body: formData,
        });

        const incomplete = await res.json() as PlanNullable;
        const noCoursesFound = incomplete.semesters.every(semester => semester.courses.length === 0);
        if (incomplete.semesters.length === 0 || noCoursesFound) {
          setErrorMessage("Please ensure the file is a valid UMN Unofficial Transcript.");
          setFile(null);
          return;
        }
        const plan = {
          ...incomplete,
          id: "temp", // Temporary ID for display purposes
          createdAt: new Date(), // Use current date for display
        } as Plan;
        const planDetails = await getPlanDetails(plan);
        setPlanState(planDetails);
      } catch (error) {
        console.error(error);
      }
    };

    uploadFile();
  }, [file]);

  useEffect(() => {
    if (planState) {
      console.log("Parsed plan (updated state):", planState);
    }
  }, [planState]);

  return planState ? (
    <PlanDisplay 
      plan={planState} 
      setPlan={setPlanState} 
    />
  ) : (
    <>
      <Center
        w="100%"
        h="100%">
        <Dropzone
          w="100%"
          h="100%"
          multiple={false}
          style={{
            background: 'linear-gradient(135deg, rgba(209, 99, 145, 0.05), rgba(129, 19, 49, 0.02))',
            border: '2px solid rgba(209, 99, 145, 0.4)',
            borderRadius: '1.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onDrop={(files) => setFile(files[0])}
          onReject={(files) => console.log('Rejected files:', files)}
          accept={{ 'application/pdf': ['.pdf'] }}
        >
          <Stack align="center" justify="center" gap="md" style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload size={120} color="#811331" stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={120} color="#D16391" stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileText size={120} color="#D16391" stroke={1.5} />
            </Dropzone.Idle>
            <Text size="xl" ta="center" fw={600}>
              Drag or click to upload your UMN Unofficial Transcript
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Only PDF files are accepted. Max file size: 5MB
            </Text>
            <Box w="min(250px, 100%)">
              <Button
                w="100%"
                variant="gradient"
                gradient={{ from: "#811331", to: "#D16391", deg: 30 }}
                loading={file !== null}
                loaderProps={{ type: "dots" }}
                size="lg"
                leftSection={<IconUpload size={18} />}
              >
                Upload File
              </Button>
            </Box>
            {errorMessage && (
              <Text size="sm" c="red" ta="center">
                {errorMessage}
              </Text>
            )}
          </Stack>
        </Dropzone>
      </Center>
    </>
  );
}