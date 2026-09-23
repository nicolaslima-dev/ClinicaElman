import { useState, useRef, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { AuthSidePanel } from "../components/AuthSidePanel";
import { AuthTopBar } from "../components/AuthTopBar";
import { AuthFooter } from "../components/AuthFooter";
import { ForgotPasswordStepper } from "../components/ForgotPasswordStepper";
import {
  ForgotPasswordAlert,
  type AlertType,
} from "../components/ForgotPasswordAlert";
import { ForgotPasswordEmailStep } from "../components/ForgotPasswordEmailStep";
import { ForgotPasswordCodeStep } from "../components/ForgotPasswordCodeStep";
import { ForgotPasswordPasswordStep } from "../components/ForgotPasswordPasswordStep";
import { ForgotPasswordSuccessStep } from "../components/ForgotPasswordSuccessStep";
import { requestPasswordReset, verifyResetToken, updatePassword } from "../api/auth.service";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [alert, setAlert] = useState<{ message: string; type: AlertType }>({
    message: "",
    type: null,
  });
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Pin input refs for auto-focus
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for step 2
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 2 && countdown > 0) {
      interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, countdown]);

  const displayAlert = (message: string, type: AlertType) => {
    setAlert({ message, type });
  };

  // Step 1
  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    displayAlert("Solicitando código...", "info");
    
    const { success, error } = await requestPasswordReset(email);
    
    if (error) {
      displayAlert(error.message, "error");
      return;
    }

    displayAlert(`Código seguro enviado para ${email}.`, "success");
    setStep(2);
    setCountdown(45);
    setCanResend(false);
  };

  // Step 2
  const handlePinChange = (index: number, value: string) => {
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto advance
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    const enteredCode = pin.join("");
    if (enteredCode.length < 6) {
      displayAlert("Por favor, informe todos os 6 dígitos do código.", "error");
      return;
    }

    displayAlert("Validando código...", "info");
    
    const { success, error } = await verifyResetToken(email, enteredCode);
    
    if (error || !success) {
      displayAlert(error?.message || "Código inválido", "error");
      return;
    }

    displayAlert("Código de segurança validado com sucesso!", "success");
    setStep(3);
    displayAlert("", null);
  };

  const resendCode = async () => {
    if (!canResend) return;
    displayAlert("Reenviando código...", "info");
    
    const { success, error } = await requestPasswordReset(email);
    
    if (error) {
      displayAlert(error.message, "error");
      return;
    }
    
    setCountdown(45);
    setCanResend(false);
    displayAlert(`Novo código enviado para ${email}.`, "info");
  };

  // Step 3
  const handleStep3Submit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      displayAlert("A senha deve conter no mínimo 8 caracteres.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      displayAlert("As senhas não coincidem. Digite novamente.", "error");
      return;
    }

    displayAlert("Atualizando senha...", "info");
    const enteredCode = pin.join("");
    
    const { success, error } = await updatePassword(email, enteredCode, newPassword);
    
    if (error || !success) {
      displayAlert(error?.message || "Erro ao atualizar senha", "error");
      return;
    }

    // Success
    setStep(4);
    displayAlert("", null);
  };

  const hasLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);

  return (
    <div className="h-full w-full bg-white text-ink-800 antialiased overflow-x-hidden">
      <div className="min-h-screen w-full flex flex-col lg:flex-row">
        <AuthSidePanel
          minimalistCards
          title="Passo a Passo de Acesso"
          description="Siga as três etapas simples para redefinir sua credencial médica de forma totalmente segura e rastreável."
          highlights={[
            {
              icon: <span className="font-bold text-lg">1</span>,
              iconBgClass: "bg-brand-700/40",
              iconBorderClass: "border-brand-400/30",
              iconTextClass: "text-brand-200",
              title: "Etapa 1: Solicitação",
              description:
                "Informe seu e-mail institucional para receber um código de segurança temporário e exclusivo.",
            },
            {
              icon: <span className="font-bold text-lg">2</span>,
              iconBgClass: "bg-gold-500/15",
              iconBorderClass: "border-gold-400/30",
              iconTextClass: "text-gold-400",
              title: "Etapa 2: Validação OTP",
              description:
                "Insira o código de 6 dígitos recebido. O token possui validade de 15 minutos.",
            },
            {
              icon: <span className="font-bold text-lg">3</span>,
              iconBgClass: "bg-emerald-500/15",
              iconBorderClass: "border-emerald-400/30",
              iconTextClass: "text-emerald-400",
              title: "Etapa 3: Nova Senha",
              description:
                "Cadastre uma nova credencial seguindo os critérios de segurança corporativa.",
            },
          ]}
        />

        <main className="w-full lg:w-7/12 xl:w-7/12 flex-1 flex flex-col justify-between bg-white px-6 sm:px-12 md:px-16 lg:px-20 xl:px-28 py-10 lg:py-14">
          <AuthTopBar showBackButton />

          {/* Central Form */}
          <div className="w-full max-w-lg mx-auto my-auto py-8">
            <ForgotPasswordStepper step={step} email={email} />
            <ForgotPasswordAlert alert={alert} />

            {step === 1 && (
              <ForgotPasswordEmailStep
                email={email}
                setEmail={setEmail}
                onSubmit={handleStep1Submit}
              />
            )}

            {step === 2 && (
              <ForgotPasswordCodeStep
                pin={pin}
                pinRefs={pinRefs}
                countdown={countdown}
                canResend={canResend}
                onPinChange={handlePinChange}
                onPinKeyDown={handlePinKeyDown}
                onResend={resendCode}
                onBack={() => setStep(1)}
                onSubmit={handleStep2Submit}
              />
            )}

            {step === 3 && (
              <ForgotPasswordPasswordStep
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                hasLength={hasLength}
                hasNumber={hasNumber}
                hasUpper={hasUpper}
                onSubmit={handleStep3Submit}
              />
            )}

            {step === 4 && <ForgotPasswordSuccessStep />}
          </div>

          <AuthFooter showLoginLink />
        </main>
      </div>
    </div>
  );
}
