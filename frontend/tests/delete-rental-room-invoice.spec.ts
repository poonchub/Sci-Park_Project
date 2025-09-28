import { test, expect } from "@playwright/test";

test("Delete Rental Room Invoice", async ({ page }) => {
    await page.goto("http://localhost:5173/room/rental-space");
    await page.getByRole("button", { name: "Accept All" }).click();

    await page.getByRole("row", { name: "Room No. A101, Floor 1 Room" }).getByLabel("Invoice List").click();
    await page.getByRole("button", { name: "Delete Invoice" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.locator("main")).toContainText("SuccessInvoice deleted successfully!");
});
