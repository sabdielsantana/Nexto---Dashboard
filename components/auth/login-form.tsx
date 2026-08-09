"use client";

import { useFormState, useFormStatus } from "react-dom";

import { AlertCircle, CheckCircle2, LogIn, UserPlus } from "lucide-react";

import { type AuthState, signIn, signUp } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_STATE: AuthState = { error: null, message: null };

/** Botón que se deshabilita mientras la Server Action está en vuelo. */
function SubmitButton({
  children,
  variant,
  formAction,
}: {
  children: React.ReactNode;
  variant: "default" | "outline";
  formAction?: (formData: FormData) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className="flex-1"
      {...(formAction ? { formAction } : {})}
    >
      {children}
    </Button>
  );
}

export function LoginForm() {
  const [signInState, signInAction] = useFormState(signIn, INITIAL_STATE);
  const [signUpState, signUpAction] = useFormState(signUp, INITIAL_STATE);

  // Se muestra el resultado del registro si hubo uno; si no, el del login.
  const state: AuthState =
    signUpState.error || signUpState.message ? signUpState : signInState;

  return (
    <form action={signInAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      {state.error ? (
        <p className="flex items-start gap-2 rounded-md border border-negative/30 bg-negative/10 p-3 text-sm text-negative-fg">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="flex items-start gap-2 rounded-md border border-positive/30 bg-positive/10 p-3 text-sm text-positive-fg">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton variant="default">
          <LogIn />
          Entrar
        </SubmitButton>
        <SubmitButton variant="outline" formAction={signUpAction}>
          <UserPlus />
          Crear cuenta
        </SubmitButton>
      </div>
    </form>
  );
}
