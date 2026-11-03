/** Written by Michael's Codex. Matches 2025 registration requirements. */
export const passwordRules = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "An uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  { label: "A number", test: (value: string) => /[0-9]/.test(value) },
  {
    label: "A special character (!@#$&*)",
    test: (value: string) => /[!@#$&*]/.test(value),
  },
];
export function validPassword(value: string) {
  return passwordRules.every((rule) => rule.test(value));
}
export function safeReturnPath(value: string | null) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u0020\u007f]/.test(value)
    ? value
    : "/plans";
}
