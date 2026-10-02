const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://127.0.0.1:8080/');
  console.log('Page loaded');
  
  // Click START on main menu
  await page.waitForSelector('.main-menu button', { timeout: 5000 });
  
  // Evaluate click on the START button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.main-menu button'));
    const startBtn = btns.find(b => b.textContent.includes('START'));
    if (startBtn) startBtn.click();
  });
  console.log('Clicked main menu START');

  // Wait for login screen
  await page.waitForSelector('#login-start-btn', { timeout: 5000 });
  
  await page.fill('#login-name', 'testuser');
  await page.fill('#login-age', '20');

  // Click START GAME
  await page.click('#login-start-btn');
  console.log('Clicked START GAME');
  
  // Wait to see if Chapters screen becomes active
  try {
    await page.waitForSelector('#chapters-screen.active', { timeout: 5000 });
    console.log('SUCCESS: Navigated to Chapters screen!');
  } catch(e) {
    console.log('FAILED: Chapters screen did not become active');
    const errText = await page.locator('#login-error').innerText();
    console.log('LOGIN ERROR:', errText);
  }

  await browser.close();
})();
