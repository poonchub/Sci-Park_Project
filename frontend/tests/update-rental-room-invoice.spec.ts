import { test, expect } from "@playwright/test";

test("Update Rental Room Invoice", async ({ page }) => {
    await page.goto("http://localhost:5173/room/rental-space");
    await page.getByRole("button", { name: "Accept All" }).click();

    await page.getByRole("row", { name: "Room No. A101, Floor 1 Room" }).getByLabel("Invoice List").click();
    await page.getByRole("button", { name: "Edit Invoice" }).click();
    await page.getByPlaceholder("Enter amount.").first().fill("2600");
    await page.getByRole("button", { name: "Save Change" }).click();
    await expect(page.locator("main")).toContainText("SuccessThe invoice has been updated successfully.");
});
