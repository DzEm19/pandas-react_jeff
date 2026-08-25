import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

(async () => {
  console.log('headless_image_test: starting');
  const outDir = path.resolve(process.cwd(), 'files');
  console.log('headless_image_test: outDir=', outDir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const logPath = path.join(outDir, 'image_test_console.log');
  const screenshotPath = path.join(outDir, 'image_test_screenshot.png');

  const url = process.env.URL || 'http://localhost:5175/admin/imagen';
  const logs = [];
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    });
    const page = await browser.newPage();

    page.on('console', (msg) => {
      const text = `[console:${msg.type()}] ${msg.text()}`;
      logs.push(text);
      console.log(text);
    });
    page.on('pageerror', (err) => {
      const text = `[pageerror] ${err.toString()}`;
      logs.push(text);
      console.error(text);
    });
    page.on('requestfailed', (req) => {
      const failure = req.failure() ? req.failure().errorText : 'unknown';
      const text = `[requestfailed:${failure}] ${req.url()}`;
      logs.push(text);
      console.error(text);
    });

    // increase timeout for slow environments
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // wait a little for any runtime logs (use generic sleep to avoid API mismatches)
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // take screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await browser.close();
    fs.writeFileSync(logPath, logs.join('\n'));
    console.log('Saved screenshot to', screenshotPath);
    console.log('Saved logs to', logPath);
    process.exit(0);
  } catch (err) {
    const errMsg = `[run_error] ${err.stack || err}`;
    fs.writeFileSync(logPath, errMsg + '\n' + logs.join('\n'));
    console.error(errMsg);
    process.exit(2);
  }
})();
