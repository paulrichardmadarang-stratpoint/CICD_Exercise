import { test, expect } from "@playwright/test";

import dotenv from 'dotenv';
import path from 'path';

// Initialize dotenv to read from the ".env" file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// ─────────────────────────────────────────────
// Uses baseURL from playwright.config.ts
// (default: http://localhost:3000)
// ─────────────────────────────────────────────

const USERNAME = process.env.LAB_USER as string;
const PASSWORD = process.env.LAB_PASS as string;

test.beforeEach(async ({ page }) => {
  await page.goto("");
});

// ═══════════════════════════════════════════════
//  1. NAVIGATION
// ═══════════════════════════════════════════════

test.describe("Navigation", () => {
  test("header and logo are visible", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator(".logo")).toContainText("Playwright Lab");
  });

  test("nav links highlight on click", async ({ page }) => {
    const navLinks = page.locator("#main-nav a");
    await expect(navLinks).toHaveCount(5);

    // Click "Data" tab and verify it becomes active
    const dataLink = navLinks.filter({ hasText: "Data" });
    await dataLink.click();
    await expect(dataLink).toHaveClass(/active/);

    // Previous active link should lose active class
    const formsLink = navLinks.filter({ hasText: "Forms" });
    await expect(formsLink).not.toHaveClass(/active/);
  });

  test("nav links scroll to correct sections", async ({ page }) => {
    //await page.getByText("Advanced").click();
    await page.getByRole('link', { name: 'Advanced' }).click(); //changed locator
    // The drag-and-drop section should now be near the viewport
    await expect(page.locator("#section-dragdrop")).toBeInViewport();
  });
});

// ═══════════════════════════════════════════════
//  2. LOGIN FORM
// ═══════════════════════════════════════════════

test.describe("Login Form", () => {
  test("successful login with valid credentials", async ({ page }) => {
    await page.getByTestId("login-email").fill(USERNAME);
    await page.getByTestId("login-password").fill(PASSWORD);
    await page.getByTestId("login-submit").click();

    //const message = page.getByTestId("login-message");
    const message = page.locator("#login-message > span"); //changed locator as div "login-message" returns red font color while span returns green font color
    await expect(message).toContainText("Login successful");
    await expect(message).toHaveCSS("color", "rgb(16, 185, 129)"); // green
  });

  test("failed login with wrong password", async ({ page }) => {
    await page.getByTestId("login-email").fill(USERNAME);
    await page.getByTestId("login-password").fill("wrongpass");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-message")).toContainText(
      "Invalid email or password"
    );
  });

  test("failed login with empty fields", async ({ page }) => {
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-message")).toContainText("Invalid");
  });

  test("reset button clears the form", async ({ page }) => {
    await page.getByTestId("login-email").fill("some@email.com");
    await page.getByTestId("login-password").fill("secret");
    await page.getByTestId("login-reset").click();

    await expect(page.getByTestId("login-email")).toHaveValue("");
    await expect(page.getByTestId("login-password")).toHaveValue("");
    await expect(page.getByTestId("login-message")).toHaveText("");
  });

  test("toast appears on successful login", async ({ page }) => {
    await page.getByTestId("login-email").fill(USERNAME);
    await page.getByTestId("login-password").fill(PASSWORD);
    await page.getByTestId("login-submit").click();

    const toast = page.getByTestId("toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Logged in successfully");
  });
});

// ═══════════════════════════════════════════════
//  3. REGISTRATION FORM
// ═══════════════════════════════════════════════

