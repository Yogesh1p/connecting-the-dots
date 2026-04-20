const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Directories
const ARTICLES_DIR = path.join(__dirname, 'dots'); 
const OUTPUT_DIR = path.join(__dirname, 'assets', 'og'); 

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
    console.log('Fetching fonts and initializing Satori...');

    // Satori is ESM, so we dynamically import it in a CommonJS environment
    const { default: satori } = await import('satori');
    const { html } = await import('satori-html');
    const { Resvg } = await import('@resvg/resvg-js');

    // FIX: Using a highly reliable CDN to fetch the raw Lora Bold WOFF file
    const fontResponse = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/lora/files/lora-latin-700-normal.woff');
    
    if (!fontResponse.ok) {
        throw new Error(`Failed to fetch font: ${fontResponse.statusText}`);
    }
    
    const fontData = await fontResponse.arrayBuffer();

    const files = fs.readdirSync(ARTICLES_DIR).filter(file => file.endsWith('.html'));
    if (files.length === 0) return console.log('No HTML files found.');

    console.log(`Starting blazingly fast generation for ${files.length} files...`);

    for (const file of files) {
        try {
            const filePath = path.join(ARTICLES_DIR, file);
            let htmlContent = fs.readFileSync(filePath, 'utf-8');
            const $ = cheerio.load(htmlContent);
            
            const title = $('meta[name="title"]').attr('content') || $('title').text();
            const chapter = $('meta[name="chapter"]').attr('content') || 'Article';
            const author = $('meta[name="author"]').attr('content') || 'Yogesh';
            const description = $('meta[name="description"]').attr('content') || '';

            // Skip template files or files without titles
            if (!title || file === '_template.html') continue;

            const outputFilename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
            const outputPath = path.join(OUTPUT_DIR, outputFilename);

            // 1. Generate Image instantly if missing
            if (!fs.existsSync(outputPath)) {
                // Satori uses inline Flexbox styles
                const markup = html`
                    <div style="display: flex; flex-direction: column; justify-content: space-between; width: 1200px; height: 630px; background-color: #FDFBF7; padding: 80px 100px; border: 1px solid #E8DFD1;">
                        <div style="display: flex; flex-direction: column;">
                            <div style="font-size: 32px; color: #D48C70; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 24px;">
                                ${chapter}
                            </div>
                            <div style="font-size: 88px; color: #2D241E; line-height: 1.1; letter-spacing: -2px; max-width: 1000px;">
                                ${title}
                            </div>
                        </div>
                        <div style="display: flex; border-top: 2px solid #E8DFD1; padding-top: 30px; justify-content: space-between; align-items: center; width: 100%;">
                            <div style="font-size: 32px; color: #4A3F35;">
                                ${author}
                            </div>
                            <div style="font-size: 32px; color: #847769;">
                                Connecting the Dots
                            </div>
                        </div>
                    </div>
                `;

                // Convert HTML to SVG
                const svg = await satori(markup, {
                    width: 1200,
                    height: 630,
                    fonts: [
                        {
                            name: 'Lora',
                            data: fontData,
                            weight: 700,
                            style: 'normal',
                        },
                    ],
                });

                // Convert SVG to PNG
                const resvg = new Resvg(svg, {
                    fitTo: { mode: 'width', value: 1200 },
                });
                const pngData = resvg.render();
                const pngBuffer = pngData.asPng();

                fs.writeFileSync(outputPath, pngBuffer);
                console.log(`✅ Generated: ${outputFilename}`);
            } else {
                console.log(`⏭️  Skipping: ${outputFilename} already exists.`);
            }

            // 2. Inject Meta Tags
            if (!htmlContent.includes('og:image')) {
                const metaTags = `\n    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="../assets/og/${outputFilename}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">`;
                
                htmlContent = htmlContent.replace('</head>', `${metaTags}\n</head>`);
                fs.writeFileSync(filePath, htmlContent, 'utf-8');
            }

        } catch (err) {
            console.error(`❌ Failed processing ${file}:`, err.message);
        }
    }

    console.log('🚀 Task complete. No browsers were harmed in the making of these images.');
}

run().catch(console.error);