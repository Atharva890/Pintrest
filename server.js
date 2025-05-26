// server.js
const express = require('express');
const puppeteer = require('puppeteer-core');
const cors = require('cors');
const path = require('path');
const { execSync } = require('child_process');

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
    origin: ['https://digitalguruji-q6s4.onrender.com', 'http://localhost:3000'],
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
    const timeout = 60000; // 60 seconds
    let timeoutId;

    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Taking screenshot of: ${url}`);

        // Launch puppeteer
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: true, // Changed from 'new' to true
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-extensions'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            ignoreHTTPSErrors: true,
            defaultViewport: {
                width: 1200,
                height: 800,
                deviceScaleFactor: 2
            }
        });

        console.log('Browser launched successfully');
        console.log('Creating new page...');
        const page = await browser.newPage();
        console.log('Page created successfully');
        
        // Set viewport size
        await page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 2
        });

        // Add error listener
        page.on('error', err => {
            console.error('Page error:', err);
        });

        // Navigate to the URL
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Take screenshot
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true
        });

        // Set response headers
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename="screenshot.png"');
        
        // Send screenshot
        res.send(screenshot);
        
        console.log('Screenshot taken successfully');

    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            browserPath: process.env.PUPPETEER_EXECUTABLE_PATH
        });
        res.status(500).json({ 
            error: 'Failed to take screenshot',
            details: error.message,
            path: process.env.PUPPETEER_EXECUTABLE_PATH
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Screenshot service is running' });
});

// Cache control middleware
app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    next();
});

// Cleanup on exit
process.on('SIGTERM', async () => {
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

// Check Chrome installation
try {
    console.log('Chrome installation path:', execSync('which google-chrome-stable').toString());
} catch (error) {
    console.error('Chrome not found:', error);
}

// Add this new endpoint
app.get('/check-browser', async (req, res) => {
    try {
        const { execSync } = require('child_process');
        const chromePath = execSync('which google-chrome-stable').toString().trim();
        const exists = require('fs').existsSync(chromePath);
        
        res.json({
            chromePath,
            exists,
            env: process.env.PUPPETEER_EXECUTABLE_PATH
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Screenshot service is ready!');
});