test.describe("Registration Form", () => {
  test("successful registration with all fields", async ({ page }) => {
    await page.getByTestId("reg-firstname").fill("Jane");
    await page.getByTestId("reg-lastname").fill("Doe");
    await page.getByTestId("reg-email").fill("jane@company.com");
    await page.getByTestId("reg-country").selectOption("ph");
    await page.getByTestId("reg-role").selectOption("qa");
    await page.getByTestId("interest-web").check();
    await page.getByTestId("interest-api").check();
    await page.getByTestId("exp-intermediate").check();
    await page.getByTestId("reg-bio").fill("QA engineer with 5 years of experience.");
    await page.getByTestId("reg-terms").check();
    await page.getByTestId("reg-submit").click();

    await expect(page.getByTestId("reg-message")).toContainText(
      "Account created for Jane Doe"
    );
  });

  test("validation errors when fields are empty", async ({ page }) => {
    await page.getByTestId("reg-submit").click();

    const msg = page.getByTestId("reg-message");
    await expect(msg).toContainText("First name is required");
    await expect(msg).toContainText("Valid email is required");
    await expect(msg).toContainText("Please select a country");
    await expect(msg).toContainText("You must accept the terms");
  });

  test("validation error when terms are not accepted", async ({ page }) => {
    await page.getByTestId("reg-firstname").fill("Jane");
    await page.getByTestId("reg-lastname").fill("Doe");
    await page.getByTestId("reg-email").fill("jane@co.com");
    await page.getByTestId("reg-country").selectOption("us");
    // Skip terms checkbox
    await page.getByTestId("reg-submit").click();

    await expect(page.getByTestId("reg-message")).toContainText(
      "You must accept the terms"
    );
  });

  test("dropdown has correct options", async ({ page }) => {
    const country = page.getByTestId("reg-country");
    await expect(country.locator("option")).toHaveCount(7); // including placeholder

    await country.selectOption({ label: "Japan" });
    await expect(country).toHaveValue("jp");
  });

  test("checkboxes can be toggled independently", async ({ page }) => {
    const web = page.getByTestId("interest-web");
    const api = page.getByTestId("interest-api");

    await web.check();
    await api.check();
    await expect(web).toBeChecked();
    await expect(api).toBeChecked();

    await web.uncheck();
    await expect(web).not.toBeChecked();
    await expect(api).toBeChecked();
  });

  test("radio buttons are mutually exclusive", async ({ page }) => {
    await page.getByTestId("exp-beginner").check();
    await expect(page.getByTestId("exp-beginner")).toBeChecked();

    await page.getByTestId("exp-advanced").check();
    await expect(page.getByTestId("exp-advanced")).toBeChecked();
    await expect(page.getByTestId("exp-beginner")).not.toBeChecked();
  });
});

// ═══════════════════════════════════════════════
//  4. COUNTER
// ═══════════════════════════════════════════════

test.describe("Counter", () => {
  test("starts at zero", async ({ page }) => {
    await expect(page.getByTestId("counter-value")).toHaveText("0");
  });

  test("increments on click", async ({ page }) => {
    await page.getByTestId("counter-inc").click();
    await page.getByTestId("counter-inc").click();
    await page.getByTestId("counter-inc").click();
    await expect(page.getByTestId("counter-value")).toHaveText("3");
  });

  test("decrements into negative", async ({ page }) => {
    await page.getByTestId("counter-dec").click();
    await page.getByTestId("counter-dec").click();
    await expect(page.getByTestId("counter-value")).toHaveText("-2");
  });

  test("reset returns to zero", async ({ page }) => {
    await page.getByTestId("counter-inc").click();
    await page.getByTestId("counter-inc").click();
    await page.getByTestId("counter-inc").click();
    await page.getByTestId("counter-reset").click();
    await expect(page.getByTestId("counter-value")).toHaveText("0");
  });
});

// ═══════════════════════════════════════════════
//  5. BUTTON STATES
// ═══════════════════════════════════════════════

test.describe("Button States", () => {
  test("disabled button cannot be clicked", async ({ page }) => {
    await expect(page.getByTestId("btn-disabled")).toBeDisabled();
  });

  test("normal button is enabled", async ({ page }) => {
    await expect(page.getByTestId("btn-normal")).toBeEnabled();
  });

  test("hidden button toggles visibility", async ({ page }) => {
    const hidden = page.getByTestId("btn-hidden");
    await expect(hidden).toBeHidden();

    await page.getByTestId("btn-toggle-hidden").click();
    await expect(hidden).toBeVisible();

    await page.getByTestId("btn-toggle-hidden").click();
    await expect(hidden).toBeHidden();
  });

  test("double-click triggers result", async ({ page }) => {
    await page.getByTestId("btn-dblclick").dblclick();
    await expect(page.getByTestId("dblclick-result")).toContainText(
      "Double-click detected"
    );
  });
});

// ═══════════════════════════════════════════════
//  6. DROPDOWN MENU
// ═══════════════════════════════════════════════

