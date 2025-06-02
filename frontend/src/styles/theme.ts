// import { ThemeConfig, extendBaseTheme } from "@chakra-ui/react";

const colors = {
  primary: "#007BFF", // Primary color for buttons and highlights
  primaryHover: "#0056b3", // Hover color for primary elements
  secondary: "#6c757d", // Secondary color for less emphasized elements
  secondaryHover: "#5a6268", // Hover color for secondary elements
  background: "rgba(255, 255, 255, 0.8)", // Translucent background for the main layout
  glassBackground: "rgba(255, 255, 255, 0.5)", // Translucent background for glass-like components
};

// Define reusable styles for components
export const cardStyles = {
  base: {
    bg: "rgba(0, 0, 0, 0.8)", // Translucent background for cards
    color: "black",
    p: 4,
    borderRadius: "md",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  glass: {
    bg: "rgba(0, 0, 0, 0.5)", // Translucent background for glass cards
    color: "black",
    p: 4,
    borderRadius: "md",
    boxShadow: "0 8px 12px rgba(0, 0, 0, 0.2)",
  },
};

export const buttonStyles = {
  base: {
    bg: "transparent", // Transparent background for buttons
    color: "white",
    _hover: {
      bg: "rgba(0, 0, 255, 0.2)",
    },
  },
  glass: {
    bg: "transparent", // Transparent background for glass buttons
    color: "white",
    _hover: {
      bg: "rgba(0, 0, 255, 0.3)",
    },
  },
};

export const globalSearchLayoutStyles = {
  container: {
    padding: 12,
    gap: 4,
    bg: "transparent", // Transparent background for layout
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderColor: "rgba(200, 200, 200, 0.5)",
    borderRadius: "lg",
  },
  heading: {
    size: "lg",
    margin: 4,
  },
  searchMargin: 4,
};

export const planDisplayStyles = {
  container: {
    padding: 8,
    bg: "transparent", // Transparent background for plan display
    position: "relative",
    gap: 8,
  },
  heading: {
    size: "2xl",
    margin: 4,
  },
  majorText: {
    margin: 6,
    color: "rgba(50, 50, 50, 0.8)",
  },
  semesterBox: {
    bg: "rgba(240, 240, 240, 0.5)", // Translucent background for semester boxes
    border: "1px solid rgba(200, 200, 200, 0.5)",
    borderColor: "rgba(180, 180, 180, 0.5)",
    padding: 3,
    width: "160px",
    minHeight: "160px",
  },
};

export const coursePreviewPanelStyles = {
  container: {
    width: "100%",
    bg: "rgba(255, 255, 255, 0.5)", // Translucent background for course preview panel
    padding: 4,
    borderRadius: "lg",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderColor: "rgba(200, 200, 200, 0.5)",
  },
  text: {
    fontSize: "xl",
    fontWeight: "bold",
    color: "rgba(100, 0, 0, 0.8)",
  },
};

export const searchBarStyles = {
  container: {
    position: "relative",
    width: "100%",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderColor: "rgba(200, 200, 200, 0.5)",
    borderRadius: "lg",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    bg: "transparent", // Transparent background for search bar
    display: "flex",
    flexDirection: "column",
  },
  input: {
    paddingLeft: 12,
    paddingY: 3,
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderColor: "rgba(200, 200, 200, 0.5)",
    rounded: "md",
    fontSize: "md",
    _focus: {
      outline: "none",
      ring: "2px",
      ringColor: "rgba(255, 255, 255, 0.5)",
      borderColor: "rgba(200, 200, 200, 0.5)",
    },
  },
};

// Export all styles for easy import
export default {
  cardStyles,
  buttonStyles,
  planDisplayStyles,
  globalSearchLayoutStyles,
  coursePreviewPanelStyles,
  searchBarStyles,
};

// export const cardStyles = {
//   base: {
//     bg: "white",
//     color: "black",
//     p: 4,
//     borderRadius: "md",
//     boxShadow: "md",
//   },
//   glass: {
//     bg: "rgba(255, 255, 255, 0.8)",
//     color: "black",
//     p: 4,
//     borderRadius: "md",
//     boxShadow: "lg",
//     backdropFilter: "blur(10px)",
//   },
// };

// export const buttonStyles = {
//   base: {
//     bg: "blue.500",
//     color: "white",
//     _hover: {
//       bg: "blue.600",
//     },
//   },
//   glass: {
//     bg: "rgba(0, 0, 255, 0.5)",
//     color: "white",
//     _hover: {
//       bg: "rgba(0, 0, 255, 0.7)",
//     },
//     backdropFilter: "blur(5px)",
//   },
// };

// export const globalSearchLayoutStyles = {
//   container: {
//     padding: 12,
//     gap: 4,
//     bg: "transparent", // Transparent background for layout
//     border: "1px solid rgba(255, 255, 255, 0.5)",
//     borderColor: "rgba(200, 200, 200, 0.5)",
//     borderRadius: "lg",
//   },
//   heading: {
//     size: "lg",
//     margin: 4,
//   },
//   searchMargin: 4,
// };

// export const planDisplayStyles = {
//   container: {
//     padding: 8,
//     bg: "transparent", // Transparent background for plan display
//     position: "relative",
//     gap: 8,
//   },
//   heading: {
//     size: "2xl",
//     margin: 4,
//   },
//   majorText: {
//     margin: 6,
//     color: "rgba(50, 50, 50, 0.8)",
//   },
//   semesterBox: {
//     bg: "rgba(240, 240, 240, 0.5)", // Translucent background for semester boxes
//     border: "1px solid rgba(200, 200, 200, 0.5)",
//     borderColor: "rgba(180, 180, 180, 0.5)",
//     padding: 3,
//     width: "160px",
//     minHeight: "160px",
//   },
// };

// export const coursePreviewPanelStyles = {
//   container: {
//     width: "100%",
//     bg: "rgba(255, 255, 255, 0.5)", // Translucent background for course preview panel
//     padding: 4,
//     borderRadius: "lg",
//     boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
//     border: "1px solid rgba(255, 255, 255, 0.5)",
//     borderColor: "rgba(200, 200, 200, 0.5)",
//   },
//   text: {
//     fontSize: "xl",
//     fontWeight: "bold",
//     color: "rgba(100, 0, 0, 0.8)",
//   },
// };

// export const searchBarStyles = {
//   container: {
//     position: "relative",
//     width: "100%",
//     border: "1px solid rgba(255, 255, 255, 0.5)",
//     borderColor: "rgba(200, 200, 200, 0.5)",
//     borderRadius: "lg",
//     boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
//     bg: "transparent", // Transparent background for search bar
//     display: "flex",
//     flexDirection: "column",
//   },
//   input: {
//     paddingLeft: 12,
//     paddingY: 3,
//     border: "1px solid rgba(255, 255, 255, 0.5)",
//     borderColor: "rgba(200, 200, 200, 0.5)",
//     rounded: "md",
//     fontSize: "md",
//     _focus: {
//       outline: "none",
//       ring: "2px",
//       ringColor: "rgba(255, 255, 255, 0.5)",
//       borderColor: "rgba(200, 200, 200, 0.5)",
//     },
//   },
// };
