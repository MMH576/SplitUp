"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { OnboardingDialog } from "./onboarding-dialog";

export function OnboardingTrigger() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setShowOnboarding(true)}
        title="How to use SplitUp"
      >
        <Info className="h-4 w-4" />
      </Button>
      {showOnboarding && (
        <OnboardingDialog
          forceOpen={true}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}
