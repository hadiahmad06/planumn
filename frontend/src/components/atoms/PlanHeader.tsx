import { PlanContext } from "@/contexts/data/PlanContext";
import { Box, Flex, Skeleton, Title, Text, MultiSelect } from "@mantine/core";
import { useContext, useState, useEffect, useRef } from "react";
import { formatDistance, formatDistanceToNow, isAfter } from "date-fns";
import { UserSessionContext } from "@/contexts/data/UserSessionContext";
import { useRouter } from "next/navigation";
import programOptions from "@/lib/programOptions.json";
import { PlanAuditContext } from "@/contexts/data/PlanAuditContext";

export default function PlanHeader() {
  const planContext = useContext(PlanContext);
  const { groupedPrograms, programIds, setProgramIds, onUpdate } = useContext(PlanAuditContext);
  if (!planContext.plan) return <Skeleton w="90%"/>;

  const { plan, setPlan, changesSaved, retryCount, setRetryCount, error } = planContext;
  const { session } = useContext(UserSessionContext);

  const [titleLocal, setTitleLocal] = useState('');
  const [inputWidth, setInputWidth] = useState(1);
  const [hoveredInput, setHoveredInput] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const placeholder = "Edit Plan Title";

  const [isProgramSelectorFocused, setIsProgramSelectorFocused] = useState<boolean>(false);

  useEffect(() => {
    if (plan) {
      setTitleLocal(plan.title);
    }
  }, [plan]);

  useEffect(() => {
    if (spanRef.current) setInputWidth(spanRef.current.offsetWidth + 2);
  }, [titleLocal]);

  return (
    <Flex
      style={{
        width: '100%',
        marginBottom: '1.5rem',
        justifyContent: 'flex-end',
      }}
      >
      <Box style={{ textAlign: 'right' }}>
        <form>
          <div style={{ position: "relative", width: "100%" }}>
            <div
              onMouseEnter={() => setHoveredInput(true)}
              onMouseLeave={() => setHoveredInput(false)}
            >
              <input 
                type="text" 
                name="title"
                placeholder={placeholder}
                value={titleLocal}
                onChange={(e) => setTitleLocal(e.target.value)}
                onBlur={() => setPlan({ ...plan, title: titleLocal })}
                maxLength={32}
                style={{
                  background: "none",
                  border: "none",
                  boxShadow: "none",
                  outline: "none",
                  margin: 0,
                  font: "inherit",
                  color: "inherit",
                  maxWidth: "100%",
                  minWidth: "1ch",
                  marginBottom: "0.25rem",
                  fontWeight: 700,
                  fontSize: "1.5rem",
                  cursor: "text",
                  borderBottom: "1px dashed gray",
                  paddingBottom: "2px",
                  padding: 0,
                  textAlign: "right",
                  width: inputWidth,
                  transition: "transform 0.2s ease",
                  transform: hoveredInput ? "scale(1.05)" : "none",
                }}
              />
            </div>
            <span
              ref={spanRef}
              style={{
                visibility: "hidden",
                position: "absolute",
                whiteSpace: "pre",
                font: "inherit",
                fontWeight: 700,
                fontSize: "1.5rem",
                padding: 0,
                margin: 0,
                border: "none",
                boxSizing: "content-box",
              }}
            >
              {titleLocal || placeholder}
            </span>
          </div>
        </form>
        {/*  */}
        <MultiSelect
          // onFocus={() => setIsProgramSelectorFocused(true)}
          onBlur={onUpdate}
          data={programOptions}
          searchable
          aria-label="Add Programs Here" //brotisserie chicken we need to add accessibility stuff eventually prob
          placeholder={programIds.length===0 ? "Select a program" : ""}
          value={programIds}
          onChange={setProgramIds}
        />
        {!session ? (
        <Text
          size="md"
          c="#811331"
        >
          You must be logged in to Save to Cloud
        </Text>
        ) : (
          <Text size="md">
            {retryCount > 5 ? (
              <Text
                style={{ color: "#811331" }}
              >
                Saving disabled due to repeated failures (limit reached).
              </Text>
            ) : error ? (
              <Text
                onClick={() => setRetryCount(retryCount + 1)}
                style={{ color: "#811331", textDecoration: "underline", cursor: "pointer" }}
              >
                {error}
              </Text>
            ) : changesSaved && plan.last_updated !== null ? (() => {

              // now using TIMESTAMPTZ instead of TIMESTAMP, so no manual logic required.
              // const offset = new Date().getTimezoneOffset();
              // const now = new Date(Date.now() + offset * 60 * 1000);
              return isAfter(Date.now(), plan.last_updated)
                ? `Saved ${formatDistanceToNow(plan.last_updated, { addSuffix: true })}`
                : "Saved just now."
            })() 
              : "Saving..." 
            }
          </Text>
        )}
      </Box>
    </Flex>
  );
}