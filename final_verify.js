const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/admin/dashboard');
  console.log('Admin Dashboard Loaded');
  await page.screenshot({ path: '/home/jules/verification/screenshots/final_admin_dashboard.png' });

  // Check Search functionality
  await page.fill('input[placeholder*="Search"]', 'NonExistentUser');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/jules/verification/screenshots/final_admin_search.png' });

  // Public Submission Form
  console.log('Checking Submission Form...');
  await page.goto('http://localhost:3000/submit');
  await page.waitForSelector('select[name="eventId"]');
  await page.screenshot({ path: '/home/jules/verification/screenshots/final_submit_step1.png' });

  await browser.close();
})();
