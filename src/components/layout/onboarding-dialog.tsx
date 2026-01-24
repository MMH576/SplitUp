"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Receipt, HandCoins, Link2, Mail } from "lucide-react";

const ONBOARDING_KEY = "splitup-onboarding-shown";

type OnboardingDialogProps = {
  forceOpen?: boolean;
  isNewUser?: boolean;
  onClose?: () => void;
};

export function OnboardingDialog({ forceOpen, isNewUser, onClose }: OnboardingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setStep(0);
      return;
    }
    if (isNewUser) {
      // Always show for new users regardless of localStorage
      setOpen(true);
      setStep(0);
      return;
    }
    // For returning users (info button), check localStorage
    const shown = localStorage.getItem(ONBOARDING_KEY);
    if (!shown) {
      setOpen(true);
    }
  }, [forceOpen, isNewUser]);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
    setStep(0);
    onClose?.();
  };

  const steps = [
    {
      icon: <UserPlus className="h-10 w-10 text-[oklch(0.72_0.18_55)]" />,
      title: "Welcome to SplitUp!",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground text-left">
          <p>The easiest way to split expenses with friends and groups. Here&apos;s how to get started:</p>
          <ul className="space-y-1.5 ml-4 list-disc">
            <li>Add friends for <strong>1:1 expense tracking</strong></li>
            <li>Create groups for <strong>trips, roommates, or activities</strong></li>
            <li>Log expenses and see who owes whom instantly</li>
          </ul>
        </div>
      ),
    },
    {
      icon: <Mail className="h-10 w-10 text-[oklch(0.72_0.18_55)]" />,
      title: "Adding Friends",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground text-left">
          <p>To add a friend for 1:1 expense splitting:</p>
          <ol className="space-y-1.5 ml-4 list-decimal">
            <li>Click <strong>&quot;Add Friend&quot;</strong> button</li>
            <li>Enter your friend&apos;s <strong>email address</strong></li>
            <li>They must already have a SplitUp account</li>
            <li>Once added, you can start logging shared expenses!</li>
          </ol>
          <p className="text-xs mt-2 text-muted-foreground/70">Tip: Your friend will see the shared expenses next time they log in.</p>
        </div>
      ),
    },
    {
      icon: <Link2 className="h-10 w-10 text-primary" />,
      title: "Groups & Invite Links",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground text-left">
          <p>For multi-person splits (trips, roommates, etc.):</p>
          <ol className="space-y-1.5 ml-4 list-decimal">
            <li>Click <strong>&quot;Create Group&quot;</strong> and name it</li>
            <li>Inside the group, click <strong>&quot;Invite&quot;</strong> to generate a link</li>
            <li>Share the invite link with your friends</li>
            <li>They click the link to join your group</li>
          </ol>
          <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs"><strong>Joining a group?</strong> Click <strong>&quot;Join Group&quot;</strong> and paste the invite link someone shared with you.</p>
          </div>
        </div>
      ),
    },
    {
      icon: <Receipt className="h-10 w-10 text-[oklch(0.72_0.18_55)]" />,
      title: "Tracking Expenses",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground text-left">
          <p>Inside any friend or group page:</p>
          <ol className="space-y-1.5 ml-4 list-decimal">
            <li>Click <strong>&quot;Add Expense&quot;</strong></li>
            <li>Enter the title, amount, and who paid</li>
            <li>Choose <strong>Split Equally</strong> or <strong>Custom Amounts</strong></li>
            <li>Select who&apos;s part of this expense</li>
          </ol>
          <p className="text-xs mt-2 text-muted-foreground/70">Balances update in real-time. Check the Balances tab to see who owes whom.</p>
        </div>
      ),
    },
    {
      icon: <HandCoins className="h-10 w-10 text-primary" />,
      title: "Settling Up",
      content: (
        <div className="space-y-2 text-sm text-muted-foreground text-left">
          <p>When it&apos;s time to pay up:</p>
          <ol className="space-y-1.5 ml-4 list-decimal">
            <li>Go to the <strong>&quot;Settle&quot;</strong> tab in any group</li>
            <li>See optimized payment suggestions (fewest transactions)</li>
            <li>Click <strong>&quot;Mark as Paid&quot;</strong> when you send money</li>
            <li>The receiver confirms the payment</li>
          </ol>
          <div className="mt-2 p-2 rounded-lg bg-[oklch(0.82_0.175_85/0.08)] border border-[oklch(0.82_0.175_85/0.25)]">
            <p className="text-xs"><strong>Pro tip:</strong> You can view this guide anytime by clicking the <strong>(i)</strong> icon in the top bar.</p>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader className="text-center items-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-1">
            {currentStep.icon}
          </div>
          <DialogTitle className="text-lg">{currentStep.title}</DialogTitle>
        </DialogHeader>

        <div className="px-1">
          {currentStep.content}
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 py-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-primary/20"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleClose}>
              Skip
            </Button>
          )}
          {isLast ? (
            <Button onClick={handleClose}>
              Get Started
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