test.describe("Dropdown Menu", () => {
  test("opens on click and shows items", async ({ page }) => {
    const menu = page.getByTestId("dropdown-menu");
    await expect(menu).toBeHidden();

    await page.getByTestId("dropdown-trigger").click();
    await expect(menu).toBeVisible();
    await expect(menu.locator(".dropdown-item")).toHaveCount(4);
  });

  test("selecting an item closes menu and shows result", async ({ page }) => {
    await page.getByTestId("dropdown-trigger").click();
    await page.getByTestId("dropdown-edit").click();

    await expect(page.getByTestId("dropdown-menu")).toBeHidden();
    await expect(page.getByTestId("dropdown-result")).toContainText(
      "Action selected: edit"
    );
  });

  test("clicking outside closes the menu", async ({ page }) => {
    await page.getByTestId("dropdown-trigger").click();
    await expect(page.getByTestId("dropdown-menu")).toBeVisible();

    // Click somewhere else
    await page.locator("body").click();
    await expect(page.getByTestId("dropdown-menu")).toBeHidden();
  });
});

// ═══════════════════════════════════════════════
//  7. TABS
// ═══════════════════════════════════════════════

test.describe("Tabs", () => {
  test("overview tab is active by default", async ({ page }) => {
    await expect(page.getByTestId("tab-overview")).toHaveClass(/active/);
    await expect(page.getByTestId("panel-overview")).toBeVisible();
    await expect(page.getByTestId("panel-features")).toBeHidden();
    await expect(page.getByTestId("panel-pricing")).toBeHidden();
  });

  test("switching tabs shows correct panel", async ({ page }) => {
    await page.getByTestId("tab-features").click();
    await expect(page.getByTestId("panel-features")).toBeVisible();
    await expect(page.getByTestId("panel-overview")).toBeHidden();
    await expect(page.getByTestId("panel-features")).toContainText(
      "Auto-wait"
    );
  });

  test("tabs have correct ARIA roles", async ({ page }) => {
    await expect(page.getByTestId("tab-overview")).toHaveAttribute(
      "role",
      "tab"
    );
    await expect(page.getByTestId("panel-overview")).toHaveAttribute(
      "role",
      "tabpanel"
    );
  });
});

// ═══════════════════════════════════════════════
//  8. ACCORDION
// ═══════════════════════════════════════════════

test.describe("Accordion", () => {
  test("all items are collapsed initially", async ({ page }) => {
    const items = page.locator(".accordion-item");
    for (let i = 0; i < (await items.count()); i++) {
      await expect(items.nth(i)).not.toHaveClass(/open/);
    }
  });

  test("clicking an item expands it", async ({ page }) => {
    const faq1 = page.getByTestId("faq-1");
    await faq1.locator(".accordion-header").click();
    await expect(faq1).toHaveClass(/open/);
    await expect(faq1.locator(".accordion-body-inner")).toContainText(
      "Web Testing and Automation"
    );
  });

  test("only one item is open at a time", async ({ page }) => {
    const faq1 = page.getByTestId("faq-1");
    const faq2 = page.getByTestId("faq-2");

    await faq1.locator(".accordion-header").click();
    await expect(faq1).toHaveClass(/open/);

    await faq2.locator(".accordion-header").click();
    await expect(faq2).toHaveClass(/open/);
    await expect(faq1).not.toHaveClass(/open/);
  });
});

// ═══════════════════════════════════════════════
//  9. DATA TABLE
// ═══════════════════════════════════════════════

