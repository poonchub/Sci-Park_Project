import { test, expect } from "@playwright/test";

test("Payment Rental Room Invoice", async ({ page }) => {
    await page.goto("http://localhost:5173/my-account");
    await page.getByRole("button", { name: "Accept All" }).click();

    await page.getByRole("tab", { name: "Rental Room Invoice" }).click();
    await page.getByRole('button', { name: 'Pay Now' }).click();
    const fileInput = await page.$('input[type="file"]');
    await fileInput?.setInputFiles(
        "E:/My_Works_Programer/My_Coding_Practice/Sci-Park_Project/frontend/tests/images/slip-test.jpg"
    );

    await expect(page.locator('main')).toContainText('SuccessUpload slip successfully.');
});
