import chromium from 'chrome-aws-lambda';  // Use chrome-aws-lambda for Vercel
import { sendPrompt } from './gpt.js';     // Import your GPT function

export default async function handler(req, res) {
  // Set CORS headers (if needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let browser;
  try {
    // Launch Puppeteer using chrome-aws-lambda
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const link = `https://www.yelp.com/biz/prince-tea-house-brooklyn-3`;

    let allTextContent = [];
    let totalRatings = 0;
    let ratingCount = 0;

    for (let startNumber = 0; startNumber < 30; startNumber += 10) {
      await page.goto(`${link}?start=${startNumber}&sort_by=date_desc`, {
        waitUntil: 'networkidle2',
      });

      try {
        await page.waitForSelector('#reviews', { timeout: 5000 });
      } catch (error) {
        console.log('Reviews section not found, breaking the loop.');
        break;
      }

      const data = await page.evaluate(() => {
        const myElement = document.getElementById('reviews');
        const spans = myElement.querySelectorAll('span[lang="en"]');
        const textContents = Array.from(spans).map(span => span.textContent);

        const starRatings = myElement.querySelectorAll('[aria-label*="star rating"]');
        const filteredStarRatings = Array.from(starRatings).filter(element =>
          /^(1|2|3|4|5) star rating$/.test(element.getAttribute('aria-label'))
        );

        let totalRatings = 0;
        const ratingCount = filteredStarRatings.length;

        filteredStarRatings.forEach(element => {
          const rating = parseInt(element.getAttribute('aria-label').charAt(0), 10);
          totalRatings += rating;
        });

        return {
          textContent: textContents,
          totalRatings: totalRatings,
          ratingCount: ratingCount,
        };
      });

      allTextContent.push(...data.textContent);
      totalRatings += data.totalRatings;
      ratingCount += data.ratingCount;
    }

    const averageRating = ratingCount > 0 ? totalRatings / ratingCount : 0;
    const combinedText = allTextContent.join('\n');

    // Call GPT to summarize the content
    const prompt = `Summarize and give me 10 highlights:\n\n${combinedText}`;
    const openaiResponse = await sendPrompt(prompt);

    // Close the browser
    await browser.close();

    // Return JSON response with the data
    res.status(200).json({
      combinedText,
      averageRating: averageRating.toFixed(2),
      gptSummary: openaiResponse,
    });

  } catch (error) {
    // Handle any errors
    console.error('Error occurred:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
