"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Headset, Loader2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PikuSprite } from "@/components/piku/piku-sprite";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  buildWhatsAppUrl,
  conciergeBudgetOptions,
  emptyConciergeAnswers,
  feelingAck,
  feelingOptions,
  giftStyleOptions,
  occasionAck,
  occasionOptions,
  optionLabel,
  progressSteps,
  stepIndex,
  stylesAck,
  type ConciergeAnswers,
  type ConciergeOption,
  type ConciergeStep,
} from "@/lib/piku-concierge";
import { usePikuConcierge } from "./piku-concierge-context";

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function PikuBubble({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-card px-4 py-3 text-sm leading-relaxed text-ink shadow-card">
      {children}
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-accent px-4 py-2.5 text-sm leading-relaxed text-paper">
      {children}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium",
        "transition-[background-color,border-color,color] duration-200 ease-out motion-reduce:transition-none",
        selected
          ? "border-accent bg-accent text-paper"
          : "border-ink/15 bg-card text-ink hover:border-ink/35",
      )}
    >
      {selected ? <Check aria-hidden="true" className="size-3.5" /> : null}
      {children}
    </button>
  );
}

function StepMotion({
  stepKey,
  children,
}: {
  stepKey: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col gap-3"
    >
      {children}
    </motion.div>
  );
}

const fieldInputClasses =
  "w-full rounded-xl border border-ink/15 bg-card px-4 py-3 text-sm text-ink transition-colors duration-200 placeholder:text-ink-soft/60 hover:border-ink/25 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40";

const fieldErrorClasses =
  "w-full rounded-xl border border-[#B42318] bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-[#B42318] focus:outline-none focus:ring-2 focus:ring-[#B42318]/25";

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

