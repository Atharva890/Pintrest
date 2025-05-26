// server.js with Playwright
const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Middleware
app.use(cors({
    origin: [
        'https://pintrest-sable.vercel.app', // <-- Updated frontend URL
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Screenshot endpoint
app.post('/screenshot', async (req, res) => {
    let browser;
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Taking screenshot of: ${url}`);

        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--no-zygote',
                '--single-process',
                '--window-size=1200,800'
            ]
        });

        const context = await browser.newContext({
            viewport: { width: 1200, height: 800, deviceScaleFactor: 2 }
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const screenshot = await page.screenshot({ type: 'png', fullPage: true });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename="screenshot.png"');
        res.send(screenshot);

        console.log('Screenshot taken successfully');
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            error: 'Failed to take screenshot',
            details: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Screenshot service is running (Playwright)' });
});

// Cache control middleware
app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    next();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Screenshot service (Playwright) is ready!');
});