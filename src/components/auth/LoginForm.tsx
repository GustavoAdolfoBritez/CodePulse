"use client";

import { useActionState } from "react";
import { initialAuthFormState } from "@/app/(auth)/auth-state";
import { loginAction, loginWithGitHubAction } from "@/app/(auth)/actions";

interface LoginFormProps {
  callbackUrl?: string;
}

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  borderRadius: 12,
  border: "1px solid #3f3f46",
  backgroundColor: "#09090b",
  color: "#fafafa",
  padding: "10px 12px",
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  color: "#a1a1aa",
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialAuthFormState);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <form action={loginWithGitHubAction}>
        {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
        <button
          type="submit"
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid #3f3f46",
            backgroundColor: "#09090b",
            color: "#e4e4e7",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Iniciar sesión con GitHub
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 12, color: "#71717a", margin: 0 }}>
        o usar credenciales
      </p>

      <form action={formAction} style={{ display: "grid", gap: 12 }}>
        {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
        <div>
          <label style={labelStyle} htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="password">
            Contraseña
          </label>
          <input id="password" name="password" type="password" required style={fieldStyle} />
        </div>

        {state.error ? (
          <p
            style={{
              margin: 0,
              borderRadius: 8,
              backgroundColor: "#450a0a",
              color: "#fecaca",
              padding: "8px 12px",
              fontSize: 12,
            }}
          >
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "none",
            backgroundColor: "#4f46e5",
            color: "#fff",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 500,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
