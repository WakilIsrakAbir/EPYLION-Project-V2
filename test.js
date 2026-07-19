const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('file://e:/Projects/Epylion/Shimul Mama Project/Shimul Mama%27s Project V2/index.html');
    await page.evaluate(async () => {
        window.activeTabId = 'loadCalculation_summary';
        await window.fetchAndProcessData(true);
        await window.fetchLoadCalculationData();
        return window.globalLoadData.dyeing.length;
    }).then(len => {
        console.log('Dyeing load items:', len);
    }).catch(err => {
        console.error('Error:', err);
    });
    await browser.close();
})();
