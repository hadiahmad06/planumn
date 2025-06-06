import { Anchor, Box } from "@mantine/core";
import { useState, useEffect } from "react";
import { useRouter } from "next/compat/router";


export default function AnimatedTypingText({ blink = true }: { blink?: boolean }) {
  const router = useRouter(); 
  const [displayed, setDisplayed] = useState("");
  const [blinking, setBlinking] = useState(true);
  const fullText = "planu.mn";
  const delays = [150, 85, 105, 70, 80, 120, 95, 60];

  useEffect(() => {
    let i = -1;
    let timeout: any;
    let stopBlinkTimeout: any;

    const typeNext = () => {
      if (i < fullText.length - 1) {
        i++;
        setDisplayed((prev) => prev + fullText[i]);
        timeout = setTimeout(typeNext, delays[i]);
      }
    };

    typeNext();

    if (!blink) {
      const totalTypingTime = delays.reduce((sum, d) => sum + d, 0) + 500;
      stopBlinkTimeout = setTimeout(() => {
        setBlinking(false);
      }, totalTypingTime);
    }

    return () => {
      clearTimeout(timeout);
      clearTimeout(stopBlinkTimeout);
    };
  }, []);

  return (
    <>
      <Box
        component="span"
        style={{
          fontFamily: "monospace",
          color: "#811331",
          display: "inline-block",
          borderRight: blinking ? "2px solid #811331" : "none",
          paddingRight: "0.25rem",
          animation: blinking ? "blink .75s step-end infinite" : "none",
        }}
        onClick={() => {
          if (router) {
            router.push("/");
          }
        }}
      >
        {displayed}
      </Box>
      <style jsx global>{`
        @keyframes blink {
          50% {
            border-color: transparent;
          }
        }
      `}</style>
    </>
  );
}
