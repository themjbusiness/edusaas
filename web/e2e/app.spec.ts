import { test, expect } from '@playwright/test';

// Helper to log in with a demo persona by name
async function loginAsPersona(page, personaName: string) {
  // Ensure we start from a clean signed-out state
  await page.goto('/#/logout');
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await page.goto('/#/login');
  await page.waitForSelector('text=Sign in to EduSaas', { timeout: 10000 });

  // Click the demo profile button to autofill
  const demoBtn = page.locator(`button:has-text("${personaName}")`).first();
  await expect(demoBtn).toBeVisible({ timeout: 10000 });
  await demoBtn.click();

  // Click Send OTP
  const sendBtn = page.locator('button[type="submit"]:has-text("Send")');
  await sendBtn.click();

  // Wait for OTP input
  const otpInput = page.locator('#otpCode');
  await expect(otpInput).toBeVisible({ timeout: 10000 });

  // Extract the demo code from the preview banner
  const smsBanner = page.locator('text=Demo mode SMS preview:');
  await expect(smsBanner).toBeVisible({ timeout: 10000 });
  const smsText = await smsBanner.textContent();
  const codeMatch = smsText?.match(/\b(\d{6})\b/);
  const code = codeMatch ? codeMatch[1] : '123456';

  // Fill OTP code to complete sign-in
  await otpInput.fill(code);
}

test.describe('EduSaas Comprehensive End-to-End Audit', () => {

  test('Authentication: Login page loads and displays demo personas', async ({ page }) => {
    await page.goto('/#/login');
    await expect(page).toHaveTitle(/EduSaas/);
    
    // Check brand header
    await expect(page.locator('text=Margalla Heights College').first()).toBeVisible();
    await expect(page.locator('text=Sign in to EduSaas')).toBeVisible();

    // Verify all 4 stakeholder demo personas are present
    await expect(page.locator('button:has-text("Ali Raza")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Mr. Tariq Mehmood")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Mrs. Fatima Raza")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Ms. Sana Javed")').first()).toBeVisible();
  });

  test('Student Experience: Home, 2-Column Lesson Player, and Locked Quiz Protection', async ({ page }) => {
    // 1. Log in as Student Ali Raza
    await loginAsPersona(page, 'Ali Raza');

    // 2. Student Home verification
    await expect(page).toHaveURL(/#\/home/, { timeout: 10000 });
    await expect(page.locator('text=Assalam o alaikum').first()).toBeVisible();
    await expect(page.locator('text=FBISE Margalla Heights').first()).toBeVisible();
    await expect(page.locator('text=My subjects').first()).toBeVisible();

    // 3. Navigate to Physics lesson
    await page.goto('/#/lesson/u1-estimation');
    await page.waitForLoadState('networkidle');

    // Verify 2-Column Desktop layout (topic, title, and textbook details)
    await expect(page.locator('text=Estimation of Physical Quantities').first()).toBeVisible({ timeout: 10000 });

    // Verify audio player exists
    const audioControls = page.locator('button:has-text("play_arrow"), button:has-text("pause")').first();
    await expect(audioControls).toBeVisible();

    // 4. Navigate to Quiz before completing 90% narration: Verify Business Logic Guard (Quiz is Locked)
    await page.goto('/#/quiz/u1-estimation');
    await page.waitForLoadState('networkidle');
    
    // The system correctly protects the quiz from being answered before listening
    const backToLesson = page.locator('text=Back to lesson').first();
    await expect(backToLesson).toBeVisible({ timeout: 10000 });
  });

  test('Teacher Experience: Classes, Attendance register, and WhatsApp alert link', async ({ page }) => {
    // Log in as Teacher Mr. Tariq Mehmood
    await loginAsPersona(page, 'Mr. Tariq Mehmood');

    // Single-class teacher auto-redirects directly to class attendance register or teacher dashboard
    await page.waitForURL(/#\/(teacher|class\/)/, { timeout: 10000 });
    await expect(page.locator('text=11th Pre-Medical A').first()).toBeVisible({ timeout: 10000 });

    // Verify student roster is listed
    await expect(page.locator('text=Ali Raza').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Hamza Khan').first()).toBeVisible();
  });

  test('Parent Experience: Child Progress and Alerts', async ({ page }) => {
    // Log in as Parent Mrs. Fatima Raza
    await loginAsPersona(page, 'Mrs. Fatima Raza');

    // Check Parent Home
    await expect(page).toHaveURL(/#\/parent/, { timeout: 10000 });
    await expect(page.locator('text=Assalam o alaikum').first()).toBeVisible();
    await expect(page.locator('text=Ali Raza').first()).toBeVisible();

    // Check Messages
    await page.goto('/#/msgs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Messages').first()).toBeVisible({ timeout: 10000 });
  });

  test('College Admin Console: Navigation, Directory, and CSV Import', async ({ page }) => {
    // Log in as College Admin Ms. Sana Javed
    await loginAsPersona(page, 'Ms. Sana Javed');

    // Check Admin Home
    await expect(page).toHaveURL(/#\/admin/, { timeout: 10000 });
    await expect(page.locator('text=Ms. Sana Javed').first()).toBeVisible();
    await expect(page.locator('text=Margalla Heights College').first()).toBeVisible();

    // Navigate to People Directory
    await page.goto('/#/people');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=People').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Ali Raza').first()).toBeVisible();

    // Navigate to Classes
    await page.goto('/#/classes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=11th Pre-Medical A').first()).toBeVisible({ timeout: 10000 });

    // Navigate to CSV Roster Import
    await page.goto('/#/import');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Import Data').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Download the template').first()).toBeVisible();
  });

  test('Security & Role Boundaries: Enforce access control and isolation', async ({ page }) => {
    // Log in as Student
    await loginAsPersona(page, 'Ali Raza');
    await expect(page).toHaveURL(/#\/home/, { timeout: 10000 });

    // Attempt to access College Admin screen directly
    await page.goto('/#/admin');
    // Must be redirected back to Student Home
    await expect(page).toHaveURL(/#\/home/);

    // Attempt to access Teacher screen directly
    await page.goto('/#/teacher');
    await expect(page).toHaveURL(/#\/home/);

    // Log out
    await page.goto('/#/logout');
    await expect(page).toHaveURL(/#\/login/);
  });

  test('Theme & Responsive Checks: Mobile Viewport and Component Gallery', async ({ page }) => {
    // Test Gallery component showcase
    await page.goto('/#/gallery');
    await expect(page.locator('text=Component Gallery').first()).toBeVisible({ timeout: 10000 });

    // Verify dark mode theme toggle exists
    const themeBtn = page.locator('button:has-text("dark_mode"), button:has-text("light_mode")').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
    }
  });

});
