'use client';

import { createClient } from "@/utils/supabase/client";

interface LoginActionParams {
    email: string;
    password: string;
    setUser: (user: any) => void;
    setSession: (session: any) => void;
    setLoginError: (error: string) => void;
}

export async function handleLogin({ email, password, setUser, setSession, setLoginError }: LoginActionParams): Promise<void> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Login error:", error.message);
        setLoginError(`Login failed: ${error.message}`);
    } else {
        console.log("Logged in user:", data.user);
        setUser(data.user);
        setSession(data.session);
    }
}

interface RegisterActionParams {
    email: string;
    password: string;
    confirmPassword: string;
    setUser: (user: any) => void;
    setSession: (session: any) => void;
    setRegisterError: (error: string) => void;
    setResendCooldown: (value: number) => void;
}

export async function handleRegister({ email, password, confirmPassword, setUser, setSession, setRegisterError, setResendCooldown }: RegisterActionParams): Promise<void> {
    const supabase = await createClient();

    const isValidPassword = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9]).{8,}$/.test(password);
    if (!isValidPassword) {
        setRegisterError("Please ensure your password meets the requirements");
        return;
    }
    if (password !== confirmPassword) {
        setRegisterError("Passwords do not match");
        return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        setRegisterError(`${error.message}`);
    } else {
        setUser(data.user);
        setSession(data.session);
        setResendCooldown(60);
    }
}


interface ResendActionParams {
    email: string;
    setResendCooldown: (value: number) => void;
}

export async function handleResend({ email, setResendCooldown }: ResendActionParams): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
    });

    if (error) {
        console.error("Resend error:", error.message);
    } else {
        setResendCooldown(60);
    }
}