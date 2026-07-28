import type { CSSProperties } from "react";
import Link from "next/link";
import { registerWithInviteAction } from "@/app/(auth)/actions";
import { acceptInviteAction, loginWithInviteAction } from "@/app/(dashboard)/dashboard/settings/actions";

interface InviteAcceptPanelProps {
  token: string;
  organizationName: string;
  invitedEmail: string;
  role: string;
  isAuthenticated: boolean;
  sessionEmail: string | null;
  emailMatches: boolean;
}

const fieldStyle: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid #3f3f46",
  backgroundColor: "#09090b",
  color: "#fafafa",
  padding: "12px 14px",
  fontSize: 14,
};

export function InviteAcceptPanel({
  token,
  organizationName,
  invitedEmail,
  role,
  isAuthenticated,
  sessionEmail,
  emailMatches,
}: InviteAcceptPanelProps) {
  if (isAuthenticated && emailMatches) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#a1a1aa" }}>
          Sesión activa como <strong style={{ color: "#fafafa" }}>{sessionEmail}</strong>. Acepta la
          invitación para unirte a la organización.
        </p>
        <form action={acceptInviteAction}>
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            style={{
              width: "100%",
              borderRadius: 12,
              border: "none",
              backgroundColor: "#4f46e5",
              color: "#fff",
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Unirme a {organizationName}
          </button>
        </form>
      </div>
    );
  }

  if (isAuthenticated && !emailMatches) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <p
          style={{
            margin: 0,
            borderRadius: 8,
            backgroundColor: "#451a03",
            color: "#fdba74",
            padding: "10px 12px",
            fontSize: 13,
          }}
        >
          Estás conectado como {sessionEmail}, pero la invitación fue enviada a {invitedEmail}.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
          style={{
            display: "block",
            textAlign: "center",
            borderRadius: 12,
            border: "1px solid #3f3f46",
            padding: "12px 16px",
            color: "#e4e4e7",
            textDecoration: "none",
          }}
        >
          Cambiar cuenta
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          borderRadius: 16,
          border: "1px solid #312e81",
          backgroundColor: "rgba(49,46,129,0.25)",
          padding: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fafafa" }}>{organizationName}</p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#a1a1aa" }}>
          Te invitaron como <strong>{role}</strong> con el email <strong>{invitedEmail}</strong>.
        </p>
      </div>

      <form action={loginWithInviteAction}>
        <input type="hidden" name="token" value={token} />
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
          Continuar con GitHub
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 12, color: "#71717a", margin: 0 }}>o crear cuenta</p>

      <form action={registerWithInviteAction} style={{ display: "grid", gap: 12 }}>
        <input type="hidden" name="token" value={token} />
        <div>
          <label htmlFor="name" style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#a1a1aa" }}>
            Nombre
          </label>
          <input id="name" name="name" type="text" required style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="email" style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#a1a1aa" }}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            readOnly
            defaultValue={invitedEmail}
            style={{ ...fieldStyle, backgroundColor: "#27272a" }}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#a1a1aa" }}
          >
            Contraseña
          </label>
          <input id="password" name="password" type="password" required minLength={8} style={fieldStyle} />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            borderRadius: 12,
            border: "none",
            backgroundColor: "#4f46e5",
            color: "#fff",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Crear cuenta y unirme
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 14, color: "#a1a1aa", margin: 0 }}>
        ¿Ya tienes cuenta?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
          style={{ color: "#818cf8", fontWeight: 500 }}
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
