/* Visual verification + quick a11y audit for AvaGifts.
 * Run: node tools/visual-verify.mjs
 * Saves screenshots to _reference/screenshots/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3100";
const OUT = "_reference/screenshots";
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
};

const browser = await chromium.launch();

async function auditPage(page, label) {
  // horizontal overflow
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`${label}: no h-overflow`, overflow <= 0, `${overflow}px`);

  // images have alt
  const imgsNoAlt = await page.evaluate(() =>
    [...document.querySelectorAll("img")].filter((i) => !i.alt).length,
  );
  check(`${label}: all <img> have alt`, imgsNoAlt === 0, `${imgsNoAlt} missing`);

  // single h1 + sane heading order (no skips >1)
  const headings = await page.evaluate(() =>
    [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1])),
  );
  const h1count = headings.filter((l) => l === 1).length;
  let skip = false;
  for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) skip = true;
  check(`${label}: exactly one h1`, h1count === 1, `count=${h1count}`);
  check(`${label}: heading order sane`, !skip);

  // landmarks
  const landmarks = await page.evaluate(() => ({
    header: !!document.querySelector("header"),
    main: !!document.querySelector("main"),
    footer: !!document.querySelector("footer"),
    nav: !!document.querySelector("nav"),
  }));
  check(`${label}: landmarks`, landmarks.header && landmarks.main && landmarks.footer && landmarks.nav);

  // buttons/links have accessible names
  const unnamed = await page.evaluate(() =>
    [...document.querySelectorAll("a,button")].filter((el) => {
      const t = (el.textContent || "").trim();
      const aria = el.getAttribute("aria-label") || "";
      return !t && !aria;
    }).length,
  );
  check(`${label}: named interactive elements`, unnamed === 0, `${unnamed} unnamed`);
}

/* ---------- Desktop 1440 ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200); // fonts + piku greeting
  await page.screenshot({ path: `${OUT}/desktop-hero.png` });

  // full page
  await page.screenshot({ path: `${OUT}/desktop-full.png`, fullPage: true });
  await auditPage(page, "desktop");

  // catalog open
  await page.locator("[data-catalog-trigger]").first().click();
  await page.waitForSelector(".stf__parent", { timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/desktop-catalog.png` });
  check("desktop: catalog flipbook visible", await page.locator(".stf__canvas").count() === 1);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  check("desktop: Esc closes catalog", (await page.locator("[role=dialog]").count()) === 0);
  await page.close();
}

/* ---------- Tablet 820 ---------- */
{
  const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/tablet-full.png`, fullPage: true });
  await auditPage(page, "tablet");
  await page.close();
}

/* ---------- Mobile 375 ---------- */
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/mobile-hero.png` });
  await page.screenshot({ path: `${OUT}/mobile-full.png`, fullPage: true });
  await auditPage(page, "mobile");

  // mobile menu opens
  await page.locator('header button[aria-label*="menu" i], header button[aria-label*="Menu" i]').first().click();
  await page.waitForTimeout(500);
  const menuVisible = await page.evaluate(() => {
    const els = [...document.querySelectorAll("a")].filter((a) => a.offsetParent !== null);
    return els.length >= 4;
  });
  check("mobile: nav sheet opens", menuVisible);
  await page.keyboard.press("Escape");
  await page.close();
}

await browser.close();

const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} checks passed`);
process.exit(fails.length ? 1 : 0);
