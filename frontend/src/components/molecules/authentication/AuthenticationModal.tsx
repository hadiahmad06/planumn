// components/AuthButton.tsx
"use client";
import { Button, Modal, Text, TextInput, Stack, SegmentedControl, Center, Loader } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { IconLogin, IconUserPlus } from "@tabler/icons-react";
import { UserSessionContext } from "@/contexts/data/UserSessionContext";
import { handleLogin, handleRegister, handleResend } from "./authenticationActions";

const PRIMARY_COLOR = "#811331";

export default function AuthButton() {
  const { user, setUser, session, setSession } = useContext(UserSessionContext);
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

  return (
    <>
      <Modal 
        opened={opened} 
        centered 
        onClose={() => setOpened(false)}
        withCloseButton={false}>
        {user ? (
          <Stack align="center" justify="center" mih="40vh" gap="xs">
            <Loader size="xl" color={PRIMARY_COLOR} />
            <Text size="lg" fw={500}>Waiting for email verification</Text>
            <Text size="sm" c="dimmed" ta="center">
              Please check your inbox and click the verification link we sent you to complete your registration.
            </Text>
            <Button
              color={PRIMARY_COLOR}
              disabled={resendCooldown > 0}
              onClick={() => {
                if (resendCooldown > 0) return;
                handleResend( {email, setResendCooldown });
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
            </Button>
          </Stack>
        ) : (
          <Stack>
            <SegmentedControl
              value={authType}
              onChange={setAuthType}
              fullWidth
              color={PRIMARY_COLOR}
              data={[
                {
                  value: "login",
                  label: (
                    <Center style={{ gap: 10 }}>
                      <IconLogin size={16} />
                      <span>Login</span>
                    </Center>
                  ),
                },
                {
                  value: "register",
                  label: (
                    <Center style={{ gap: 10 }}>
                      <IconUserPlus size={16} />
                      <span>Register</span>
                    </Center>
                  ),
                },
              ]}
            />
            <TextInput
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <TextInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            {authType === "register" && (
              <>
                <TextInput
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                />
                <Stack gap={1}>
                  <span style={{ color: password && password === confirmPassword ? "green" : "red", fontSize: 14 }}>
                    {password && password === confirmPassword ? "✓" : "✗"} Passwords match
                  </span>
                  {passwordRules.map(({ label, test }) => {
                    const passed = test(password);
                    return (
                      <span key={label} style={{ color: passed ? "green" : "red", fontSize: 14 }}>
                        {passed ? "✓" : "✗"} {label}
                      </span>
                    );
                  })}
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
            {(() => {
              const error = authType === "register" ? registerError : loginError;
              return error && (
                <span style={{ color: "red", fontSize: 14 }}>{error}</span>
              );
            })()}
            <Button 
              color={PRIMARY_COLOR}
              disabled={authType === "register" && (
                password !== confirmPassword ||
                !passwordRules.every(rule => rule.test(password))
              )}
              onClick={async () => {
                setRegisterError("");
                setLoginError("");
                if (authType === "register") {
                  handleRegister({ email, password, confirmPassword, setUser, setSession, setRegisterError, setResendCooldown});
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
        color={PRIMARY_COLOR}
        size="md"
        variant="filled"
        radius="md"
        style={{ boxShadow: "sm" }}
      >
        LOGIN
      </Button>
    </>
  );
}