test.describe("Data Table", () => {
  test("renders all 8 rows", async ({ page }) => {
    const rows = page.getByTestId("table-body").locator("tr");
    await expect(rows).toHaveCount(8);
    await expect(page.getByTestId("table-count")).toContainText(
      "Showing 8 of 8"
    );
  });

  test("filtering narrows results", async ({ page }) => {
    await page.getByTestId("table-search").fill("Developer");
    const rows = page.getByTestId("table-body").locator("tr");
    await expect(rows).toHaveCount(3); // Alice, Eva, Grace
    await expect(page.getByTestId("table-count")).toContainText(
      "Showing 3 of 8"
    );
  });

  test("filtering with no match shows zero rows", async ({ page }) => {
    await page.getByTestId("table-search").fill("zzzzz");
    await expect(page.getByTestId("table-body").locator("tr")).toHaveCount(0);
    await expect(page.getByTestId("table-count")).toContainText(
      "Showing 0 of 8"
    );
  });

  test("clearing filter restores all rows", async ({ page }) => {
    await page.getByTestId("table-search").fill("QA");
    await expect(page.getByTestId("table-body").locator("tr")).toHaveCount(2);

    await page.getByTestId("table-search").fill("");
    await expect(page.getByTestId("table-body").locator("tr")).toHaveCount(8);
  });

  test("clicking column header sorts the table", async ({ page }) => {
    await page.getByTestId("th-name").click();

    // After ascending sort, first row should be Alice
    const firstCell = page
      .getByTestId("table-body")
      .locator("tr")
      .first()
      .locator("td")
      .first();
    await expect(firstCell).toHaveText("Alice Chen");

    // Click again for descending — first row should be Henry
    await page.getByTestId("th-name").click();
    await expect(firstCell).toHaveText("Henry Park");
  });

  test("status badges have correct CSS classes", async ({ page }) => {
    const activeBadge = page.locator(".status-active").first();
    await expect(activeBadge).toBeVisible();
    await expect(activeBadge).toHaveText("active");
  });
});

// ═══════════════════════════════════════════════
//  10. ALERT BANNERS
// ═══════════════════════════════════════════════

