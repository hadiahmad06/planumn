import { Anchor, Box } from "@mantine/core";
import { useState, useEffect } from "react";
import { useRouter } from "next/compat/router";


export default function AnimatedTypingText() {
  const router = useRouter(); 
  const [displayed, setDisplayed] = useState("");
  const fullText = "planu.mn";
  const delays = [150, 85, 105, 70, 80, 120, 95, 60];
  useEffect(() => {
    let i = -1;
    let timeout: any;

    const typeNext = () => {
      if (i < fullText.length-1) {
        i++;
        setDisplayed((prev) => prev + fullText[i]);
        timeout = setTimeout(typeNext, delays[i]);
      }
    };

    typeNext();

    return () => clearTimeout(timeout);
  }, []);

  return (
    // <Link
    //   href="https://planu.mn" passHref>
        <Box
            component="span"
            style={{
                fontFamily: "monospace",
                color: "#811331",
                display: "inline-block",
                borderRight: "2px solid #811331",
                paddingRight: "0.25rem",
                animation: "blink .75s step-end infinite",
            }}
            onClick={() => {
              if (router) {
                router.push("/");
              }
            }}
            >
            {displayed}
        </Box>
    // </Link>
  );
}
