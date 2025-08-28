import { chromium } from 'playwright';


(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Accept All' }).click();
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('internaluser1@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('link', { name: 'Create Service Area' }).click();
  await page.getByRole('textbox', { name: 'Enter corporate registration' }).click();
  await page.getByRole('textbox', { name: 'Enter corporate registration' }).fill('assdffsafdfsadfsadf');
  await page.getByText('-- Please select business').click();
  await page.getByRole('option', { name: 'Agriculture & Food' }).click();
  await page.getByRole('combobox', { name: '-- Please select company size' }).click();
  await page.getByRole('option', { name: 'Small (1-50 employees)' }).click();
  await page.getByRole('textbox', { name: 'Enter main services provided' }).click();
  await page.getByRole('textbox', { name: 'Enter main services provided' }).fill('sdfasdfasdfasfd');
  await page.getByRole('spinbutton', { name: 'Enter registered capital in' }).click();
  await page.getByRole('spinbutton', { name: 'Enter registered capital in' }).fill('10000');
  await page.getByRole('spinbutton', { name: 'Enter number of people to hire' }).click();
  await page.getByRole('spinbutton', { name: 'Enter number of people to hire' }).fill('20');
  await page.getByRole('spinbutton', { name: 'Enter annual R&D investment' }).click();
  await page.getByRole('spinbutton', { name: 'Enter annual R&D investment' }).click();
  await page.getByRole('spinbutton', { name: 'Enter annual R&D investment' }).fill('17000');
  await page.getByRole('textbox', { name: 'Please describe your three' }).click();
  await page.getByRole('textbox', { name: 'Please describe your three' }).fill('sdfasfdsafasdfasdfasdf');
  await page.getByRole('button', { name: 'Next: Service Area Request' }).click();
  await page.locator('label').filter({ hasText: 'Enter corporate registration' }).click();
  await page.getByRole('textbox', { name: 'Enter corporate registration' }).fill('assdffsafdfsadfsadfsdfasdfasdfasdf');
  await page.getByRole('button', { name: 'Next: Service Area Request' }).click();
  await page.getByRole('textbox', { name: 'Enter corporate registration' }).click();
  await page.getByRole('textbox', { name: 'Enter corporate registration' }).click();
  await page.getByRole('textbox', { name: 'Enter corporate registration' }).click();
  await page.getByRole('textbox', { name: 'Enter corporate registration' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Enter corporate registration' }).fill('1329901260944');
  await page.getByRole('button', { name: 'Next: Service Area Request' }).click();
  await page.getByRole('textbox', { name: 'Please describe the purpose' }).click();
  await page.getByRole('textbox', { name: 'Please describe the purpose' }).fill('sdafsdfasfasdfasfasdfasdf');
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).click();
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).click();
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).click();
  await page.getByRole('spinbutton', { name: 'Enter number of employees' }).fill('5');
  await page.getByRole('textbox', { name: 'Please describe the activities that will be conducted in the building' }).click();
  await page.getByRole('textbox', { name: 'Please describe the activities that will be conducted in the building' }).fill('dfsfsdfsdfsdfsdfdfsdf');
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).click();
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).fill('5');
  await page.getByRole('spinbutton', { name: 'Project Start Year' }).dblclick();
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).click();
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).click();
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).fill('010000');
  await page.getByRole('spinbutton', { name: 'Budget (THB)' }).click();
  await page.getByRole('textbox', { name: 'Collaboration Plan Description' }).click();
  await page.getByRole('textbox', { name: 'Collaboration Plan Description' }).fill('sdfasdfasfsadfsadfsadfasf');
  await page.getByRole('textbox', { name: 'Please describe how your' }).click();
  await page.getByRole('textbox', { name: 'Please describe how your' }).fill('sdfafasdfsadfasdfasfasf');
  await page.getByRole('button', { name: 'Upload Document' }).click();
  await page.getByRole('button', { name: 'Upload Document' }).setInputFiles('Transcript information(ใช้สำหรับสมัครงาน Part-time เท่านั้น ).pdf');
  await page.getByRole('button', { name: 'Create Request' }).click();
  await page.getByRole('button', { name: 'Create Request' }).click();
  await page.getByRole('checkbox', { name: 'ฉันได้อ่านและยอมรับตามนโยบายความเป็นส่วนตัว' }).check();
  await page.getByRole('button', { name: 'ยอมรับและดำเนินการต่อ' }).click();

  // ---------------------
  await context.close();
  await browser.close();
})();