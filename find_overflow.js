const puppeteer = require("puppeteer");
(async () => {
  const b = await puppeteer.launch({ headless: "new", args: ["--window-size=390,844"] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto("https://thuantuongtieudinh.io.vn/link-khach-moi/so-do-ban", { waitUntil: "networkidle2", timeout: 15000 });
  const result = await p.evaluate(() => {
    const offenders = [];
    document.querySelectorAll("*").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > 390) {
        offenders.push({ tag: el.tagName, cls: (el.className || "").substring(0, 60), id: el.id || "", right: Math.round(r.right), width: Math.round(r.width), left: Math.round(r.left) });
      }
    });
    // Sort by right-edge descending, return top offenders
    offenders.sort((a, b) => b.right - a.right);
    return offenders.slice(0, 25);
  });
  console.log(JSON.stringify(result, null, 2));
  await b.close();
})();

