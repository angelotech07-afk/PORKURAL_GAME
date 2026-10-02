const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  page.on('request', request => {
      if (request.url().includes('/api/')) {
          console.log(`>> REQUEST: ${request.method()} ${request.url()}`);
      }
  });
  
  page.on('response', async response => {
      if (response.url().includes('/api/')) {
          console.log(`<< RESPONSE: ${response.status()} ${response.url()}`);
          try {
              const text = await response.text();
              console.log(`<< RESPONSE BODY: ${text}`);
          } catch(e) {}
      }
  });
  
  page.on('requestfailed', request => {
      if (request.url().includes('/api/')) {
          console.log(`!! REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
      }
  });

  await page.goto('http://127.0.0.1:8080/');
  console.log('Page loaded');
  
  await page.waitForTimeout(1000);
  
  // Click START on main menu
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.main-menu button'));
    const startBtn = btns.find(b => b.textContent.includes('START'));
    if (startBtn) startBtn.click();
  });
  console.log('Clicked main menu START');

  await page.waitForSelector('#login-start-btn', { timeout: 5000 });
  
  await page.fill('#login-name', 'testuser');
  await page.fill('#login-age', '20');

  await page.click('#login-start-btn');
  console.log('Clicked START GAME');
  
  await page.waitForTimeout(3000); // Wait for connection error or success
  
  const errText = await page.locator('#login-error').innerText();
  console.log('LOGIN ERROR VISIBLE:', errText);
  
  await browser.close();
})();
