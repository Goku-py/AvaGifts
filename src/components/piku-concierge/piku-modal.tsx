"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Headset, Loader2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { PikuSprite } from "@/components/piku/piku-sprite";
import { PIKU_ENQUIRY_SENT_EVENT } from "@/lib/events";
import { EASE, SPRING_BOUNCY, SPRING_EMERGE, SPRING_FIRM, SPRING_SNAPPY, SPRING_SOFT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import "./piku-concierge.css";
import {
  buildWhatsAppUrl,
  conciergeBudgetOptions,
  conciergeStages,
  emptyConciergeAnswers,
  feelingAck,
  feelingOptions,
  giftStyleOptions,
  occasionAck,
  occasionOptions,
  optionLabel,
  stageIndex,
  stylesAck,
  type ConciergeAnswers,
  type ConciergeOption,
  type ConciergeStep,
} from "@/lib/piku-concierge";
import { usePikuConcierge } from "./piku-concierge-context";

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

/* Mass contrast: Piku's bubbles arrive light and bouncy; the user's own
   replies land on a heavier, more deliberate spring. The overshoot doubles
   as the "ack beat" after each answer. */
/**
 * Piku's face at bubble scale — a deliberately tiny stand-in for the full
 * sprite. Every one of Piku's turns carries one so the panel reads as a
 * conversation with someone rather than a form, and the full sprite would be
 * hundreds of DOM nodes per turn.
 */
function PikuFace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="16" fill="#0B2A4D" />
      <ellipse cx="16" cy="18.5" rx="8" ry="9" fill="#F5F0E8" />
      <circle cx="12.4" cy="13.6" r="3.1" fill="#fff" />
      <circle cx="19.6" cy="13.6" r="3.1" fill="#fff" />
      <circle cx="12.9" cy="14" r="1.35" fill="#1B1E25" />
      <circle cx="19.1" cy="14" r="1.35" fill="#1B1E25" />
      <path d="M14.2 18.4h3.6l-1.8 2.4-1.8-2.4Z" fill="#FF9A4D" />
    </svg>
  );
}

function PikuBubble({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      data-bubble="piku"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : SPRING_BOUNCY}
      className="flex max-w-[92%] items-start gap-2.5"
    >
      <PikuFace className="piku-face mt-0.5 size-7 shrink-0" />
      <div className="piku-said rounded-2xl rounded-tl-md border border-divider bg-white px-4 py-3 text-sm leading-relaxed text-text-primary shadow-card">
        {children}
      </div>
    </motion.div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      data-bubble="user"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : SPRING_FIRM}
      /* interactive-hover (#0e63cc), not interactive (#1273eb): white on the
         lighter blue measures 4.49:1, a hair under AA. Same palette, and the
         deeper blue reads better as a filled message bubble anyway.
         `piku-said` keeps both sides of the conversation at one size. */
      className="piku-said ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-interactive-hover px-4 py-2.5 leading-relaxed text-white"
    >
      {children}
    </motion.div>
  );
}

/* Typing presence: three dots, 1-2-3 cascade, shown briefly before each
   new Piku question lands. Decorative — hidden from assistive tech. */
function TypingBubble() {
  return (
    <div
      aria-hidden="true"
      className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-md border border-divider bg-white px-4 py-3.5 shadow-card"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1.5 rounded-full bg-text-secondary animate-piku-typing"
          style={{ animationDelay: `${dot * 0.18}s` }}
        />
      ))}
    </div>
  );
}

/* Done-state celebration: a dozen gold/accent/cream dots burst from the
   thank-you bubble and fade within ~900ms. Fires once — it mounts with the
   done step. Not rendered under reduced motion (the CSS guard would leave
   static dots behind). Decorative — hidden from assistive tech. */
const CONFETTI_COUNT = 12;
const CONFETTI_COLORS = ["#1273EB", "#FFDE59", "#0B2A4D", "#51F8B0"];

