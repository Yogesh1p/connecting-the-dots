const fs = require('fs');

// The exact path to the target article
const targetFile = '/Users/yogesh/Documents/connecting-the-dots/Library/ai/generative-models/01.autoregressive-models/02.fixed-length-autoregressive-models/index.html';

function patchArticle() {
    try {
        // Probe and read the file
        let html = fs.readFileSync(targetFile, 'utf8');

        // Check if we've already applied the patch
        if (html.includes('id="blend-figures-patch"')) {
            console.log('⚠️ The article is already patched!');
            return;
        }

        // The CSS override to strip boxes and blend the animations
        const patchCSS = `
    <!-- PATCH: Blend interactive figures into the page -->
    <style id="blend-figures-patch">
        .raster-figure, .fvsbn-figure, .nade-matrix-figure, .nade-figure {
            padding: 2rem 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .raster-array, .fvsbn-formula-box, .nade-formula-box {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
    </style>
</head>`;

        // Inject the patch right before the closing </head> tag
        const patchedHtml = html.replace('</head>', patchCSS);

        // Save the modifications back to the file
        fs.writeFileSync(targetFile, patchedHtml, 'utf8');
        console.log('✅ Successfully patched the fixed-length autoregressive models article!');

    } catch (err) {
        console.error('❌ Error patching the file:', err.message);
    }
}

patchArticle();