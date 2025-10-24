import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST method with JSON body',
      required_fields: ['text', 'image_url', 'logo_url', 'brand_color', 'business_name']
    });
  }

  try {
    const { text, image_url, logo_url, brand_color, business_name } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing required field: text" });
    }

    console.log("Processing request for:", business_name);

    // Функция для загрузки изображений
    const fetchImageAsBase64 = async (url) => {
      if (!url) return null;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
      } catch (error) {
        console.log('Image load error:', error.message);
        return null;
      }
    };

    // Загружаем изображения
    const [bgBase64, logoBase64] = await Promise.all([
      fetchImageAsBase64(image_url),
      logo_url ? fetchImageAsBase64(logo_url) : Promise.resolve(null)
    ]);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1080px; height: 1080px;
            display: flex; align-items: center; justify-content: center;
            position: relative; overflow: hidden; font-family: Arial;
            ${bgBase64 ? `background-image: url('${bgBase64}');` : 'background: #000;'}
            background-size: cover; background-position: center;
          }
          .overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6));
          }
          .logo {
            position: absolute; top: 40px; left: 40px;
            width: 120px; height: 120px; object-fit: contain;
            border-radius: 10px; background: white; padding: 8px;
            z-index: 2; ${logoBase64 ? '' : 'display: none;'}
          }
          .content {
            position: relative; z-index: 2; color: white;
            text-align: center; padding: 60px 40px; width: 90%; max-width: 900px;
          }
          .business {
            font-size: 48px; font-weight: bold; margin-bottom: 30px;
            color: ${brand_color || "#FF6600"};
            text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
          }
          .text {
            font-size: 36px; line-height: 1.4; background: rgba(0,0,0,0.5);
            padding: 30px; border-radius: 20px; display: inline-block;
            white-space: pre-wrap; backdrop-filter: blur(5px);
          }
        </style>
      </head>
      <body>
        ${bgBase64 ? '' : '<div class="overlay"></div>'}
        ${logoBase64 ? `<img class="logo" src="${logoBase64}" />` : ''}
        <div class="content">
          <div class="business">${business_name || "Clickify"}</div>
          <div class="text">${text}</div>
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.setContent(html);
    const screenshot = await page.screenshot({ type: "png" });
    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.send(screenshot);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
