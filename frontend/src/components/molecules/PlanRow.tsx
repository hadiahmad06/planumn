import { Paper, Text, Box, Loader, Progress, Space } from "@mantine/core";
import { IconTrash, IconRecycle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { PlanNullable } from "@/types/plan";
import { MouseEvent, useContext, useState } from "react";
import { MobileContext } from "@/contexts/MobileContext";

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
  const { isMobile } = useContext(MobileContext);
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
        padding: isMobile ? "6px 6px" : "12px 12px",
        backgroundColor: bgColor,
        transition: "padding 0.25s, box-shadow 0.25s, background-color 0.25s",
        cursor: isDeleted ? "default" : "pointer",
        gridTemplateColumns: isMobile ? "27.5% 2.5% 25% 5% 30% 7.5% 2.5%" : "27.5% 2.5% 15% 5% 10% 10% 10% 10% 5% 5%",
      }}
      onClick={(e: MouseEvent) => {
        if (isDeleted || (e.target as HTMLElement).dataset.trash === "true") return;
        router.push(`/plan/${plan.id}`);
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.padding = isMobile ? "12px 6px" : "30px 12px";
        el.style.boxShadow = "0 0px 4px 2px rgba(0,0,0,0.1)";
        el.style.backgroundColor = index % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(220,220,220,0.6)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.padding = isMobile ? "6px 6px" : "12px 12px";
        el.style.boxShadow = "0 0px 4px rgba(0,0,0,0.1)";
        el.style.backgroundColor = bgColor;
      }}
    >
      <Text fw={600} size={isMobile ? "sm" : "md"} truncate="end" c={plan.title === "" ? "dimmed" : undefined}>
        {plan.title === "" ? "Unnamed Plan" : plan.title}
      </Text>
      <Space/>
      {isDeleted && plan.deletion_scheduled_at ? (
        <Text size="sm" c="red">
          {new Date(plan.deletion_scheduled_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </Text>
      ) : (
        <Box style={{margin: "4px 0", display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && 
            <Text size="sm" fw={700} c="#811331" style={{ width: 32, textAlign: "right" }}>
                {percent}%
            </Text>
          }
          <Progress
            value={percent}
            color="#811331"
            size={isMobile ? "md" : "xl"}
            bg="#d0d0d0"
            style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)", flex: 1 }}
          />
        </Box>
      )}
      <Space/>
      {!isMobile && <>
        <Text size="sm">
            <span style={{ fontWeight: 500 }}>{courseCount}</span>{" "}
            <span style={{ color: "#868e96" }}>courses</span>
        </Text>
        <Text size="sm">
            <span style={{ fontWeight: 500 }}>{creditCount}</span>{" "}
            <span style={{ color: "#868e96" }}>credits</span>
        </Text>
      </>}
      <Text size="sm" c="dimmed">
        {new Date(plan.last_updated).toLocaleDateString(undefined, {
          year: "numeric", month: "short", day: "numeric",
        })}
      </Text>
      {!isMobile && 
        <Text size="sm" c="dimmed">
            {new Date(plan.created_at).toLocaleDateString(undefined, {
            year: "numeric", month: "short", day: "numeric",
            })}
        </Text>
      }
      <Box>
        {isDeleted ? (
          <Box
            component="button"
            style={{
              width: isMobile ? "20px" : "32px",
              height: isMobile ? "20px" : "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              background: "transparent",
              padding: 0,
              marginLeft: "auto",
              transition: "transform 0.15s ease, color 0.2s ease",
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
            {buttonLoading ? <Loader size={isMobile ? 20 : 32 } color="gray" /> : <IconRecycle color="gray" />}
          </Box>
        ) : (
          <Box
            component="button"
            style={{
              width: isMobile ? "20px" : "32px",
              height: isMobile ? "20px" : "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              background: "transparent",
              padding: 0,
              marginLeft: "auto",
              transition: "transform 0.15s ease, color 0.2s ease",
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
            {buttonLoading ? <Loader size={isMobile ? 20 : 32 } color="gray" /> : <IconTrash color="gray" />}
          </Box>
        )}
      </Box>
    </Paper>
  );
}