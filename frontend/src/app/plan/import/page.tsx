"use client";

import { Box, Group, Text, Button, FileButton } from '@mantine/core';
import { useEffect, useState } from 'react';

export default function PlanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState("");

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

        const data = await res.json();
        if (data.text) {
          setParsedText(data.text);
        } else {
          setParsedText("Failed to parse text.");
        }
      } catch (error) {
        setParsedText("Error uploading file.");
        console.error(error);
      }
    };

    uploadFile();
  }, [file]);

  return (
    <>
      <Group justify="center">
        <FileButton onChange={setFile} accept="/pdf">
          {(props) => <Button {...props}>Upload File</Button>}
        </FileButton>
      </Group>

      {file && (
        <>
          <Text size="sm" ta="center" mt="sm">
            Picked file: {file.name}
          </Text>
          {parsedText && (
            <Text size="sm" ta="center" mt="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {parsedText}
            </Text>
          )}
        </>
      )}
    </>
  );
}