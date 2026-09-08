"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { categories, company, finalConversion } from "@/lib/data";
import {
  budgetOptions,
  enquirySchema,
  fieldErrorsFrom,
  type EnquiryField,
} from "@/lib/enquiry";
import { usePikuConcierge } from "@/components/piku-concierge/piku-concierge-context";
import { glanceHandlers } from "@/lib/piku-glance";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Form plumbing                                                       */
/* ------------------------------------------------------------------ */

type Status = "idle" | "submitting" | "success" | "error";

const EMPTY_VALUES: Record<EnquiryField, string> = {
  name: "",
  company: "",
  email: "",
  phone: "",
  occasion: "",
  quantity: "",
  budget: "not-sure",
  message: "",
};

const SELECT_CHEVRON =
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23495057%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.9rem_center] bg-no-repeat pr-9 appearance-none";

const inputClasses = (invalid: boolean) =>
  cn(
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 placeholder:text-text-muted",
    invalid
      ? "border-danger focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/25"
      : "border-neutral-300 hover:border-neutral-400 focus:border-interactive focus:outline-none focus:ring-2 focus:ring-interactive/25",
  );

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function FinalConversion() {
  const { openConcierge } = usePikuConcierge();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<EnquiryField, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);

  const setValue = (field: EnquiryField, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
    if (status === "error") setStatus("idle"); // clear stale failure banner on edit
  };

  const validateField = (field: EnquiryField) => {
    const result = enquirySchema.shape[field].safeParse(values[field]);
    setErrors((previous) => ({
      ...previous,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return; // guard double-submit

    const parsed = enquirySchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = fieldErrorsFrom(parsed.error);
      setErrors(fieldErrors);
      const firstInvalid = (Object.keys(fieldErrors) as EnquiryField[]).find(
        (field) => fieldErrors[field],
      );
      if (firstInvalid) {
        formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      }
      return;
    }

    setErrors({});
    setStatus("submitting");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error(`Enquiry failed with status ${response.status}`);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const reset = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setStatus("idle");
  };

  const fieldProps = (field: EnquiryField) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: (
      event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => setValue(field, event.target.value),
    onBlur: () => validateField(field),
    "aria-invalid": errors[field] ? (true as const) : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <Section id="contact" labelledBy="contact-heading" tone="surface" data-piku="contact">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Copy + CTAs + contact rows */}
        <div>
          <Reveal>
            <Eyebrow>{finalConversion.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="contact-heading" className="text-h2 mt-4 font-sans text-text-primary">
              {finalConversion.title}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-body-lg mt-4 max-w-md text-text-secondary">
              {finalConversion.lede}
            </p>
          </Reveal>

          <Reveal delay={0.22}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => openConcierge()}
                {...glanceHandlers}
              >
                {finalConversion.quoteCta}
              </Button>
              <ButtonLink
                variant="secondary"
                size="lg"
                href={`mailto:${company.email}`}
              >
                {finalConversion.expertCta}
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={0.28}>
            <ul className="mt-10 space-y-4">
              <li>
                <a
                  href={`mailto:${company.email}`}
                  className="group flex items-center gap-3.5 text-sm text-text-primary"
                >
                  <span className="flex size-10 items-center justify-center rounded-full border border-divider bg-white transition-colors duration-200 group-hover:border-interactive/50">
                    <Mail aria-hidden="true" className="size-4 text-interactive" />
                  </span>
                  <span className="font-medium transition-colors group-hover:text-interactive">
                    {company.email}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={company.phoneHref}
                  className="group flex items-center gap-3.5 text-sm text-text-primary"
                >
                  <span className="flex size-10 items-center justify-center rounded-full border border-divider bg-white transition-colors duration-200 group-hover:border-interactive/50">
                    <Phone aria-hidden="true" className="size-4 text-interactive" />
                  </span>
                  <span className="font-medium transition-colors group-hover:text-interactive">
                    {company.phoneDisplay}
                  </span>
                </a>
              </li>
              <li className="flex items-center gap-3.5 text-sm text-text-primary">
                <span className="flex size-10 items-center justify-center rounded-full border border-divider bg-white">
                  <MapPin aria-hidden="true" className="size-4 text-interactive" />
                </span>
                <span className="font-medium">{company.cities}</span>
              </li>
            </ul>
          </Reveal>
        </div>

        {/* Form card */}
        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-divider bg-white p-6 shadow-card sm:p-8">
            {status === "success" ? (
              <div
                aria-live="polite"
                className="flex min-h-[420px] flex-col items-center justify-center text-center"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-surface">
                  <CheckCircle2 aria-hidden="true" className="size-7 text-interactive" />
                </span>
                <h3 className="text-h5 mt-5 font-sans text-text-primary">
                  Enquiry received.
                </h3>
                <p className="text-small mt-2 max-w-xs leading-relaxed text-text-secondary">
                  We’ll be in touch within 48 hours.
                </p>
                <Button variant="secondary" size="sm" className="mt-6" onClick={reset}>
                  Send another enquiry
                </Button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                {status === "error" ? (
                  <p
                    role="alert"
                    className="mb-5 rounded-lg border border-danger/25 bg-danger-surface px-3.5 py-2.5 text-sm text-danger"
                  >
                    Something went wrong sending your enquiry. Please try again, or email us
                    directly at {company.email}.
                  </p>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name" name="name" required error={errors.name}>
                    <input
                      {...fieldProps("name")}
                      type="text"
                      autoComplete="name"
                      placeholder="Asha Verma"
                      className={inputClasses(Boolean(errors.name))}
                    />
                  </Field>

                  <Field label="Company" name="company" error={errors.company}>
                    <input
                      {...fieldProps("company")}
                      type="text"
                      autoComplete="organization"
                      placeholder="Acme Pvt Ltd"
                      className={inputClasses(false)}
                    />
                  </Field>

                  <Field label="Email" name="email" required error={errors.email}>
                    <input
                      {...fieldProps("email")}
                      type="email"
                      autoComplete="email"
                      placeholder="asha@acme.com"
                      className={inputClasses(Boolean(errors.email))}
                    />
                  </Field>

                  <Field label="Phone" name="phone" error={errors.phone}>
                    <input
                      {...fieldProps("phone")}
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98XXX XXXXX"
                      className={inputClasses(Boolean(errors.phone))}
                    />
                  </Field>

                  <Field label="Occasion" name="occasion" error={errors.occasion}>
                    <select
                      {...fieldProps("occasion")}
                      className={cn(inputClasses(false), SELECT_CHEVRON)}
                    >
                      <option value="">Select an occasion</option>
                      {categories.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.title}
                        </option>
                      ))}
                      <option value="something-else">Something else</option>
                    </select>
                  </Field>

                  <Field label="Quantity" name="quantity" error={errors.quantity}>
                    <input
                      {...fieldProps("quantity")}
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 120"
                      className={inputClasses(Boolean(errors.quantity))}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Budget band" name="budget" error={errors.budget}>
                      <select
                        {...fieldProps("budget")}
                        className={cn(inputClasses(false), SELECT_CHEVRON)}
                      >
                        {budgetOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Message" name="message" error={errors.message}>
                      <textarea
                        {...fieldProps("message")}
                        rows={4}
                        placeholder="Anything we should know — brand palette, deadlines, cities…"
                        className={cn(inputClasses(Boolean(errors.message)), "resize-y")}
                      />
                    </Field>
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between gap-4">
                  <p className="text-xs text-text-secondary">Fields marked * are required.</p>
                  <Button type="submit" arrow disabled={status === "submitting"}>
                    {status === "submitting" ? (
                      <>
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin motion-reduce:animate-none"
                        />
                        Sending…
                      </>
                    ) : (
                      "Send enquiry"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Field wrapper — label + control + inline error                      */
/* ------------------------------------------------------------------ */

interface FieldProps {
  label: string;
  /** Matches the control's id/name — wires label, aria-describedby and focus. */
  name: EnquiryField;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

function Field({ label, name, required = false, error, children }: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-text-primary">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-interactive">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