type SubmitStatus = "idle" | "submitting" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PikuModal() {
  const { isOpen, closeConcierge } = usePikuConcierge();
  const [step, setStep] = useState<ConciergeStep>("intro");
  const [answers, setAnswers] = useState<ConciergeAnswers>(emptyConciergeAnswers);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback((update: Partial<ConciergeAnswers>) => {
    setAnswers((previous) => ({ ...previous, ...update }));
  }, []);

  const goTo = useCallback((next: ConciergeStep) => {
    setStep(next);
  }, []);

  /** Single-select advance with a beat so the selection is seen first. */
  const pickAndAdvance = useCallback(
    (update: Partial<ConciergeAnswers>, next: ConciergeStep) => {
      patch(update);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => goTo(next), 320);
    },
    [patch, goTo],
  );

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  /* Scroll-lock + Esc + initial focus while open */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeConcierge();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeConcierge]);

  /* Keep the latest message in view */
  useEffect(() => {
    if (!isOpen) return;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [isOpen, step, answers]);

  const goBack = useCallback(() => {
    const order: ConciergeStep[] = [
      "intro",
      "occasion",
      "feeling",
      "gift-style",
      "details-quantity",
      "details-date",
      "details-location",
      "details-budget",
      "details-notes",
      "confirm",
      "contact",
      "brief",
    ];
    const index = order.indexOf(step);
    if (index > 0) goTo(order[index - 1]);
  }, [step, goTo]);

  /* WhatsApp handoff — carries whatever is known, never resets the flow */
  const openWhatsApp = useCallback(() => {
    window.open(buildWhatsAppUrl(answers), "_blank", "noopener,noreferrer");
  }, [answers]);

  const validateContact = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (answers.name.trim().length < 2) errors.name = "Please share your name.";
    if (!answers.designation.trim())
      errors.designation = "Please share your designation.";
    if (!answers.company.trim()) errors.company = "Please share your company.";
    if (answers.phone.trim().length < 7)
      errors.phone = "Please enter a valid phone number.";
    if (!EMAIL_PATTERN.test(answers.email.trim()))
      errors.email = "Please enter a valid email address.";
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  }, [answers]);

  const submitEnquiry = useCallback(async () => {
    if (submitStatus === "submitting") return;
    setSubmitStatus("submitting");
    const styleLabels = answers.styles
      .map((value) => optionLabel(giftStyleOptions, value))
      .join(", ");
    const messageParts = [
      answers.feeling
        ? `Feeling: ${optionLabel(feelingOptions, answers.feeling)}`
        : null,
      styleLabels ? `Gift style: ${styleLabels}` : null,
      answers.deliveryDate.trim()
        ? `Delivery by: ${answers.deliveryDate.trim()}`
        : null,
      answers.location.trim() ? `Location: ${answers.location.trim()}` : null,
      answers.requirement.trim()
        ? `Requirement: ${answers.requirement.trim()}`
        : null,
      answers.designation.trim()
        ? `Designation: ${answers.designation.trim()}`
        : null,
      answers.notes.trim() ? `Notes: ${answers.notes.trim()}` : null,
      "Source: Piku concierge",
    ].filter(Boolean);
    const quantityDigits = answers.quantity.replace(/[^\d]/g, "");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: answers.name.trim(),
          company: answers.company.trim(),
          email: answers.email.trim(),
          phone: answers.phone.trim(),
          occasion:
            answers.occasion === "other"
              ? answers.occasionOther.trim() || "Other"
              : optionLabel(occasionOptions, answers.occasion),
          quantity: quantityDigits,
          budget: answers.budget ?? "not-sure",
          message: messageParts.join("\n"),
        }),
      });
      if (!response.ok) throw new Error(`Enquiry failed: ${response.status}`);
      goTo("done");
    } catch {
      setSubmitStatus("error");
    } finally {
      setSubmitStatus((current) => (current === "submitting" ? "idle" : current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, submitStatus]);

  const progress = stepIndex(step);
  const showProgress = progress >= 0;
  const showBack = step !== "intro" && step !== "done";

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="piku-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={closeConcierge}
        >
          <motion.div
            key="piku-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Chat with Piku — gifting concierge"
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
            onClick={(event) => event.stopPropagation()}
            className="flex h-[100dvh] w-full flex-col overflow-hidden bg-paper sm:h-auto sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl sm:shadow-lift"
          >
            {/* Top — identity + support + close */}
            <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-3 sm:px-5">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream [&_svg]:size-8"
              >
                <PikuSprite emotion="happy" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-semibold leading-tight tracking-[-0.01em]">
                  Piku
                </span>
                <span className="block truncate text-xs text-ink-soft">
                  Your gifting concierge
                </span>
              </span>
              <button
                type="button"
                onClick={openWhatsApp}
                title="Talk to our gifting team on WhatsApp — your brief so far comes along"
                aria-label="Support — talk to our gifting team on WhatsApp with your brief so far"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/[0.06] px-3.5 py-2 text-xs font-semibold text-accent transition-colors duration-200 hover:bg-accent hover:text-paper motion-reduce:transition-none"
              >
                <Headset aria-hidden="true" className="size-4" />
                Support
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={closeConcierge}
                aria-label="Close chat with Piku"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <X aria-hidden="true" className="size-4.5" />
              </button>
            </div>

            {/* Progress */}
            {showProgress ? (
              <div className="border-b border-line bg-paper px-4 pb-3 pt-2.5 sm:px-5">
                <div
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={progressSteps.length}
                  aria-valuenow={progress + 1}
                  aria-label="Chat progress"
                  className="h-1 overflow-hidden rounded-full bg-ink/10"
                >
                  <motion.div
                    className="h-full rounded-full bg-gold"
                    initial={false}
                    animate={{
                      width: `${((progress + 1) / progressSteps.length) * 100}%`,
                    }}
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                </div>
              </div>
            ) : null}

            {/* Middle — conversation (footer removed: team handoff now lives in the header Support button) */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-5"
            >
              {showBack ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  <ArrowLeft aria-hidden="true" className="size-3.5" />
                  Back
                </button>
              ) : null}

              <Conversation
                step={step}
                answers={answers}
                patch={patch}
                goTo={goTo}
                pickAndAdvance={pickAndAdvance}
                contactErrors={contactErrors}
                setContactErrors={setContactErrors}
                validateContact={validateContact}
                submitStatus={submitStatus}
                submitEnquiry={submitEnquiry}
                openWhatsApp={openWhatsApp}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Conversation — transcript + current question, one at a time         */
/* ------------------------------------------------------------------ */

interface ConversationProps {
  step: ConciergeStep;
  answers: ConciergeAnswers;
  patch: (update: Partial<ConciergeAnswers>) => void;
  goTo: (next: ConciergeStep) => void;
  pickAndAdvance: (
    update: Partial<ConciergeAnswers>,
    next: ConciergeStep,
  ) => void;
  contactErrors: Record<string, string>;
  setContactErrors: (errors: Record<string, string>) => void;
  validateContact: () => boolean;
  submitStatus: SubmitStatus;
  submitEnquiry: () => void;
  openWhatsApp: () => void;
}

function SingleSelectChips({
  options,
  value,
  onPick,
}: {
  options: ConciergeOption[];
  value: string | null;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={value === option.value}
          onClick={() => onPick(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

function PrimaryAction({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="group inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-paper transition-[background-color,transform] duration-200 ease-out hover:bg-accent-ink active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
      >
        {children}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0"
        />
      </button>
    </div>
  );
}

function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className="text-sm font-medium text-ink-soft underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink"
      >
        Skip
      </button>
    </div>
  );
}

function Conversation(props: ConversationProps) {
  const { step, answers } = props;
  const order: ConciergeStep[] = [
    "intro",
    "occasion",
    "feeling",
    "gift-style",
    "details-quantity",
    "details-date",
    "details-location",
    "details-budget",
    "details-notes",
    "confirm",
    "contact",
    "brief",
    "done",
  ];
  const reached = (target: ConciergeStep) =>
    order.indexOf(step) >= order.indexOf(target);

  return (
    <div className="flex flex-col gap-3">
      {/* State 01 — intro */}
      <StepMotion stepKey="intro">
        <PikuBubble>
          Hi, I’m Piku. I help teams find gifts people actually keep. Two
          minutes, a few quick questions — shall we start?
        </PikuBubble>
      </StepMotion>
      {step === "intro" ? (
        <StepMotion stepKey="intro-action">
          <PrimaryAction onClick={() => props.goTo("occasion")}>
            Let’s start
          </PrimaryAction>
        </StepMotion>
      ) : null}

      {/* State 02 — occasion */}
      {reached("occasion") ? (
        <StepMotion stepKey="occasion">
          {reached("feeling") && answers.occasion ? (
            <>
              <UserBubble>
                {answers.occasion === "other" && answers.occasionOther.trim()
                  ? answers.occasionOther.trim()
                  : optionLabel(occasionOptions, answers.occasion)}
              </UserBubble>
              <PikuBubble>{occasionAck(answers.occasion, answers.occasionOther)}</PikuBubble>
            </>
          ) : null}
          {!reached("feeling") ? (
            <>
              <PikuBubble>First — what’s the occasion?</PikuBubble>
              <SingleSelectChips
                options={occasionOptions}
                value={answers.occasion}
                onPick={(value) => {
                  if (value === "other") {
                    // Stay put so the free-text field can be filled first.
                    props.patch({ occasion: value });
                  } else {
                    props.pickAndAdvance({ occasion: value }, "feeling");
                  }
                }}
              />
              {answers.occasion === "other" ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={answers.occasionOther}
                    onChange={(event) =>
                      props.patch({ occasionOther: event.target.value })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && answers.occasionOther.trim()) {
                        props.goTo("feeling");
                      }
                    }}
                    placeholder="Tell us the occasion"
                    aria-label="Describe the occasion"
                    className={fieldInputClasses}
                  />
                  <PrimaryAction
                    disabled={!answers.occasionOther.trim()}
                    onClick={() => props.goTo("feeling")}
                  >
                    Continue
                  </PrimaryAction>
                </div>
              ) : null}
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 03 — feeling */}
      {reached("feeling") ? (
        <StepMotion stepKey="feeling">
          {reached("gift-style") && answers.feeling ? (
            <>
              <UserBubble>
                {optionLabel(feelingOptions, answers.feeling)}
              </UserBubble>
              <PikuBubble>{feelingAck(answers.feeling)}</PikuBubble>
            </>
          ) : null}
          {!reached("gift-style") ? (
            <>
              <PikuBubble>And how should it make them feel?</PikuBubble>
              <SingleSelectChips
                options={feelingOptions}
                value={answers.feeling}
                onPick={(value) =>
                  props.pickAndAdvance({ feeling: value }, "gift-style")
                }
              />
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 04 — gift style (multi-select) */}
      {reached("gift-style") ? (
        <StepMotion stepKey="gift-style">
          {reached("details-quantity") ? (
            <>
              <UserBubble>
                {answers.styles.length > 0
                  ? answers.styles
                      .map((value) => optionLabel(giftStyleOptions, value))
                      .join(", ")
                  : "Open to suggestions"}
              </UserBubble>
              <PikuBubble>{stylesAck(answers.styles)}</PikuBubble>
            </>
          ) : null}
          {!reached("details-quantity") ? (
            <>
              <PikuBubble>
                What kind of gifts are you leaning towards? Pick as many as
                you like.
              </PikuBubble>
              <div className="flex flex-wrap gap-2">
                {giftStyleOptions.map((option) => {
                  const selected = answers.styles.includes(option.value);
                  return (
                    <Chip
                      key={option.value}
                      selected={selected}
                      onClick={() => {
                        props.patch({
                          styles: selected
                            ? answers.styles.filter((s) => s !== option.value)
                            : [...answers.styles, option.value],
                        });
                      }}
                    >
                      {option.label}
                    </Chip>
                  );
                })}
              </div>
              <PrimaryAction onClick={() => props.goTo("details-quantity")}>
                Continue
              </PrimaryAction>
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 05 — quantity */}
      {reached("details-quantity") ? (
        <StepMotion stepKey="details-quantity">
          {reached("details-date") && answers.quantity.trim() ? (
            <UserBubble>{answers.quantity.trim()}</UserBubble>
          ) : null}
          {!reached("details-date") ? (
            <>
              <PikuBubble>
                Now the practical bits. Roughly how many gifts are we talking?
              </PikuBubble>
              <input
                type="text"
                inputMode="numeric"
                value={answers.quantity}
                onChange={(event) => props.patch({ quantity: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") props.goTo("details-date");
                }}
                placeholder="e.g. 120"
                aria-label="Approximate quantity"
                className={fieldInputClasses}
              />
              <div className="flex items-center gap-5">
                <PrimaryAction onClick={() => props.goTo("details-date")}>
                  Continue
                </PrimaryAction>
                <SkipButton onClick={() => props.goTo("details-date")} />
              </div>
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 06 — delivery date */}
      {reached("details-date") ? (
        <StepMotion stepKey="details-date">
          {reached("details-location") && answers.deliveryDate.trim() ? (
            <UserBubble>{answers.deliveryDate.trim()}</UserBubble>
          ) : null}
          {!reached("details-location") ? (
            <>
              <PikuBubble>
                {answers.quantity.trim()
                  ? `Noted — ${answers.quantity.trim()} gifts. When do they need to arrive?`
                  : "When do they need to arrive?"}
              </PikuBubble>
              <input
                type="text"
                value={answers.deliveryDate}
                onChange={(event) =>
                  props.patch({ deliveryDate: event.target.value })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") props.goTo("details-location");
                }}
                placeholder="e.g. before Diwali, 12 March"
                aria-label="Delivery date"
                className={fieldInputClasses}
              />
              <div className="flex items-center gap-5">
                <PrimaryAction onClick={() => props.goTo("details-location")}>
                  Continue
                </PrimaryAction>
                <SkipButton onClick={() => props.goTo("details-location")} />
              </div>
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 07 — location */}
      {reached("details-location") ? (
        <StepMotion stepKey="details-location">
          {reached("details-budget") && answers.location.trim() ? (
            <UserBubble>{answers.location.trim()}</UserBubble>
          ) : null}
          {!reached("details-budget") ? (
            <>
              <PikuBubble>
                Where should they be delivered? A city — or several.
              </PikuBubble>
              <input
                type="text"
                value={answers.location}
                onChange={(event) => props.patch({ location: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") props.goTo("details-budget");
                }}
                placeholder="e.g. Jaipur, Mumbai, Delhi"
                aria-label="Delivery location"
                className={fieldInputClasses}
              />
              <div className="flex items-center gap-5">
                <PrimaryAction onClick={() => props.goTo("details-budget")}>
                  Continue
                </PrimaryAction>
                <SkipButton onClick={() => props.goTo("details-budget")} />
              </div>
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 08 — budget */}
      {reached("details-budget") ? (
        <StepMotion stepKey="details-budget">
          {reached("details-notes") && answers.budget ? (
            <>
              <UserBubble>
                {optionLabel(conciergeBudgetOptions, answers.budget)}
              </UserBubble>
              <PikuBubble>Perfect — that helps us shortlist well.</PikuBubble>
            </>
          ) : null}
          {!reached("details-notes") ? (
            <>
              <PikuBubble>Last practical one — what budget per gift feels right?</PikuBubble>
              <SingleSelectChips
                options={conciergeBudgetOptions}
                value={answers.budget}
                onPick={(value) =>
                  props.pickAndAdvance({ budget: value }, "details-notes")
                }
              />
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 09 — optional requirement */}
      {reached("details-notes") ? (
        <StepMotion stepKey="details-notes">
          {reached("confirm") && answers.requirement.trim() ? (
            <UserBubble>{answers.requirement.trim()}</UserBubble>
          ) : null}
          {!reached("confirm") ? (
            <>
              <PikuBubble>
                Anything else I should pass on? Brand colours, must-haves,
                things to avoid — or skip ahead.
              </PikuBubble>
              <textarea
                value={answers.requirement}
                onChange={(event) =>
                  props.patch({ requirement: event.target.value })
                }
                rows={3}
                placeholder="Anything the team should know…"
                aria-label="Any other requirement (optional)"
                className={cn(fieldInputClasses, "resize-y")}
              />
              <div className="flex items-center gap-5">
                <PrimaryAction onClick={() => props.goTo("confirm")}>
                  See my brief
                </PrimaryAction>
                <SkipButton onClick={() => props.goTo("confirm")} />
              </div>
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 10 — confirmation */}
      {reached("confirm") ? (
        <StepMotion stepKey="confirm">
          <PikuBubble>
            Perfect — I’ve got everything the team needs to start. Just your
            details, and I’ll hand this over.
          </PikuBubble>
          {step === "confirm" ? (
            <PrimaryAction onClick={() => props.goTo("contact")}>
              Continue
            </PrimaryAction>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 11 — basic details */}
      {reached("contact") ? (
        <StepMotion stepKey="contact">
          {!reached("brief") ? (
            <>
              <PikuBubble>Where should the team reach you?</PikuBubble>
              <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-card p-4 shadow-card">
                <ContactField
                  label="Name"
                  value={answers.name}
                  autoComplete="name"
                  placeholder="Asha Verma"
                  error={props.contactErrors.name}
                  onChange={(value) => {
                    props.patch({ name: value });
                    props.setContactErrors({ ...props.contactErrors, name: "" });
                  }}
                />
                <ContactField
                  label="Designation"
                  value={answers.designation}
                  autoComplete="organization-title"
                  placeholder="HR Manager"
                  error={props.contactErrors.designation}
                  onChange={(value) => {
                    props.patch({ designation: value });
                    props.setContactErrors({
                      ...props.contactErrors,
                      designation: "",
                    });
                  }}
                />
                <ContactField
                  label="Company"
                  value={answers.company}
                  autoComplete="organization"
                  placeholder="Acme Pvt Ltd"
                  error={props.contactErrors.company}
                  onChange={(value) => {
                    props.patch({ company: value });
                    props.setContactErrors({
                      ...props.contactErrors,
                      company: "",
                    });
                  }}
                />
                <ContactField
                  label="Phone"
                  type="tel"
                  value={answers.phone}
                  autoComplete="tel"
                  placeholder="+91 98XXX XXXXX"
                  error={props.contactErrors.phone}
                  onChange={(value) => {
                    props.patch({ phone: value });
                    props.setContactErrors({ ...props.contactErrors, phone: "" });
                  }}
                />
                <ContactField
                  label="Email"
                  type="email"
                  value={answers.email}
                  autoComplete="email"
                  placeholder="asha@acme.com"
                  error={props.contactErrors.email}
                  onChange={(value) => {
                    props.patch({ email: value });
                    props.setContactErrors({ ...props.contactErrors, email: "" });
                  }}
                />
                <div>
                  <label
                    htmlFor="piku-notes"
                    className="block text-sm font-medium text-ink"
                  >
                    Notes{" "}
                    <span className="font-normal text-ink-soft">(optional)</span>
                  </label>
                  <textarea
                    id="piku-notes"
                    value={answers.notes}
                    onChange={(event) => props.patch({ notes: event.target.value })}
                    rows={2}
                    placeholder="Anything else for the team…"
                    className={cn(fieldInputClasses, "mt-1.5 resize-y")}
                  />
                </div>
              </div>
              <PrimaryAction
                onClick={() => {
                  if (props.validateContact()) props.goTo("brief");
                }}
              >
                Review my brief
              </PrimaryAction>
            </>
          ) : (
            <PikuBubble>
              Thanks, {answers.name.trim().split(" ")[0] || "there"} — details saved.
            </PikuBubble>
          )}
        </StepMotion>
      ) : null}

      {/* State 12 — gifting brief summary */}
      {reached("brief") ? (
        <StepMotion stepKey="brief">
          {!reached("done") ? (
            <>
              <PikuBubble>
                Here’s your brief. Anything look off? Tap edit to fix it.
              </PikuBubble>
              <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
                <p className="border-b border-line bg-cream/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Your gifting brief
                </p>
                <dl className="divide-y divide-line px-4">
                  <BriefRow
                    label="Occasion"
                    value={
                      answers.occasion === "other"
                        ? answers.occasionOther.trim() || "Other"
                        : optionLabel(occasionOptions, answers.occasion)
                    }
                    onEdit={() => props.goTo("occasion")}
                  />
                  <BriefRow
                    label="Feeling"
                    value={optionLabel(feelingOptions, answers.feeling)}
                    onEdit={() => props.goTo("feeling")}
                  />
                  <BriefRow
                    label="Gift style"
                    value={
                      answers.styles.length > 0
                        ? answers.styles
                            .map((value) => optionLabel(giftStyleOptions, value))
                            .join(", ")
                        : "Open to suggestions"
                    }
                    onEdit={() => props.goTo("gift-style")}
                  />
                  <BriefRow
                    label="Quantity"
                    value={answers.quantity.trim() || "—"}
                    onEdit={() => props.goTo("details-quantity")}
                  />
                  <BriefRow
                    label="Delivery by"
                    value={answers.deliveryDate.trim() || "—"}
                    onEdit={() => props.goTo("details-date")}
                  />
                  <BriefRow
                    label="Location"
                    value={answers.location.trim() || "—"}
                    onEdit={() => props.goTo("details-location")}
                  />
                  <BriefRow
                    label="Budget"
                    value={optionLabel(conciergeBudgetOptions, answers.budget)}
                    onEdit={() => props.goTo("details-budget")}
                  />
                  {answers.requirement.trim() ? (
                    <BriefRow
                      label="Requirement"
                      value={answers.requirement.trim()}
                      onEdit={() => props.goTo("details-notes")}
                    />
                  ) : null}
                  <BriefRow
                    label="Contact"
                    value={`${answers.name.trim()} · ${answers.designation.trim()} · ${answers.company.trim()} · ${answers.phone.trim()} · ${answers.email.trim()}`}
                    onEdit={() => props.goTo("contact")}
                  />
                </dl>
              </div>
              <div className="flex flex-col gap-2.5">
                {props.submitStatus === "error" ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-[#B42318]/25 bg-[#B42318]/5 px-4 py-2.5 text-sm text-[#B42318]"
                  >
                    Something went wrong sending your brief. Please try again —
                    or continue on WhatsApp instead.
                  </p>
                ) : null}
                <div>
                  <button
                    type="button"
                    onClick={props.submitEnquiry}
                    disabled={props.submitStatus === "submitting"}
                    className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-paper transition-[background-color,transform] duration-200 ease-out hover:bg-accent-ink active:translate-y-px disabled:pointer-events-none disabled:opacity-70 motion-reduce:transition-none"
                  >
                    {props.submitStatus === "submitting" ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin motion-reduce:animate-none"
                        />
                        Sending…
                      </>
                    ) : (
                      <>
                        Connect with Gifting Team
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0"
                        />
                      </>
                    )}
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={props.openWhatsApp}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-6 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink/30 hover:bg-ink/[0.04] motion-reduce:transition-none"
                  >
                    Continue on WhatsApp
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </StepMotion>
      ) : null}

      {/* State 13 — done */}
      {step === "done" ? (
        <StepMotion stepKey="done">
          <PikuBubble>
            Thank you — your brief is with our gifting team. We’ll reach out
            within 48 hours with a shortlist and a quote.
          </PikuBubble>
          <div>
            <button
              type="button"
              onClick={props.openWhatsApp}
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-paper transition-[background-color,transform] duration-200 ease-out hover:bg-accent-ink active:translate-y-px motion-reduce:transition-none"
            >
              Continue on WhatsApp
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0"
              />
            </button>
          </div>
        </StepMotion>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contact field + brief row                                           */
/* ------------------------------------------------------------------ */

function ContactField({
  label,
  type = "text",
  value,
  autoComplete,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `piku-${label.toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}{" "}
        <span aria-hidden="true" className="text-gold">
          *
        </span>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn("mt-1.5", error ? fieldErrorClasses : fieldInputClasses)}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-[#B42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function BriefRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right text-sm leading-relaxed text-ink">
        {value}{" "}
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${label.toLowerCase()}`}
          className="ml-1 font-medium text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:text-accent-ink"
        >
          Edit
        </button>
      </dd>
    </div>
  );
}