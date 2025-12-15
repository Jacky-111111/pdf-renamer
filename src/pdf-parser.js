/**
 * Wrapper around PDF.js to extract metadata and text
 */

export async function loadPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    return pdf;
}

export async function extractMetadata(pdf) {
    try {
        const metadata = await pdf.getMetadata();
        return metadata?.info?.Title || null;
    } catch (e) {
        console.warn('Metadata extraction failed', e);
        return null;
    }
}

export async function extractFirstPageTextItems(pdf) {
    try {
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        
        // Return items with their transform (for font size/position)
        // item.str = text, item.transform[0] = scaled font width approx, item.transform[3] = font height
        return textContent.items.map(item => ({
            str: item.str,
            height: Math.abs(item.transform[3]), // Font height
            y: item.transform[5], // Y position (bottom-up in PDF usually)
            hasEOL: item.hasEOL
        }));
    } catch (e) {
        console.warn('Text extraction failed', e);
        return [];
    }
}
