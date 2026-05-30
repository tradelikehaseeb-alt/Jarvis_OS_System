import { tryLaunchPlaywrightPage } from "../agents/openclaw/src/execution-runtime/create-playwright-browser-action-pipeline.ts";

async function main() {
  const page = await tryLaunchPlaywrightPage();
  if (!page) {
    console.error("tryLaunchPlaywrightPage: FAIL");
    process.exit(1);
  }
  console.log("tryLaunchPlaywrightPage: OK");
  await page.goto("https://www.youtube.com", { timeout: 30000 });
  console.log("title:", await page.title());
  console.log("url:", page.url());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
