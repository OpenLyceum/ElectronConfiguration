import { expect, test } from "@playwright/test";

test.setTimeout(35_000);

test("keyboard spin placement on an orbital: cycle, U/D keys, Pauli, Delete, undo and reset", async ({ page }) => {
  await page.goto("/?screens=1&showHomeScreen=false&ea");
  const empty = page.getByRole("button", { name: "1s, orbital 1: empty", exact: true });
  await empty.focus();
  await page.keyboard.press("Space");
  const up = page.getByRole("button", { name: "1s, orbital 1: one up-spin electron", exact: true });
  await expect(up).toBeAttached();
  await up.focus();
  await page.keyboard.press("u");
  await expect(page.locator("p").filter({ hasText: "Pauli: that spin projection" }).first()).toContainText(
    "already occupied",
  );
  await page.keyboard.press("d");
  const pair = page.getByRole("button", { name: "1s, orbital 1: two paired electrons", exact: true });
  await expect(pair).toBeAttached();
  await pair.focus();
  await page.keyboard.press("Delete");
  await expect(up).toBeAttached();
  await page.getByRole("button", { name: "Undo", exact: true }).press("Space");
  await expect(pair).toBeAttached();
  await page.getByRole("button", { name: "Reset All", exact: true }).press("Space");
  await expect(empty).toBeAttached();
});

test("pointer: drag from the tray, drag between orbitals, Check marks Hund", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/?screens=1&showHomeScreen=false&ea");
  await expect(page.getByRole("button", { name: "2p, orbital 1: empty", exact: true })).toBeAttached();
  const drag = async (from: [number, number], to: [number, number]) => {
    await page.mouse.move(...from);
    await page.mouse.down();
    await page.mouse.move((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, { steps: 5 });
    await page.mouse.move(...to, { steps: 5 });
    await page.mouse.up();
  };
  // Layout at 1280×800: ↑ token (366, 170), ↓ token (425, 170), 2p boxes at y = 415.
  await drag([366, 170], [216, 415]);
  await expect(page.getByRole("button", { name: "2p, orbital 1: one up-spin electron", exact: true })).toBeAttached();
  await drag([425, 170], [216, 415]);
  await expect(page.getByRole("button", { name: "2p, orbital 1: two paired electrons", exact: true })).toBeAttached();
  await drag([222, 415], [258, 415]);
  await expect(page.getByRole("button", { name: "2p, orbital 2: one down-spin electron", exact: true })).toBeAttached();
  await page.mouse.click(258, 415);
  await expect(page.getByRole("button", { name: "2p, orbital 2: two paired electrons", exact: true })).toBeAttached();
});

test("table selects Cr and Cu reference exceptions", async ({ page }) => {
  await page.goto("/?screens=2&showHomeScreen=false&ea");
  await page.getByRole("button", { name: "24 Cr", exact: true }).press("Space");
  await expect(page.getByRole("button", { name: "4s, orbital 1: one up-spin electron", exact: true })).toBeAttached();
  for (let i = 1; i <= 5; i++) {
    await expect(
      page.getByRole("button", { name: `3d, orbital ${i}: one up-spin electron`, exact: true }),
    ).toBeAttached();
  }
  await page.getByRole("button", { name: "29 Cu", exact: true }).press("Space");
  for (let i = 1; i <= 5; i++) {
    await expect(
      page.getByRole("button", { name: `3d, orbital ${i}: two paired electrons`, exact: true }),
    ).toBeAttached();
  }
});

test("ion formation keeps the nucleus and removes Fe 4s before 3d", async ({ page }) => {
  await page.goto("/?screens=3&showHomeScreen=false&ea");
  const ion = page.getByRole("slider").filter({ visible: true }).first();
  await ion.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 11; i++) {
    await page.keyboard.press("ArrowUp");
  }
  await page.getByRole("button", { name: "Lose one electron", exact: true }).press("Space");
  await expect(page.getByRole("button", { name: "4s, orbital 1: one up-spin electron", exact: true })).toBeAttached();
  await page.getByRole("button", { name: "Lose one electron", exact: true }).press("Space");
  // Fe²⁺: both 4s electrons gone, 3d⁶ untouched (one pair, four parallel).
  await expect(page.getByRole("button", { name: "4s, orbital 1: empty", exact: true })).toBeAttached();
  await expect(page.getByRole("button", { name: "3d, orbital 1: two paired electrons", exact: true })).toBeAttached();
  await expect(page.locator("p").filter({ hasText: "Net charge +2 → Fe²⁺" }).first()).toBeAttached();
  await page.screenshot({ path: "test-results/ions-fe.png" });
});

test("detective classifies promotion, offers move challenges, and masks identification", async ({ page }) => {
  await page.goto("/?screens=4&showHomeScreen=false&ea");
  await expect(
    page.getByText("Repair the diagram so it matches ground-state filling.", { exact: true }),
  ).toBeAttached();
  const next = page.getByRole("button", { name: "Next challenge", exact: true });
  await next.press("Space");
  await next.press("Space");
  await page.getByRole("button", { name: "Allowed, but not ground-state filling", exact: true }).press("Space");
  await expect(
    page
      .locator("p")
      .filter({ hasText: /^Correct\.$/ })
      .first(),
  ).toBeAttached();
  await expect(page.locator("p").filter({ hasText: "Solved 1 of 8" }).first()).toBeAttached();
  await next.press("Space");
  await expect(page.getByText(/One electron is in the wrong orbital/).first()).toBeAttached();
  // Na: move the 3p electron back to 3s with the keyboard.
  await page.getByRole("button", { name: "3p, orbital 1: one up-spin electron", exact: true }).press("Delete");
  await page.getByRole("button", { name: "3s, orbital 1: empty", exact: true }).press("u");
  await page.getByRole("button", { name: "Check", exact: true }).press("Space");
  await expect(page.locator("p").filter({ hasText: "Solved 2 of 8" }).first()).toBeAttached();
  await next.press("Space");
  await expect(page.locator("p").filter({ hasText: "Target Unknown element, Z=?" }).first()).toBeAttached();
  await page.getByRole("button", { name: "Mg", exact: true }).press("Space");
  await expect(
    page
      .locator("p")
      .filter({ hasText: /^Correct\.$/ })
      .first(),
  ).toBeAttached();
});

for (const locale of ["en", "fr", "es"]) {
  for (const screen of [1, 2, 3, 4]) {
    test(`screen ${screen} / ${locale} desktop and portrait initialize`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/?screens=${screen}&showHomeScreen=false&locale=${locale}&colorProfile=projector&ea`);
      await expect(page.getByRole("checkbox").first()).toBeAttached();
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.getByRole("button", { name: /Screen|Écran|Pantalla/ })).toBeAttached();
      await page.screenshot({ path: `test-results/portrait-${locale}-${screen}.png` });
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page.getByRole("checkbox").first()).toBeAttached();
      expect(errors).toEqual([]);
    });
  }
}
