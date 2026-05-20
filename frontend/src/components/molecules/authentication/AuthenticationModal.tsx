// components/AuthButton.tsx
"use client";
import {
  Button,
  Modal,
  Text,
  TextInput,
  PasswordInput,
  Stack,
  SegmentedControl,
  Center,
  Loader,
  Group,
} from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { IconLogin, IconUserPlus, IconCheck, IconX } from "@tabler/icons-react";
import { UserSessionContext } from "@/contexts/data/UserSessionContext";
import { handleLogin, handleRegister, handleResend } from "./authenticationActions";

const PRIMARY_COLOR = "var(--accent-primary)";

const modalStyles = {
  content: {
    backgroundColor: "var(--bg-surface)",
    boxShadow: "var(--shadow-overlay)",
    border: "1px solid var(--border-subtle)",
  },
  header: {
    backgroundColor: "var(--bg-surface)",
    borderBottom: "1px solid var(--border-subtle)",
  },
  body: {
    padding: "var(--space-2)",
  },
};

function Rule({ passed, label }: { passed: boolean; label: string }) {
  const color = passed ? "var(--success)" : "var(--text-tertiary)";
  return (
    <Group gap={6} wrap="nowrap">
      {passed ? (
        <IconCheck size={14} color="var(--success)" />
      ) : (
        <IconX size={14} color="var(--text-tertiary)" />
      )}
      <Text style={{ fontSize: "var(--font-size-micro)", color }}>{label}</Text>
    </Group>
  );
}

export default function AuthButton() {
  const { user, setUser, setSession } = useContext(UserSessionContext);
  const [opened, setOpened] = useState(false);

  const [authType, setAuthType] = useState("register");
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown === 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const passwordRules = [
    { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
    { label: "At least one uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
    { label: "At least one number", test: (pw: string) => /[0-9]/.test(pw) },
    { label: "At least one special character (!@#$&*)", test: (pw: string) => /[!@#$&*]/.test(pw) },
  ];

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const allRulesPass = passwordRules.every((rule) => rule.test(password));
  const error = authType === "register" ? registerError : loginError;

  return (
    <>
      <Modal
        opened={opened}
        centered
        size="sm"
        onClose={() => setOpened(false)}
        withCloseButton={false}
        radius="var(--radius-lg)"
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
        styles={modalStyles}
      >
        {user ? (
          <Stack align="center" justify="center" mih="40vh" gap="var(--space-1)">
            <Loader size="xl" color={PRIMARY_COLOR} />
            <Text
              style={{
                fontSize: "var(--font-size-label)",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginTop: "var(--space-1)",
              }}
            >
              Waiting for email verification
            </Text>
            <Text
              ta="center"
              style={{
                fontSize: "var(--font-size-body)",
                color: "var(--text-secondary)",
              }}
            >
              Please check your inbox and click the verification link we sent you to complete your registration.
            </Text>
            <Button
              radius="var(--radius-md)"
              disabled={resendCooldown > 0}
              style={{
                backgroundColor: resendCooldown > 0 ? "var(--border-subtle)" : PRIMARY_COLOR,
                color: "var(--bg-surface)",
                marginTop: "var(--space-1)",
              }}
              onClick={() => {
                if (resendCooldown > 0) return;
                handleResend({ email, setResendCooldown });
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
            </Button>
          </Stack>
        ) : (
          <Stack gap="var(--space-2)">
            <Text
              style={{
                fontSize: "var(--font-size-label)",
                fontWeight: 600,
                color: "var(--accent-primary)",
              }}
            >
              {authType === "register" ? "Create your account" : "Welcome back"}
            </Text>

            <SegmentedControl
              value={authType}
              onChange={setAuthType}
              fullWidth
              color={PRIMARY_COLOR}
              data={[
                {
                  value: "login",
                  label: (
                    <Center style={{ gap: 8 }}>
                      <IconLogin size={16} />
                      <span>Login</span>
                    </Center>
                  ),
                },
                {
                  value: "register",
                  label: (
                    <Center style={{ gap: 8 }}>
                      <IconUserPlus size={16} />
                      <span>Register</span>
                    </Center>
                  ),
                },
              ]}
            />

            <TextInput
              label="Email"
              placeholder="you@umn.edu"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />

            {authType === "register" && (
              <>
                <PasswordInput
                  label="Confirm password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                />
                <Stack gap={4}>
                  <Rule passed={passwordsMatch} label="Passwords match" />
                  {passwordRules.map(({ label, test }) => (
                    <Rule key={label} passed={test(password)} label={label} />
                  ))}
                </Stack>
              </>
            )}

            {/* WILL ADD LATER LOWK */}
            {/* {authType === "login" && (
              <>
                <Text size="sm" c="dimmed">
                  {"Forgot your password? "}
                  <span
                    style={{ color: PRIMARY_COLOR, cursor: "pointer" }}
                    onClick={async () => {
                      const { data, error } = await supabase.auth.resetPasswordForEmail(email);

                    }}
                  >
                    Reset Password
                  </span>
                </Text>
              </>
            )} */}

            {error && (
              <Text
                style={{
                  fontSize: "var(--font-size-micro)",
                  color: "var(--grade-f)",
                }}
              >
                {error}
              </Text>
            )}

            <Button
              radius="var(--radius-md)"
              fullWidth
              disabled={
                authType === "register" && (!passwordsMatch || !allRulesPass)
              }
              style={{
                backgroundColor: PRIMARY_COLOR,
                color: "var(--bg-surface)",
              }}
              onClick={() => {
                setRegisterError("");
                setLoginError("");
                if (authType === "register") {
                  handleRegister({
                    email,
                    password,
                    confirmPassword,
                    setUser,
                    setSession,
                    setRegisterError,
                    setResendCooldown,
                  });
                } else {
                  handleLogin({ email, password, setUser, setSession, setLoginError });
                }
              }}
            >
              {authType === "register" ? "Register" : "Login"}
            </Button>
          </Stack>
        )}
      </Modal>

      <Button
        onClick={() => setOpened(true)}
        size="lg"
        radius="var(--radius-pill)"
        style={{
          backgroundColor: PRIMARY_COLOR,
          color: "var(--bg-surface)",
          boxShadow: "var(--shadow-card)",
          paddingLeft: "var(--space-3)",
          paddingRight: "var(--space-3)",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        LOGIN
      </Button>
    </>
  );
}
