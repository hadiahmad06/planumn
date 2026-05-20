import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Title, Stack, Paper } from '@mantine/core';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import ReactPlayer from 'react-player';

interface VideoPopupProps {
  buttonSize?: string;
}

export default function VideoPopup({ buttonSize }: VideoPopupProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        size="auto"
        centered
        withCloseButton
        radius="md"
        overlayProps={{ blur: 10, backgroundOpacity: 0.4 }}
        transitionProps={{ transition: 'fade', duration: 200 }}
      >
        <ReactPlayer
            url={"/videos/video-modal.mp4"}
            controls
            width="100%"
            height="100%"
            playing
            muted
            autoPlay
        />
      </Modal>

      <Button
        onClick={open}
        leftSection={<IconPlayerPlayFilled size={18} />}
        variant="outline"
        color="var(--text-secondary)"
        size={buttonSize ?? "lg"}
        style={{
          borderRadius: "1rem",
        }}
      >
        {"Watch Demo"}
      </Button>
    </>
  );
}