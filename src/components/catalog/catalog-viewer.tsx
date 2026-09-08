"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CLOSE_CATALOG_EVENT } from "@/lib/events";
// Type-only import: erased at build, satisfies the strict settings/events typings
// without depending on runtime enum exports.
import type { SizeType } from "page-flip";

/* ------------------------------------------------------------------ */
/* AvaGifts — Flipbook catalog viewer                                  */
/*                                                                     */
/* Renders `public/catalog/avagifts-catalog.pdf` as a realistic        */
/* page-turning book (StPageFlip) with pages rasterised by pdf.js.     */
/* Both heavy libraries are imported lazily on first open so they      */
/* never touch the initial bundle.                                     */
/* ------------------------------------------------------------------ */

const CATALOG_URL = "/catalog/avagifts-catalog.pdf";
const ZOOM_STEPS = [1, 1.25, 1.5, 2] as const;

type Status = "loading" | "ready" | "error";

interface PageFlipInstance {
  destroy: () => void;
  flipNext: (event?: unknown) => void;
  flipPrev: (event?: unknown) => void;
  getCurrentPageIndex: () => number;
  getPageCount: () => number;
  on: (event: string, callback: (e: { data: number }) => void) => void;
}

/** Compute the largest book size that fits the viewport. */
function computeBookSize(aspect: number) {
  if (typeof window === "undefined") return { width: 560, height: 780 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const portrait = vw < 900; // single-page mode on narrow screens
  const availW = portrait ? Math.min(vw - 32, 620) : Math.min((vw - 160) / 2, 560);
  const availH = vh - 150;
  let width = Math.floor(availW);
  let height = Math.round(width * aspect);
  if (height > availH) {
    height = Math.floor(availH);
    width = Math.round(height / aspect);
  }
  return { width, height };
}

export default function CatalogViewer() {
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null); // scrollable zoom container
  const mountRef = useRef<HTMLDivElement>(null); // StPageFlip target
  const flipRef = useRef<PageFlipInstance | null>(null);
  /** Rasterised page image URLs — the source of truth for (re)builds. */
  const urlsRef = useRef<string[]>([]);
  /** Live pdf.js document while rasterising; destroyed once pages are blobs. */
  const docRef = useRef<{ destroy: () => void } | null>(null);
  /** Guards against overlapping async rebuilds (rapid resize). */
  const buildSeq = useRef(0);
  const aspectRef = useRef(1 / Math.SQRT2); // A4-ish default
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const isPortraitViewport = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 900,
    [], // evaluated once per mount; resize rebuilds handle changes
  );

  /** Revoke all rasterised page blob URLs. */
  const releasePages = useCallback(() => {
    for (const u of urlsRef.current) {
      if (u.startsWith("blob:")) URL.revokeObjectURL(u);
    }
    urlsRef.current = [];
  }, []);

  /** Tear down the flipbook instance only (pages stay usable for rebuilds). */
  const destroyBook = useCallback(() => {
    flipRef.current?.destroy();
    flipRef.current = null;
  }, []);

  /* ---------------- build / rebuild the flipbook ---------------- */

  const buildFlipbook = useCallback(
    async (startPage: number) => {
      const mount = mountRef.current;
      const urls = urlsRef.current;
      if (!mount || urls.length === 0) return;
      const seq = ++buildSeq.current;
      const pfModule = await import("page-flip");
      if (seq !== buildSeq.current) return; // a newer rebuild superseded us
      destroyBook();
      mount.innerHTML = "";
      const el = document.createElement("div");
      el.className = "catalog-flipbook";
      mount.appendChild(el);
      const size = computeBookSize(aspectRef.current);
      const pf = new pfModule.PageFlip(el, {
        width: size.width,
        height: size.height,
        size: "fixed" as SizeType,
        maxShadowOpacity: 0.45,
        showCover: true,
        mobileScrollSupport: false,
        drawShadow: true,
        flippingTime: 620,
        usePortrait: window.innerWidth < 900,
        startPage,
        autoSize: false,
      });
      pf.loadFromImages(urls);
      pf.on("flip", (e: { data: number | string | boolean | object }) =>
        setPageIndex(Number(e.data)),
      );
      flipRef.current = pf as unknown as PageFlipInstance;
      setPageIndex(startPage);
    },
    [destroyBook],
  );

  /* ---------------- open: load pdf + rasterise pages ---------------- */

  useEffect(() => {
    let cancelled = false;

    /** Full teardown: book + page images + pdf.js doc. */
    const teardown = () => {
      destroyBook();
      releasePages();
      docRef.current?.destroy();
      docRef.current = null;
    };

    async function load() {
      setStatus("loading");
      setProgress({ done: 0, total: 0 });
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
        const loadingTask = pdfjs.getDocument({ url: CATALOG_URL });
        const doc = await loadingTask.promise;
        if (cancelled) {
          void loadingTask.destroy();
          return;
        }
        // The loading task (not the proxy) owns destroy() in pdfjs v6.
        docRef.current = loadingTask;

        const first = await doc.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        aspectRef.current = vp.height / vp.width;
        const total = doc.numPages;
        if (!cancelled) setPageCount(total);

        const urls: string[] = [];
        for (let i = 1; i <= total; i++) {
          if (cancelled) break;
          const page = i === 1 ? first : await doc.getPage(i);
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const baseW = 720;
          const scale = dpr * (baseW / vp.width);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas unavailable");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, canvas, viewport }).promise;
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.9),
          );
          urls.push(blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/jpeg", 0.9));
          canvas.width = 0;
          canvas.height = 0;
          if (!cancelled) setProgress({ done: i, total });
        }

        // Pages own these URLs from here on — later paths release via urlsRef.
        urlsRef.current = urls;

        if (cancelled) {
          teardown();
          return;
        }

        // Rasterisation complete: free pdf.js memory before building the book.
        void loadingTask.destroy();
        docRef.current = null;

        const mount = mountRef.current;
        if (!mount) throw new Error("Mount missing");
        mount.innerHTML = "";
        const el = document.createElement("div");
        el.className = "catalog-flipbook";
        mount.appendChild(el);

        const pfModule = await import("page-flip");
        if (cancelled) {
          teardown();
          return;
        }
        const size = computeBookSize(aspectRef.current);
        const pf = new pfModule.PageFlip(el, {
          width: size.width,
          height: size.height,
          size: "fixed" as SizeType,
          maxShadowOpacity: 0.45,
          showCover: true,
          mobileScrollSupport: false,
          drawShadow: true,
          flippingTime: 620,
          usePortrait: isPortraitViewport,
          startPage: 0,
          autoSize: false,
        });
        pf.loadFromImages(urls);
        pf.on("flip", (e: { data: number | string | boolean | object }) =>
          setPageIndex(Number(e.data)),
        );
        flipRef.current = pf as unknown as PageFlipInstance;
        setStatus("ready");
        setPageIndex(0);
      } catch (err) {
        console.error("[avagifts] catalog load failed:", err);
        teardown();
        if (!cancelled) setStatus("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
      teardown();
    };
  }, [isPortraitViewport, destroyBook, releasePages]);

  /* ---------------- chrome behaviour ---------------- */

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Initial focus.
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, [status]);

  // Keyboard controls.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (document.fullscreenElement) return; // browser exits fullscreen
        window.dispatchEvent(new CustomEvent(CLOSE_CATALOG_EVENT));
        return;
      }
      if (status !== "ready") return;
      if (e.key === "ArrowRight") flipRef.current?.flipNext();
      if (e.key === "ArrowLeft") flipRef.current?.flipPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  // Fullscreen state sync.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Rebuild on viewport resize (orientation change included).
  useEffect(() => {
    if (status !== "ready") return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        void buildFlipbook(flipRef.current?.getCurrentPageIndex() ?? 0);
      }, 220);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [status, buildFlipbook]);

  /* ---------------- actions ---------------- */

  const toggleFullscreen = useCallback(() => {
    const root = overlayRef.current;
    if (!root) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.requestFullscreen().catch(() => undefined);
  }, []);

  const zoomIn = useCallback(() => setZoomIndex((z) => Math.min(z + 1, ZOOM_STEPS.length - 1)), []);
  const zoomOut = useCallback(() => setZoomIndex((z) => Math.max(z - 1, 0)), []);
  const zoom = ZOOM_STEPS[zoomIndex];

  const goPrev = useCallback(() => flipRef.current?.flipPrev(), []);
  const goNext = useCallback(() => flipRef.current?.flipNext(), []);

  const label = useMemo(() => {
    if (isPortraitViewport || pageIndex === 0 || pageIndex === pageCount - 1)
      return `${pageIndex + 1} / ${pageCount}`;
    return `${pageIndex + 1}–${pageIndex + 2} / ${pageCount}`;
  }, [pageIndex, pageCount, isPortraitViewport]);

  const stageStyle: CSSProperties | undefined =
    zoom > 1 ? { cursor: "grab" } : undefined;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="AvaGifts product catalog"
      className="fixed inset-0 z-[90] flex flex-col bg-ink/92 backdrop-blur-md"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-paper sm:px-6">
        <p className="font-display text-sm tracking-wide sm:text-base">
          AvaGifts <span className="hidden text-paper/60 sm:inline">· Catalog 2026</span>
        </p>

        <div className="flex items-center gap-1.5">
          <span className="mr-2 hidden rounded-full bg-paper/10 px-3 py-1 text-xs tabular-nums text-paper/80 min-[420px]:inline-block">
            {label}
          </span>
          <IconButton label="Zoom out" onClick={zoomOut} disabled={zoomIndex === 0}>
            <ZoomOut className="size-4" />
          </IconButton>
          <span className="w-10 text-center text-xs tabular-nums text-paper/70">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            label="Zoom in"
            onClick={zoomIn}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
          >
            <ZoomIn className="size-4" />
          </IconButton>
          <span className="mx-1 h-5 w-px bg-paper/15" aria-hidden="true" />
          <IconButton label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </IconButton>
          <a
            href={CATALOG_URL}
            download="avagifts-catalog.pdf"
            aria-label="Download catalog PDF"
            className="grid size-9 place-items-center rounded-full text-paper/85 transition hover:bg-paper/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Download className="size-4" />
          </a>
          <IconButton
            ref={closeBtnRef}
            label="Close catalog"
            onClick={() => window.dispatchEvent(new CustomEvent(CLOSE_CATALOG_EVENT))}
          >
            <X className="size-5" />
          </IconButton>
        </div>
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        style={stageStyle}
        className="relative flex flex-1 items-center justify-center overflow-auto overscroll-contain px-4 pb-6"
      >
        {status === "loading" && (
          <div
            className="absolute inset-0 z-10 grid place-items-center bg-ink/80"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="size-8 animate-spin text-gold" aria-hidden="true" />
              <p className="text-sm text-paper/75">
                {progress.total > 0
                  ? `Preparing your catalog… ${progress.done}/${progress.total}`
                  : "Preparing your catalog…"}
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-ink/80">
            <div className="max-w-sm px-6 text-center">
              <p className="font-display text-xl text-paper">The catalog could not be opened.</p>
              <p className="mt-2 text-sm text-paper/65">
                Check your connection and try again, or download the PDF directly.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white"
                >
                  <RefreshCw className="size-4" /> Retry
                </button>
                <a
                  href={CATALOG_URL}
                  download="avagifts-catalog.pdf"
                  className="inline-flex items-center gap-2 rounded-full border border-paper/30 px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-paper/10"
                >
                  <Download className="size-4" /> Download PDF
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Page-turn arrows (desktop) */}
        {status === "ready" && (
          <>
            <button
              type="button"
              aria-label="Previous page"
              onClick={goPrev}
              disabled={pageIndex === 0}
              className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full p-3 text-paper/70 transition hover:bg-paper/10 hover:text-paper disabled:pointer-events-none disabled:opacity-25 md:block"
            >
              <ChevronLeft className="size-7" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              onClick={goNext}
              disabled={pageIndex >= pageCount - 1}
              className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full p-3 text-paper/70 transition hover:bg-paper/10 hover:text-paper disabled:pointer-events-none disabled:opacity-25 md:block"
            >
              <ChevronRight className="size-7" />
            </button>
          </>
        )}

        {/* StPageFlip mounts here */}
        <div
          ref={mountRef}
          className={cn("transition-transform duration-300 ease-out will-change-transform")}
          style={{ transform: `scale(${zoom})` }}
          aria-live="polite"
        />

        {/* Mobile page indicator + hint */}
        {status === "ready" && (
          <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-paper/10 px-3 py-1 text-xs tabular-nums text-paper/80 min-[420px]:hidden">
            {label}
          </p>
        )}
      </div>

      {/* Bottom hint */}
      <p className="pb-3 text-center text-xs text-paper/45">
        Swipe or use arrow keys to turn pages · Esc to close
      </p>

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Icon button                                                         */
/* ------------------------------------------------------------------ */

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, className, children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "grid size-9 place-items-center rounded-full text-paper/85 transition hover:bg-paper/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-40",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