function Celebration() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      {Array.from({ length: CONFETTI_COUNT }, (_, index) => {
        const angle = (index / CONFETTI_COUNT) * Math.PI * 2 + 0.4;
        const distance = 44 + (index % 4) * 12;
        return (
          <span
            key={index}
            className="absolute left-8 top-6 size-1.5 rounded-full animate-piku-confetti"
            style={
              {
                backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                animationDelay: `${index * 0.025}s`,
                "--confetti-x": `${Math.round(Math.cos(angle) * distance)}px`,
                "--confetti-y": `${Math.round(Math.sin(angle) * distance - 24)}px`,
                "--confetti-r": `${((index * 47) % 360) - 180}deg`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  index = 0,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  /** Position in its row — drives the 35ms stagger pop-in. */
  index?: number;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduceMotion ? { duration: 0 } : { ...SPRING_SNAPPY, delay: index * 0.035 }
      }
      whileTap={
        reduceMotion
          ? undefined
          : {
              /* Keyframe bounce needs its own tween: springs only support
                 two keyframes and would throw at runtime. */
              scale: [0.94, 1.04, 1],
              transition: { duration: 0.28, ease: EASE },
            }
      }
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium",
        "transition-[background-color,border-color,color] duration-200 ease-out motion-reduce:transition-none",
        selected
          ? "border-interactive-hover bg-interactive-hover text-white"
          : "border-interactive bg-white text-text-primary hover:bg-surface",
      )}
    >
      <AnimatePresence initial={false}>
        {selected ? (
          <motion.span
            key="chip-check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={reduceMotion ? { duration: 0 } : SPRING_SNAPPY}
            className="flex"
          >
            <Check aria-hidden="true" className="size-3.5" />
          </motion.span>
        ) : null}
      </AnimatePresence>
      {children}
    </motion.button>
  );
}

/** How long Piku "types" before a new question lands (ms). */
const TYPING_MS = 650;

function StepMotion({
  stepKey,
  instant,
  state = "done",
  children,
}: {
  stepKey: string;
  /**
   * Skip the typing beat — for blocks already on screen when the modal
   * opens (intro). Every other block mounts exactly when its step is
   * reached, so the typing presence plays automatically, zero call-site
   * choreography needed.
   */
  instant?: boolean;
  /**
   * Whether this block is the question being asked right now.
   *
   * Passed explicitly rather than derived from DOM position. The previous
   * `:last-child` rule broke on the intro step — which renders the
   * greeting and the start button as two separate blocks, so the greeting
   * was styled as answered history — and again whenever a skipped step
   * was the last block rendered.
   */
  state?: "live" | "done";
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const skipTyping = instant || reduceMotion;
  const [typed, setTyped] = useState(skipTyping);
  useEffect(() => {
    if (skipTyping) return;
    const timer = setTimeout(() => setTyped(true), TYPING_MS);
    return () => clearTimeout(timer);
  }, [skipTyping]);

  /* When the block reveals, bring it into view inside the scroll region. */
  useEffect(() => {
    if (!typed || reduceMotion) return;
    document
      .getElementById("piku-scroll-region")
      ?.querySelector(`[data-step-block="${stepKey}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [typed, stepKey, reduceMotion]);

  if (!typed) {
    return (
      <div key={stepKey} data-state={state} className="piku-turn flex flex-col gap-3">
        <TypingBubble />
      </div>
    );
  }
  return (
    <motion.div
      key={stepKey}
      data-step-block={stepKey}
      data-state={state}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }}
      className="piku-turn flex flex-col gap-3"
    >
      {children}
    </motion.div>
  );
}

const fieldInputClasses =
  "w-full rounded-xl border border-neutral-600 bg-white px-4 py-3 text-sm text-text-primary transition-colors duration-200 placeholder:text-text-secondary hover:border-primary focus:border-interactive focus:outline-none focus:ring-2 focus:ring-interactive/25";

const fieldErrorClasses =
  "w-full rounded-xl border border-danger bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/25";

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

type SubmitStatus = "idle" | "submitting" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Contact rules, shared by the details form and the brief inline editor. */
function contactErrorsFor(values: ConciergeAnswers): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.name.trim().length < 2) errors.name = "Please share your name.";
  if (!values.designation.trim())
    errors.designation = "Please share your designation.";
  if (!values.company.trim()) errors.company = "Please share your company.";
  if (values.phone.trim().length < 7)
    errors.phone = "Please enter a valid phone number.";
  if (!EMAIL_PATTERN.test(values.email.trim()))
    errors.email = "Please enter a valid email address.";
  return errors;
}

export function PikuModal() {
  const { isOpen, closeConcierge, pendingStep, clearPendingStep } =
    usePikuConcierge();
  const [step, setStep] = useState<ConciergeStep>("intro");
  const [answers, setAnswers] = useState<ConciergeAnswers>(emptyConciergeAnswers);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

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

  /* Jump to a requested step on open (e.g. "Send a Gifting Brief" opens
     the contact step directly). Plain opens resume untouched. */
  useEffect(() => {
    if (!isOpen || !pendingStep) return;
    setStep(pendingStep);
    clearPendingStep();
  }, [isOpen, pendingStep, clearPendingStep]);

  /* Scroll-lock + Esc + initial focus + focus trap while open */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeConcierge();
        return;
      }
      if (event.key !== "Tab") return;

      /*
       * Trap Tab inside the panel. `aria-modal` tells assistive tech to
       * ignore the page behind, but it does nothing for keyboard focus —
       * without this, tabbing past the last control walked into the header
       * and nav underneath the open dialog.
       */
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeConcierge]);

  /* Smooth-scroll the latest message into view. Skipped while the user is
     typing in a field (scrolling would yank the caret out of sight), and
     instant under reduced motion. */
  useEffect(() => {
    if (!isOpen) return;
    const node = scrollRef.current;
    if (!node) return;
    const active = document.activeElement;
    if (
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement
    ) {
      return;
    }
    if (reduceMotion) {
      node.scrollTop = node.scrollHeight;
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [isOpen, step, answers, reduceMotion]);

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
    const errors = contactErrorsFor(answers);
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  }, [answers]);

  const validateContactValues = useCallback(
    (values: ConciergeAnswers): Record<string, string> =>
      contactErrorsFor(values),
    [],
  );

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
      /* Tell the mascot — it celebrates when the flow closes. */
      window.dispatchEvent(new CustomEvent(PIKU_ENQUIRY_SENT_EVENT));
    } catch {
      setSubmitStatus("error");
    } finally {
      setSubmitStatus((current) => (current === "submitting" ? "idle" : current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, submitStatus]);

  const stage = stageIndex(step);
  const showProgress = stage >= 0;
  const stagesLeft = showProgress ? conciergeStages.length - (stage + 1) : 0;
  const showBack = step !== "intro" && step !== "done";

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="piku-backdrop"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE }
          }
          className="fixed inset-0 z-[95] flex items-end justify-center bg-primary/60 sm:items-center sm:p-6"
          onClick={closeConcierge}
        >
          <motion.div
            key="piku-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Chat with Piku — gifting concierge"
            initial={{ opacity: 0, y: 96, x: 48, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, x: 24, scale: 0.96 }}
            transition={reduceMotion ? { duration: 0 } : SPRING_EMERGE}
            ref={panelRef}
            onClick={(event) => event.stopPropagation()}
            /* min-h keeps short states (intro, done) from rendering as a
               512px-wide, ~180px-tall sliver, and stops the card resizing
               dramatically between steps while it is centred. */
            className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[88vh] sm:min-h-[420px] sm:max-w-lg sm:origin-bottom-right sm:rounded-2xl sm:shadow-lift"
          >
            {/* Top — identity + support + close */}
            <div className="flex items-center gap-3 border-b border-divider bg-white px-4 py-3 sm:px-5">
              {/* Header avatar: calm and still, periodic blink only */}
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface [&_svg]:size-8"
              >
                <span className="flex animate-piku-blink">
                  <PikuSprite emotion="happy" />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-semibold leading-tight tracking-[-0.01em]">
                  Piku
                </span>
                <span className="block truncate text-xs text-text-secondary">
                  Your gifting concierge
                </span>
              </span>
              <button
                type="button"
                onClick={openWhatsApp}
                title="Talk to our gifting team on WhatsApp — your brief so far comes along"
                aria-label="Support — talk to our gifting team on WhatsApp with your brief so far"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-interactive-hover px-3.5 py-2 text-xs font-semibold text-interactive-hover transition-colors duration-200 hover:bg-interactive-hover hover:text-white motion-reduce:transition-none"
              >
                <Headset aria-hidden="true" className="size-4" />
                Support
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={closeConcierge}
                aria-label="Close chat with Piku"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-hover-surface hover:text-text-primary"
              >
                <X aria-hidden="true" className="size-4.5" />
              </button>
            </div>

            {/*
              Progress — a single hairline bar with one quiet caption.
              Three numbered pills, three labels and a "N to go" line stacked
              above the question was more chrome than the question itself.
            */}
            {showProgress ? (
              <div className="bg-white px-4 pb-2.5 pt-1 sm:px-5">
                <div
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={conciergeStages.length}
                  aria-valuenow={stage + 1}
                  aria-label={`Step ${stage + 1} of ${conciergeStages.length}: ${conciergeStages[stage].label}`}
                  className="flex items-center gap-1.5"
                >
                  {conciergeStages.map((item, index) => (
                    <span
                      key={item.id}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors duration-300",
                        index <= stage ? "bg-interactive" : "bg-divider",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs font-medium leading-normal text-text-secondary">
                  {conciergeStages[stage].label}
                  <span className="text-text-secondary">
                    {" · "}
                    {stagesLeft > 0 ? `${stagesLeft} to go` : "last step"}
                  </span>
                </p>
              </div>
            ) : null}

            {/* Middle — conversation (footer removed: team handoff now lives in the header Support button) */}
            <div
              ref={scrollRef}
              id="piku-scroll-region"
              className="piku-scroll piku-thread flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-5 pt-3 sm:px-5"
            >
              <Conversation
                step={step}
                answers={answers}
                patch={patch}
                goTo={goTo}
                pickAndAdvance={pickAndAdvance}
                contactErrors={contactErrors}
                setContactErrors={setContactErrors}
                validateContact={validateContact}
                validateContactValues={validateContactValues}
                submitStatus={submitStatus}
                submitEnquiry={submitEnquiry}
                openWhatsApp={openWhatsApp}
              />
            </div>

            {/* Bottom bar — Back lives here rather than above the transcript,
                where it competed with the question for first read. Each step's
                own Continue action sits directly above it. */}
            {showBack ? (
              <div className="flex items-center justify-between gap-3 border-t border-divider bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-hover-surface hover:text-text-primary motion-reduce:transition-none"
                >
                  <ArrowLeft aria-hidden="true" className="size-3.5" />
                  Back
                </button>
                <p className="text-xs text-text-secondary">
                  Takes about two minutes
                </p>
              </div>
            ) : null}
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
  validateContactValues: (
    values: ConciergeAnswers,
  ) => Record<string, string>;
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
      {options.map((option, index) => (
        <Chip
          key={option.value}
          index={index}
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
        className="group inline-flex h-11 items-center gap-2 rounded-full bg-interactive px-6 text-sm font-medium text-white transition-[background-color,transform] duration-200 ease-out hover:bg-interactive-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
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
        className="text-sm font-medium text-text-secondary underline decoration-primary/25 underline-offset-4 transition-colors hover:text-text-primary"
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

  /*
   * Which block is being asked right now. Stated explicitly rather than
   * inferred from DOM position: the intro renders two blocks (greeting +
   * start button), so a `:last-child` rule styled the greeting as answered
   * history — the bug that made the opening screen unreadable.
   */
  const stateFor = (blockStep: ConciergeStep): "live" | "done" =>
    step === blockStep ? "live" : "done";

  return (
    <div className="mt-auto flex flex-col">
      {/* State 01 — intro */}
      <StepMotion stepKey="intro" instant state={stateFor("intro")}>
        <PikuBubble>
          Hi, I’m Piku. I help teams find gifts people actually keep. Two
          minutes, a few quick questions — shall we start?
        </PikuBubble>
      </StepMotion>
      {step === "intro" ? (
        <StepMotion stepKey="intro-action" instant state="live">
          <PrimaryAction onClick={() => props.goTo("occasion")}>
            Let’s start
          </PrimaryAction>
        </StepMotion>
      ) : null}

      {/* State 02 — occasion */}
      {reached("occasion") ? (
        <StepMotion stepKey="occasion" state={stateFor("occasion")}>
          <PikuBubble>First — what’s the occasion?</PikuBubble>
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
        <StepMotion stepKey="feeling" state={stateFor("feeling")}>
          <PikuBubble>And how should it make them feel?</PikuBubble>
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
        <StepMotion stepKey="gift-style" state={stateFor("gift-style")}>
          <PikuBubble>
            What kind of gifts are you leaning towards? Pick as many as
            you like.
          </PikuBubble>
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
              <div className="flex flex-wrap gap-2">
                {giftStyleOptions.map((option, index) => {
                  const selected = answers.styles.includes(option.value);
                  return (
                    <Chip
                      key={option.value}
                      index={index}
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
        <StepMotion stepKey="details-quantity" state={stateFor("details-quantity")}>
          <PikuBubble>
            Now the practical bits. Roughly how many gifts are we talking?
          </PikuBubble>
          {reached("details-date") && answers.quantity.trim() ? (
            <UserBubble>{answers.quantity.trim()}</UserBubble>
          ) : null}
          {!reached("details-date") ? (
            <>
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
        <StepMotion stepKey="details-date" state={stateFor("details-date")}>
          <PikuBubble>
            {answers.quantity.trim()
              ? `Noted — ${answers.quantity.trim()} gifts. When do they need to arrive?`
              : "When do they need to arrive?"}
          </PikuBubble>
          {reached("details-location") && answers.deliveryDate.trim() ? (
            <UserBubble>{answers.deliveryDate.trim()}</UserBubble>
          ) : null}
          {!reached("details-location") ? (
            <>
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
        <StepMotion stepKey="details-location" state={stateFor("details-location")}>
          <PikuBubble>
            Where should they be delivered? A city — or several.
          </PikuBubble>
          {reached("details-budget") && answers.location.trim() ? (
            <UserBubble>{answers.location.trim()}</UserBubble>
          ) : null}
          {!reached("details-budget") ? (
            <>
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
        <StepMotion stepKey="details-budget" state={stateFor("details-budget")}>
          <PikuBubble>Last practical one — what budget per gift feels right?</PikuBubble>
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
        <StepMotion stepKey="details-notes" state={stateFor("details-notes")}>
          <PikuBubble>
            Anything else I should pass on? Brand colours, must-haves,
            things to avoid — or skip ahead.
          </PikuBubble>
          {reached("confirm") && answers.requirement.trim() ? (
            <UserBubble>{answers.requirement.trim()}</UserBubble>
          ) : null}
          {!reached("confirm") ? (
            <>
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
        <StepMotion stepKey="confirm" state={stateFor("confirm")}>
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
        <StepMotion stepKey="contact" state={stateFor("contact")}>
          {!reached("brief") ? (
            <>
              <PikuBubble>Where should the team reach you?</PikuBubble>
              <div className="flex flex-col gap-3.5 rounded-2xl border border-divider bg-white p-4 shadow-card">
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
                    className="block text-sm font-medium text-text-primary"
                  >
                    Notes{" "}
                    <span className="font-normal text-text-secondary">(optional)</span>
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
        <StepMotion stepKey="brief" state={stateFor("brief")}>
          {!reached("done") ? (
            <>
              <PikuBubble>
                Here’s your brief. Anything look off? Tap edit to fix it.
              </PikuBubble>
              <div className="overflow-hidden rounded-2xl border border-divider bg-white shadow-card">
                <p className="border-b border-divider bg-surface/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                  Your gifting brief
                </p>
                <dl className="divide-y divide-divider px-4">
                  <BriefSingleRow
                    label="Occasion"
                    display={
                      answers.occasion === "other"
                        ? answers.occasionOther.trim() || "Other"
                        : optionLabel(occasionOptions, answers.occasion)
                    }
                    options={occasionOptions}
                    value={answers.occasion}
                    onPick={(value) => props.patch({ occasion: value })}
                    other={{
                      text: answers.occasionOther,
                      placeholder: "Tell us the occasion",
                      ariaLabel: "Describe the occasion",
                      onSave: (text) => {
                        props.patch({
                          occasion: "other",
                          occasionOther: text,
                        });
                      },
                    }}
                  />
                  <BriefSingleRow
                    label="Feeling"
                    display={optionLabel(feelingOptions, answers.feeling)}
                    options={feelingOptions}
                    value={answers.feeling}
                    onPick={(value) => props.patch({ feeling: value })}
                  />
                  <BriefMultiRow
                    label="Gift style"
                    display={
                      answers.styles.length > 0
                        ? answers.styles
                            .map((value) => optionLabel(giftStyleOptions, value))
                            .join(", ")
                        : "Open to suggestions"
                    }
                    options={giftStyleOptions}
                    value={answers.styles}
                    onSave={(styles) => props.patch({ styles })}
                  />
                  <BriefTextRow
                    label="Quantity"
                    display={answers.quantity.trim() || "—"}
                    value={answers.quantity}
                    placeholder="e.g. 120"
                    ariaLabel="Approximate quantity"
                    inputMode="numeric"
                    onSave={(quantity) => props.patch({ quantity })}
                  />
                  <BriefTextRow
                    label="Delivery by"
                    display={answers.deliveryDate.trim() || "—"}
                    value={answers.deliveryDate}
                    placeholder="e.g. before Diwali, 12 March"
                    ariaLabel="Delivery date"
                    onSave={(deliveryDate) => props.patch({ deliveryDate })}
                  />
                  <BriefTextRow
                    label="Location"
                    display={answers.location.trim() || "—"}
                    value={answers.location}
                    placeholder="e.g. Jaipur, Mumbai, Delhi"
                    ariaLabel="Delivery location"
                    onSave={(location) => props.patch({ location })}
                  />
                  <BriefSingleRow
                    label="Budget"
                    display={optionLabel(conciergeBudgetOptions, answers.budget)}
                    options={conciergeBudgetOptions}
                    value={answers.budget}
                    onPick={(value) => props.patch({ budget: value })}
                  />
                  {answers.requirement.trim() ? (
                    <BriefTextRow
                      label="Requirement"
                      display={answers.requirement.trim()}
                      value={answers.requirement}
                      placeholder="Anything the team should know…"
                      ariaLabel="Any other requirement"
                      multiline
                      onSave={(requirement) => props.patch({ requirement })}
                    />
                  ) : null}
                  <BriefContactRow
                    display={`${answers.name.trim()} · ${answers.designation.trim()} · ${answers.company.trim()} · ${answers.phone.trim()} · ${answers.email.trim()}`}
                    initial={{
                      name: answers.name,
                      designation: answers.designation,
                      company: answers.company,
                      phone: answers.phone,
                      email: answers.email,
                    }}
                    validate={props.validateContactValues}
                    onSave={(contact) => {
                      props.patch(contact);
                      props.setContactErrors({});
                    }}
                  />
                </dl>
              </div>
              <div className="flex flex-col gap-2.5">
                {props.submitStatus === "error" ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-danger/25 bg-danger-surface px-4 py-2.5 text-sm text-danger"
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
                    className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-interactive px-6 text-sm font-medium text-white transition-[background-color,transform] duration-200 ease-out hover:bg-interactive-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-70 motion-reduce:transition-none"
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
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-600 px-6 text-sm font-medium text-text-primary transition-colors duration-200 hover:border-primary hover:bg-primary/[0.04] motion-reduce:transition-none"
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
        <StepMotion stepKey="done" state={stateFor("done")}>
          <div className="relative">
            <Celebration />
            <PikuBubble>
              Thank you — your brief is with our gifting team. We’ll reach out
              within 48 hours with a shortlist and a quote.
            </PikuBubble>
          </div>
          <div>
            <button
              type="button"
              onClick={props.openWhatsApp}
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-interactive px-6 text-sm font-medium text-white transition-[background-color,transform] duration-200 ease-out hover:bg-interactive-hover active:translate-y-px motion-reduce:transition-none"
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
      <label htmlFor={id} className="block text-sm font-medium text-text-primary">
        {label}{" "}
        <span aria-hidden="true" className="text-danger">
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
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Brief summary — inline answer editors (no flow walk-back)           */
/* ------------------------------------------------------------------ */

function BriefRowShell({
  label,
  editing,
  onToggleEdit,
  display,
  children,
}: {
  label: string;
  editing: boolean;
  onToggleEdit: () => void;
  display: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="py-2.5">
      <div className="flex items-start justify-between gap-3">
        <dt className="shrink-0 text-xs font-medium uppercase tracking-[0.08em] text-text-secondary">
          {label}
        </dt>
        <dd className="min-w-0 flex-1 text-right text-sm leading-relaxed text-text-primary">
          {!editing ? display : null}{" "}
          <button
            type="button"
            onClick={onToggleEdit}
            aria-expanded={editing}
            aria-label={
              editing ? `Close ${label.toLowerCase()} editor` : `Edit ${label.toLowerCase()}`
            }
            className="ml-1 font-medium text-interactive underline decoration-interactive/30 underline-offset-2 transition-colors hover:text-interactive-hover"
          >
            {editing ? "Done" : "Edit"}
          </button>
        </dd>
      </div>
      {editing ? <div className="mt-2.5">{children}</div> : null}
    </div>
  );
}

function BriefMiniButton({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
        primary
          ? "bg-interactive text-white hover:bg-interactive-hover"
          : "border border-neutral-600 text-text-primary hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

/** Single-select answers — chips save on pick. */
function BriefSingleRow({
  label,
  display,
  options,
  value,
  onPick,
  other,
}: {
  label: string;
  display: ReactNode;
  options: ConciergeOption[];
  value: string | null;
  onPick: (value: string) => void;
  other?: {
    text: string;
    placeholder: string;
    ariaLabel: string;
    onSave: (text: string) => void;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");
  const openEditor = () => {
    setOtherDraft(other?.text ?? "");
    setOtherOpen(value === "other");
    setEditing(true);
  };
  const saveOther = () => {
    const trimmed = otherDraft.trim();
    if (!trimmed || !other) return;
    other.onSave(trimmed);
    setEditing(false);
    setOtherOpen(false);
  };
  return (
    <BriefRowShell
      label={label}
      display={display}
      editing={editing}
      onToggleEdit={() => (editing ? setEditing(false) : openEditor())}
    >
      <SingleSelectChips
        options={options}
        value={value}
        onPick={(picked) => {
          if (other && picked === "other") {
            setOtherDraft(other.text);
            setOtherOpen(true);
            return;
          }
          onPick(picked);
          setEditing(false);
          setOtherOpen(false);
        }}
      />
      {other && (otherOpen || value === "other") ? (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={otherDraft}
            onChange={(event) => setOtherDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveOther();
            }}
            placeholder={other.placeholder}
            aria-label={other.ariaLabel}
            className={fieldInputClasses}
          />
          <BriefMiniButton
            primary
            onClick={saveOther}
            disabled={!otherDraft.trim()}
          >
            Save
          </BriefMiniButton>
        </div>
      ) : null}
    </BriefRowShell>
  );
}

/** Multi-select answers — chips toggle a draft, Save commits. */
function BriefMultiRow({
  label,
  display,
  options,
  value,
  onSave,
}: {
  label: string;
  display: ReactNode;
  options: ConciergeOption[];
  value: string[];
  onSave: (value: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  return (
    <BriefRowShell
      label={label}
      display={display}
      editing={editing}
      onToggleEdit={() => {
        if (!editing) setDraft(value);
        setEditing(!editing);
      }}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const selected = draft.includes(option.value);
          return (
            <Chip
              key={option.value}
              index={index}
              selected={selected}
              onClick={() =>
                setDraft(
                  selected
                    ? draft.filter((s) => s !== option.value)
                    : [...draft, option.value],
                )
              }
            >
              {option.label}
            </Chip>
          );
        })}
      </div>
      <div className="mt-2.5 flex gap-2">
        <BriefMiniButton
          primary
          onClick={() => {
            onSave(draft);
            setEditing(false);
          }}
        >
          Save
        </BriefMiniButton>
        <BriefMiniButton onClick={() => setEditing(false)}>
          Cancel
        </BriefMiniButton>
      </div>
    </BriefRowShell>
  );
}

/** Free-text answers — draft with Save/Cancel. */
function BriefTextRow({
  label,
  display,
  value,
  placeholder,
  ariaLabel,
  multiline = false,
  inputMode,
  onSave,
}: {
  label: string;
  display: ReactNode;
  value: string;
  placeholder: string;
  ariaLabel: string;
  multiline?: boolean;
  inputMode?: "numeric" | "text";
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const save = () => {
    onSave(draft.trim());
    setEditing(false);
  };
  return (
    <BriefRowShell
      label={label}
      display={display}
      editing={editing}
      onToggleEdit={() => {
        if (!editing) setDraft(value);
        setEditing(!editing);
      }}
    >
      {multiline ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn(fieldInputClasses, "resize-y")}
        />
      ) : (
        <input
          type="text"
          inputMode={inputMode}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={fieldInputClasses}
        />
      )}
      <div className="mt-2 flex gap-2">
        <BriefMiniButton primary onClick={save}>
          Save
        </BriefMiniButton>
        <BriefMiniButton onClick={() => setEditing(false)}>
          Cancel
        </BriefMiniButton>
      </div>
    </BriefRowShell>
  );
}

/** Contact answers — draft of all five fields, validated on save. */
function BriefContactRow({
  display,
  initial,
  validate,
  onSave,
}: {
  display: ReactNode;
  initial: {
    name: string;
    designation: string;
    company: string;
    phone: string;
    email: string;
  };
  validate: (values: ConciergeAnswers) => Record<string, string>;
  onSave: (values: {
    name: string;
    designation: string;
    company: string;
    phone: string;
    email: string;
  }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <BriefRowShell
      label="Contact"
      display={display}
      editing={editing}
      onToggleEdit={() => {
        if (!editing) {
          setDraft(initial);
          setErrors({});
        }
        setEditing(!editing);
      }}
    >
      <div className="flex flex-col gap-3">
        <ContactField
          label="Name"
          value={draft.name}
          autoComplete="name"
          placeholder="Asha Verma"
          error={errors.name}
          onChange={(value) => {
            setDraft({ ...draft, name: value });
            setErrors({ ...errors, name: "" });
          }}
        />
        <ContactField
          label="Designation"
          value={draft.designation}
          autoComplete="organization-title"
          placeholder="HR Manager"
          error={errors.designation}
          onChange={(value) => {
            setDraft({ ...draft, designation: value });
            setErrors({ ...errors, designation: "" });
          }}
        />
        <ContactField
          label="Company"
          value={draft.company}
          autoComplete="organization"
          placeholder="Acme Pvt Ltd"
          error={errors.company}
          onChange={(value) => {
            setDraft({ ...draft, company: value });
            setErrors({ ...errors, company: "" });
          }}
        />
        <ContactField
          label="Phone"
          type="tel"
          value={draft.phone}
          autoComplete="tel"
          placeholder="+91 98XXX XXXXX"
          error={errors.phone}
          onChange={(value) => {
            setDraft({ ...draft, phone: value });
            setErrors({ ...errors, phone: "" });
          }}
        />
        <ContactField
          label="Email"
          type="email"
          value={draft.email}
          autoComplete="email"
          placeholder="asha@acme.com"
          error={errors.email}
          onChange={(value) => {
            setDraft({ ...draft, email: value });
            setErrors({ ...errors, email: "" });
          }}
        />
        <div className="flex gap-2">
          <BriefMiniButton
            primary
            onClick={() => {
              const errs = validate({
                ...emptyConciergeAnswers,
                ...draft,
              });
              setErrors(errs);
              if (Object.keys(errs).length === 0) {
                onSave(draft);
                setEditing(false);
              }
            }}
          >
            Save
          </BriefMiniButton>
          <BriefMiniButton onClick={() => setEditing(false)}>
            Cancel
          </BriefMiniButton>
        </div>
      </div>
    </BriefRowShell>
  );
}