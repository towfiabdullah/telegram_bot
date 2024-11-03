const puppeteer = require('puppeteer');

(async () => {
    // Launch a new browser instance
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Go to the target URL
    await page.goto('https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2'); // Replace with the actual URL

    // Wait for the content to load
    await page.waitForSelector('.space-y-6.mt-8'); // Ensure this selector targets the correct element

    // Extract the links
    const links = await page.evaluate(() => {
        // Select the elements containing the links
        const linkElements = document.querySelectorAll('.space-y-6.mt-8 a'); // Adjust selector as needed
        return Array.from(linkElements).map(link => link.href).filter(link => link.includes('leetcode'));
    });

    console.log('Collected Problem Links:', links);

    // Close the browser
    await browser.close();
})();
