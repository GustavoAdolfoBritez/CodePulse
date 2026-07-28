import { z } from "zod";

/** Shared password policy for credentials auth. */
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(128, "La contraseña es demasiado larga.")
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra.")
  .regex(/[0-9]/, "La contraseña debe incluir al menos un número.");
