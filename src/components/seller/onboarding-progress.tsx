import { cn } from "@/lib/utils";

type Step = "profile" | "kyc" | "bank" | "done";

const ORDER: Step[] = ["profile", "kyc", "bank", "done"];

const LABELS: Record<Step, string> = {
  profile: "Shop profile",
  kyc: "KYC",
  bank: "Bank",
  done: "Done",
};

export function OnboardingProgress({ current }: { current: Step }) {
  const currentIdx = ORDER.indexOf(current);
  return (
    <ol className="flex items-center gap-2" aria-label="Onboarding progress">
      {ORDER.map((step, i) => {
        const state =
          i < currentIdx ? "complete" : i === currentIdx ? "current" : "upcoming";
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                state === "complete" && "border-primary bg-primary text-primary-foreground",
                state === "current" && "border-primary text-primary",
                state === "upcoming" && "border-border text-muted-foreground",
              )}
              aria-current={state === "current" ? "step" : undefined}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                state === "upcoming" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {LABELS[step]}
            </span>
            {i < ORDER.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1",
                  state === "complete" ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
