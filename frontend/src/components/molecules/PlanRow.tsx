import { Paper, Text, Box, Loader, Progress, Space } from "@mantine/core";
import { IconTrash, IconRecycle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { PlanNullable } from "@/types/plan";
import { MouseEvent, useState } from "react";

interface PlanRowProps {
  plan: PlanNullable;
  index: number;
  creditMap: Record<string, { id: number; cred_min: number; cred_max: number }>;
  onDelete?: (id: string) => void;
  isDeleted?: boolean;
  onClick?: () => void;
  onRecover?: (id: string) => void;
}

export default function PlanRow({ plan, index, creditMap, onDelete, isDeleted = false, onClick, onRecover }: PlanRowProps) {
  const router = useRouter();
  const [buttonLoading, setButtonLoading] = useState(false);

  const courseCount = plan.semesters.reduce((sum, sem) => sum + sem.courses.length, 0);
  const creditCount = plan.semesters.reduce(
    (sum, sem) =>
      sum +
      sem.courses.reduce((cSum, course) => cSum + (creditMap[course.id]?.cred_min ?? 0), 0),
    0
  );
  const bgColor = index % 2 === 0
    ? isDeleted ? "rgba(255,200,200,0.3)" : "rgba(255,255,255,0.3)"
    : isDeleted ? "rgba(255,180,180,0.3)" : "rgba(220,220,220,0.3)";

  const percent = Math.min(Math.round((creditCount / 120) * 100), 100);

  return (
    <Paper
      radius="md"
      key={plan.id}
      style={{
        boxShadow: "0 0px 4px rgba(0,0,0,0.1)",
        display: "grid",
        alignItems: "center",
        padding: "12px 12px",
        backgroundColor: bgColor,
        transition: "padding 0.25s, box-shadow 0.25s, background-color 0.25s",
        cursor: isDeleted ? "default" : "pointer",
        gridTemplateColumns: "30% 15% 5% 10% 10% 10% 10% 5% 5%",
      }}
      onClick={(e: MouseEvent) => {
        if (isDeleted || (e.target as HTMLElement).dataset.trash === "true") return;
        router.push(`/plan/${plan.id}`);
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.padding = "30px 12px";
        el.style.boxShadow = "0 0px 4px 2px rgba(0,0,0,0.1)";
        el.style.backgroundColor = index % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(220,220,220,0.6)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.padding = "12px 12px";
        el.style.boxShadow = "0 0px 4px rgba(0,0,0,0.1)";
        el.style.backgroundColor = bgColor;
      }}
    >
      <Text fw={600} size="md" truncate="end" c={plan.title === "" ? "dimmed" : undefined}>
        {plan.title === "" ? "Unnamed Plan" : plan.title}
      </Text>
      {isDeleted && plan.deletion_scheduled_at ? (
        <Text size="sm" c="red">
          {new Date(plan.deletion_scheduled_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </Text>
      ) : (
        <Box style={{ minWidth: 90, margin: "4px 0", display: "flex", alignItems: "center", gap: 8 }}>
          <Text size="sm" fw={700} c="#811331" style={{ width: 32, textAlign: "right" }}>
            {percent}%
          </Text>
          <Progress
            value={percent}
            color="#811331"
            size="xl"
            bg="#d0d0d0"
            style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)", flex: 1 }}
          />
        </Box>
      )}
      <Space/>
      <Text size="sm">
        <span style={{ fontWeight: 500 }}>{courseCount}</span>{" "}
        <span style={{ color: "#868e96" }}>courses</span>
      </Text>
      <Text size="sm">
        <span style={{ fontWeight: 500 }}>{creditCount}</span>{" "}
        <span style={{ color: "#868e96" }}>credits</span>
      </Text>
      <Text size="sm" c="dimmed">
        {new Date(plan.last_updated).toLocaleDateString(undefined, {
          year: "numeric", month: "short", day: "numeric",
        })}
      </Text>
      <Text size="sm" c="dimmed">
        {new Date(plan.created_at).toLocaleDateString(undefined, {
          year: "numeric", month: "short", day: "numeric",
        })}
      </Text>
      <Box>
        {isDeleted ? (
          <Box
            component="button"
            style={{
              width: "32px", height: "32px",
              display: "flex", border: "none",
              cursor: "pointer", background: "transparent", padding: 0,
              marginLeft: "auto", transition: "transform 0.15s ease, color 0.2s ease",
            }}
            data-trash="true"
            onClick={(e) => {
              e.stopPropagation();
              setButtonLoading(true);
              onRecover?.(plan.id!);
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            {buttonLoading ? <Loader size={32} color="gray" /> : <IconRecycle size={32} color="gray" />}
          </Box>
        ) : (
          <Box
            component="button"
            style={{
              width: "32px", height: "32px",
              display: "flex", border: "none",
              cursor: "pointer", background: "transparent", padding: 0,
              marginLeft: "auto", transition: "transform 0.15s ease, color 0.2s ease",
            }}
            data-trash="true"
            onClick={(e) => {
              e.stopPropagation();
              setButtonLoading(true);
              onDelete?.(plan.id!);
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            {buttonLoading ? <Loader size={32} color="gray" /> : <IconTrash size={32} color="gray" />}
          </Box>
        )}
      </Box>
    </Paper>
  );
}