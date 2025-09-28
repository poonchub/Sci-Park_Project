import { test, expect } from "@playwright/test";

test("Create Rental Room Invoice", async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByRole("button", { name: "Accept All" }).click();

    await page.getByRole("button", { name: "Room" }).click();
    await page.getByRole("link", { name: "Rental Space" }).click();
    await page.getByRole("row", { name: "Room No. A101, Floor 1 Room" }).getByLabel("Create Invoice").click();
    await page.getByRole("button", { name: "Choose date, selected date is Sep 15," }).click();
    await page.getByRole("gridcell", { name: "30" }).click();
    await page.getByPlaceholder("Enter amount.").first().fill("1500");
    await page.getByPlaceholder("Enter amount.").nth(1).fill("2000");

    await page.getByRole("button", { name: "Create Invoice" }).click();
    await expect(page.getByRole("alert")).toContainText("SuccessInvoice created successfully!");
});