test.describe("Alert Banners", () => {
  test("all four alerts are visible initially", async ({ page }) => {
    await expect(page.getByTestId("alert-success")).toBeVisible();
    await expect(page.getByTestId("alert-warning")).toBeVisible();
    await expect(page.getByTestId("alert-error")).toBeVisible();
    await expect(page.getByTestId("alert-info")).toBeVisible();
  });

  test("dismiss hides all alerts", async ({ page }) => {
    await page.getByTestId("dismiss-alerts").click();

    await expect(page.getByTestId("alert-success")).toBeHidden();
    await expect(page.getByTestId("alert-warning")).toBeHidden();
    await expect(page.getByTestId("alert-error")).toBeHidden();
    await expect(page.getByTestId("alert-info")).toBeHidden();
  });

  test("restore brings them all back", async ({ page }) => {
    await page.getByTestId("dismiss-alerts").click();
    await page.getByTestId("restore-alerts").click();

    await expect(page.getByTestId("alert-success")).toBeVisible();
    await expect(page.getByTestId("alert-info")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════
//  11. MODAL
// ═══════════════════════════════════════════════

test.describe("Modal", () => {
  test("modal is hidden by default", async ({ page }) => {
    await expect(page.getByTestId("modal-overlay")).toBeHidden();
  });

  test("opens when trigger is clicked", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await expect(page.getByTestId("modal-overlay")).toBeVisible();
    await expect(page.getByTestId("modal")).toContainText("Confirm Action");
  });

  test("cancel closes the modal", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await page.getByTestId("modal-cancel").click();
    await expect(page.getByTestId("modal-overlay")).toBeHidden();
  });

  test("confirm closes modal and shows toast", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await page.getByTestId("modal-confirm").click();

    await expect(page.getByTestId("modal-overlay")).toBeHidden();
    await expect(page.getByTestId("toast")).toContainText("Action confirmed");
  });
});

// ═══════════════════════════════════════════════
//  12. DELAYED / DYNAMIC CONTENT
// ═══════════════════════════════════════════════

test.describe("Dynamic Content", () => {
  test("lazy load shows spinner then content", async ({ page }) => {
    await page.getByTestId("load-content").click();

    // Spinner appears immediately
    await expect(page.getByTestId("lazy-content")).toContainText("Loading");

    // After 2s, real content replaces spinner
    await expect(page.getByTestId("lazy-loaded")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("lazy-loaded")).toContainText(
      "Content loaded after 2 seconds"
    );
  });

  test("timer increments when started", async ({ page }) => {
    await page.getByTestId("timer-start").click();

    // Wait for the value to reach at least 2
    await expect(page.getByTestId("timer-value")).not.toHaveText("0", {
      timeout: 3000,
    });

    const value = Number(
      await page.getByTestId("timer-value").textContent()
    );
    expect(value).toBeGreaterThanOrEqual(1);
  });

  test("timer stops when stop is clicked", async ({ page }) => {
    await page.getByTestId("timer-start").click();
    await page.waitForTimeout(2000);
    await page.getByTestId("timer-stop").click();

    const stoppedValue = await page.getByTestId("timer-value").textContent();
    await page.waitForTimeout(1500);
    const laterValue = await page.getByTestId("timer-value").textContent();

    expect(stoppedValue).toBe(laterValue); // unchanged
  });

  test("progress bar fills to 100%", async ({ page }) => {
    await page.getByTestId("progress-start").click();

    await expect(page.getByTestId("progress-text")).toHaveText("100%", {
      timeout: 10000,
    });

    await expect(page.getByTestId("progress-fill")).toHaveCSS(
      "width",
      /.+/
    );
  });

  test("progress button is disabled during progress", async ({ page }) => {
    await page.getByTestId("progress-start").click();
    await expect(page.getByTestId("progress-start")).toBeDisabled();

    // Re-enabled after completion
    await expect(page.getByTestId("progress-start")).toBeEnabled({
      timeout: 10000,
    });
  });
});

// ═══════════════════════════════════════════════
//  13. DRAG AND DROP
// ═══════════════════════════════════════════════

test.describe("Drag and Drop", () => {
  test("initial state has 3 items in To Do", async ({ page }) => {
    const todoItems = page
      .getByTestId("drag-todo")
      .locator(".drag-item");
    await expect(todoItems).toHaveCount(3);

    await expect(page.getByTestId("drag-progress").locator(".drag-item")).toHaveCount(0);
    await expect(page.getByTestId("drag-done").locator(".drag-item")).toHaveCount(0);
  });

  test("drag item from To Do to In Progress", async ({ page }) => {
    const task = page.getByTestId("task-1");
    const target = page.getByTestId("drag-progress");

    await task.dragTo(target);

    await expect(
      page.getByTestId("drag-progress").locator(".drag-item")
    ).toHaveCount(1);
    await expect(page.getByTestId("drag-todo").locator(".drag-item")).toHaveCount(2);
  });

  test("drag item to Done column", async ({ page }) => {
    const task = page.getByTestId("task-2");
    const done = page.getByTestId("drag-done");

    await task.dragTo(done);

    await expect(done).toContainText("Add API mocks");
  });
});

// ═══════════════════════════════════════════════
//  14. SLIDER & INPUTS
// ═══════════════════════════════════════════════

test.describe("Slider & Inputs", () => {
  test("slider default value is 50", async ({ page }) => {
    await expect(page.getByTestId("volume-slider")).toHaveValue("50");
    await expect(page.getByTestId("volume-value")).toHaveText("50");
  });

  test("changing slider updates the label", async ({ page }) => {
    const slider = page.getByTestId("volume-slider");
    await slider.fill("75");
    await expect(page.getByTestId("volume-value")).toHaveText("75");
  });

  test("date input accepts a value", async ({ page }) => {
    await page.getByTestId("date-input").fill("2026-05-15");
    await expect(page.getByTestId("date-input")).toHaveValue("2026-05-15");
  });

  test("number input respects min/max attributes", async ({ page }) => {
    const input = page.getByTestId("number-input");
    await expect(input).toHaveAttribute("min", "1");
    await expect(input).toHaveAttribute("max", "99");

    await input.fill("42");
    await expect(input).toHaveValue("42");
  });
});

// ═══════════════════════════════════════════════
//  15. FILE UPLOAD
// ═══════════════════════════════════════════════

test.describe("File Upload", () => {
  test("upload a single file", async ({ page }) => {
    const fileInput = page.getByTestId("file-input");

    await fileInput.setInputFiles({
      name: "test-report.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Hello, Playwright!"),
    });

    await expect(page.getByTestId("file-list")).toContainText(
      "test-report.txt"
    );
  });

  test("upload multiple files", async ({ page }) => {
    const fileInput = page.getByTestId("file-input");

    await fileInput.setInputFiles([
      {
        name: "screenshot.png",
        mimeType: "image/png",
        buffer: Buffer.from("fake-png-data"),
      },
      {
        name: "results.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("a,b,c\n1,2,3"),
      },
    ]);

    const fileList = page.getByTestId("file-list");
    await expect(fileList).toContainText("screenshot.png");
    await expect(fileList).toContainText("results.csv");
  });
});

// ═══════════════════════════════════════════════
//  16. TOOLTIPS
// ═══════════════════════════════════════════════

test.describe("Tooltips", () => {
  test("tooltip is hidden by default", async ({ page }) => {
    await expect(page.getByTestId("tooltip-locator-text")).toBeHidden();
  });

  test("tooltip shows on hover", async ({ page }) => {
    await page.getByTestId("tooltip-locator").hover();
    await expect(page.getByTestId("tooltip-locator-text")).toBeVisible();
    await expect(page.getByTestId("tooltip-locator-text")).toContainText(
      "find element"
    );
  });

  test("each tooltip has unique content", async ({ page }) => {
    await page.getByTestId("tooltip-assertion").hover();
    await expect(page.getByTestId("tooltip-assertion-text")).toContainText(
      "verifies expected behavior"
    );

    await page.getByTestId("tooltip-fixture").hover();
    await expect(page.getByTestId("tooltip-fixture-text")).toContainText(
      "providing test context"
    );
  });
});

// ═══════════════════════════════════════════════
//  17. IFRAME
// ═══════════════════════════════════════════════

test.describe("Iframe", () => {
  test("iframe is present on the page", async ({ page }) => {
    await expect(page.getByTestId("test-iframe")).toBeVisible();
  });

  test("interact with elements inside iframe", async ({ page }) => {
    const frame = page.frameLocator("#test-iframe");

    await frame.getByTestId("iframe-input").fill("Playwright rocks!");
    await frame.getByTestId("iframe-btn").click(); //not working on test site

    await expect(frame.getByTestId("iframe-result")).toHaveText(
      "Playwright rocks!"
    );
  });

  test("iframe input starts empty", async ({ page }) => {
    const frame = page.frameLocator("#test-iframe");
    await expect(frame.getByTestId("iframe-input")).toHaveValue("");
    await expect(frame.getByTestId("iframe-result")).toHaveText(""); //not working on testsite
  });
});

// ═══════════════════════════════════════════════
//  18. TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════

test.describe("Toast Notifications", () => {
  test("toast auto-dismisses after ~3 seconds", async ({ page }) => {
    await page.getByTestId("login-email").fill("test@example.com");
    await page.getByTestId("login-password").fill("password123");
    await page.getByTestId("login-submit").click();

    const toast = page.getByTestId("toast");
    await expect(toast).toBeVisible();

    // Wait for it to disappear (3s animation + buffer)
    await expect(toast).toBeHidden({ timeout: 5000 });
  });
});

// ═══════════════════════════════════════════════
//  19. CROSS-SECTION WORKFLOWS
// ═══════════════════════════════════════════════

test.describe("End-to-End Workflows", () => {
  test("register → login → confirm modal", async ({ page }) => {
    // Step 1: Register
    await page.getByTestId("reg-firstname").fill("Test");
    await page.getByTestId("reg-lastname").fill("User");
    await page.getByTestId("reg-email").fill("test@example.com");
    await page.getByTestId("reg-country").selectOption("us");
    await page.getByTestId("reg-terms").check();
    await page.getByTestId("reg-submit").click();
    await expect(page.getByTestId("reg-message")).toContainText(
      "Account created"
    );

    // Step 2: Login
    await page.getByTestId("login-email").fill("test@example.com");
    await page.getByTestId("login-password").fill("password123");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-message")).toContainText(
      "Login successful"
    );

    // Step 3: Open and confirm modal
    await page.getByTestId("open-modal").click();
    await expect(page.getByTestId("modal")).toBeVisible();
    await page.getByTestId("modal-confirm").click();
    await expect(page.getByTestId("modal-overlay")).toBeHidden();
  });

  test("filter table → check results → sort", async ({ page }) => {
    // Filter to QA engineers
    await page.getByTestId("table-search").fill("QA");
    await expect(
      page.getByTestId("table-body").locator("tr")
    ).toHaveCount(2);

    // Clear and sort by name
    await page.getByTestId("table-search").fill("");
    await page.getByTestId("th-name").click();

    const firstRow = page.getByTestId("table-body").locator("tr").first();
    await expect(firstRow).toContainText("Alice Chen");
  });
});
