import { Modal, Button, Text, Stack } from '@mantine/core';
import {useContext, useState} from "react";
import {UserSessionContext} from "@/contexts/data/UserSessionContext";
import {Plan, PlanNullable} from "@/types/plan";

interface ClearDeletedPlansProps {
  deletedPlans: PlanNullable[];
  opened: boolean;
  onClose: () => void;
}

export default function ClearDeletedPlans({ opened, onClose, deletedPlans}: ClearDeletedPlansProps) {


  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="md"
      padding="md"
      size="md"
    >
      <Stack>
          <Text size="md"  ta="center">
              ⚠️ Proceed with Caution Twin! ⚠️
          </Text>
        <Text size="sm">
          Are you sure you want to permanently delete all deleted plans?
        </Text>
        <Button
          color="red"
          onClick={async () => {
            if (deletedPlans.length === 0) {
              alert("You already have no deleted plans!");
              return;
            }

            await Promise.all(
              deletedPlans.map(plan =>
                fetch("/api/plan/delete", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ planId: plan.id, force: true }),
                })
              )
            );
            window.location.reload();
          }}
          fullWidth
        >
          Yes, delete all
        </Button>
      </Stack>
    </Modal>
  );
}
