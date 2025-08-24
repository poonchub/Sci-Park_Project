import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Accept All' }).click();
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('externaluser1@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('link', { name: 'Create Service Area' }).click();
  await page.getByRole('button', { name: 'Next: Service Area Request' }).click();
  await page.getByRole('textbox', { name: 'Please describe the purpose' }).click();
  await page.getByRole('textbox', { name: 'Please describe the purpose' }).fill('are you ok brooo im hsjdkfjsklfjsljflksjfklsjdlfk');
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).click();
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).click();
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).fill('-1');
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).click();
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).fill('3');
  await page.getByRole('textbox', { name: 'Please describe the activities that will be conducted in the building' }).click();
  await page.getByRole('textbox', { name: 'Please describe the activities that will be conducted in the building' }).fill('dsfsdfsdfsdfsdfsdf');
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).fill('3');
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).click();
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).fill('040000');
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).press('ArrowLeft');
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).press('ArrowLeft');
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).press('ArrowLeft');
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).press('ArrowLeft');
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).press('ArrowLeft');
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).fill('40000');
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).fill('2');
  await page.getByRole('textbox', { name: 'Collaboration Plan Description' }).click();
  await page.getByRole('textbox', { name: 'Collaboration Plan Description' }).fill('sdfsdfsdfsdfsdfsdfsdfsdfsd');
  await page.getByRole('textbox', { name: 'Please describe how your' }).click();
  await page.getByRole('textbox', { name: 'Please describe how your' }).fill('sdfsfsfsdfsfsdfsdfsdfsdf');
  await page.getByRole('button', { name: 'Upload Document' }).click();
  await page.getByRole('button', { name: 'Upload Document' }).setInputFiles('รายชื่อนักศึกษา R2M13 มหาวิทยาลัย.pdf');
  await page.getByRole('textbox', { name: 'Please describe how your' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).dblclick();
  await page.getByRole('button', { name: 'Create Request' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();

  // ---------------------
  await context.close();
  await browser.close();
})();