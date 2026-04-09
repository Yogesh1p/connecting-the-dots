const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// 1. Directory Configuration
const ARTICLES_DIR = path.join(__dirname, 'dots'); 
const OUTPUT_DIR = path.join(__dirname, 'assets', 'og'); 

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory at: ${OUTPUT_DIR}`);
}

// 2. The exact CSS from your theme
const getTemplateHTML = (category, title, author) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg:      #FDFBF7;
            --text:    #4A3F35;
            --accent:  #D48C70;
            --surface: #F4EFE6;
            --border:  #E8DFD1;
            --muted:   #847769;
            --dark:    #2D241E;
        }
        body {
            margin: 0;
            padding: 0;
            width: 1200px;
            height: 630px;
            background: var(--bg);
            font-family: system-ui, sans-serif;
            box-sizing: border-box;
            border: 1px solid var(--border);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 80px 100px;
            overflow: hidden;
        }
        body::before {
            content: "";
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            background-image: radial-gradient(var(--border) 2px, transparent 2px);
            background-size: 40px 40px;
            opacity: 0.5;
            z-index: 0;
        }
        .content {
            position: relative;
            z-index: 1;
        }
        .category {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--accent);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 1.5rem;
        }
        .title {
            font-family: 'Lora', Georgia, serif;
            font-size: 5.5rem;
            font-weight: 700;
            color: var(--dark);
            line-height: 1.1;
            letter-spacing: -0.02em;
            margin: 0;
            max-width: 1000px;
        }
        .footer {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            border-top: 2px solid var(--border);
            padding-top: 30px;
        }
        .author {
            font-size: 1.8rem;
            font-weight: 600;
            color: var(--text);
        }
        .site {
            font-family: 'Lora', Georgia, serif;
            font-size: 1.8rem;
            font-style: italic;
            color: var(--muted);
            margin-left: auto;
        }
    </style>
</head>
<body>
    <div class="content">
        <div class="category">${category}</div>
        <h1 class="title">${title}</h1>
    </div>
    <div class="footer">
        <div class="author">${author}</div>
        <div class="site">Connecting the Dots</div>
    </div>
</body>
</html>
`;

async function generateAllOGImages() {
    console.log('Starting OG Image generation...');
    
    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`Error: The folder "${ARTICLES_DIR}" does not exist. Please check the path.`);
        return;
    }

    const files = fs.readdirSync(ARTICLES_DIR).filter(file => file.endsWith('.html'));
    
    if (files.length === 0) {
        console.log('No HTML files found in', ARTICLES_DIR);
        return;
    }

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1200, height: 630 }
    });

    const page = await browser.newPage();

    for (const file of files) {
        const filePath = path.join(ARTICLES_DIR, file);
        let htmlContent = fs.readFileSync(filePath, 'utf-8');
        
        // Load DOM to read your existing meta tags
        const $ = cheerio.load(htmlContent);
        
        // 3. Extract data perfectly matching your meta tags
        const title = $('meta[name="title"]').attr('content');
        const chapter = $('meta[name="chapter"]').attr('content');
        const author = $('meta[name="author"]').attr('content');
        const description = $('meta[name="description"]').attr('content') || '';

        if (!title) {
            console.log(`⚠️ Skipping ${file}: No <meta name="title"> found.`);
            continue;
        }

        // Format filename: e.g., "fixed-length-autoregressive-models.png"
        const outputFilename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
        const outputPath = path.join(OUTPUT_DIR, outputFilename);

        console.log(`📸 Generating image: ${outputFilename}`);

        // 4. Generate the 1200x630 image
        const template = getTemplateHTML(chapter, title, author);
        await page.setContent(template, { waitUntil: 'networkidle0' }); 
        await page.screenshot({ path: outputPath, type: 'png' });

        // 5. Inject ONLY the missing OG/Twitter Meta Tags
        if (!htmlContent.includes('<meta property="og:image"')) {
            const metaTagsToInject = `
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="../assets/og/${outputFilename}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
`;
            // Safely inject right before the closing </head> tag
            htmlContent = htmlContent.replace('</head>', `${metaTagsToInject}</head>`);
            fs.writeFileSync(filePath, htmlContent, 'utf-8');
            console.log(`✅ Injected missing OG tags into ${file}`);
        } else {
            console.log(`⏩ OG tags already exist in ${file}, skipping injection.`);
        }
    }

    await browser.close();
    console.log('🎉 Finished! All images generated and HTML files updated.');
}

generateAllOGImages().catch(console.error);