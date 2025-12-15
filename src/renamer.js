/**
 * Core logic for intelligent PDF renaming
 */

import { extractMetadata, extractFirstPageTextItems } from './pdf-parser.js';

export async function getSuggestedFilename(pdf, originalFilename) {
    let title = await extractMetadata(pdf);

    // Heuristic 1: If metadata title is missing or suspicious, try page 1 analysis
    if (!isValidTitle(title)) {
        console.log('Metadata title invalid/missing, trying page text...');
        const pageItems = await extractFirstPageTextItems(pdf);
        title = inferTitleFromText(pageItems);
    }

    // Fallback: use original filename if everything fails
    if (!isValidTitle(title)) {
        return cleanFilename(originalFilename.replace(/\.pdf$/i, ''), true);
    }

    return cleanFilename(title);
}

function isValidTitle(title) {
    if (!title || typeof title !== 'string') return false;
    const trimmed = title.trim();
    if (trimmed.length < 3) return false;

    const lower = trimmed.toLowerCase();
    // Common default titles to ignore
    const badStarts = [
        'microsoft word -',
        'untitled',
        'replace this title',
        'presentation',
    ];

    if (badStarts.some(s => lower.startsWith(s))) return false;

    return true;
}

function inferTitleFromText(items) {
    if (!items || items.length === 0) return null;

    // Filter out obviously non-title items (too small, just numbers, etc)
    // We want significant text.
    let candidates = items.filter(item => {
        const text = item.str.trim();
        return text.length > 2 && /[a-zA-Z]/.test(text); // Must have some letters
    });

    if (candidates.length === 0) return null;

    // Sort by font height (descending)
    // Heuristic: Titles are usually the largest text on the first page.
    candidates.sort((a, b) => b.height - a.height);

    // Get the largest font size
    const maxHeight = candidates[0].height;

    // Group items that are within 95% of the max height (handling multi-line titles)
    // And generally near the top (conceptually). But sorting by size is usually strongest signal for papers.
    const titleParts = candidates.filter(item => item.height >= maxHeight * 0.95);

    // Sort by vertical position (PDF coord system: 0,0 is usually bottom-left, so higher Y is higher up)
    // BUT we need to be careful. Let's rely on the order they appeared in the stream if Y is unreliable?
    // Actually, PDF.js usually returns items in reading order (left-right, top-down).
    // Let's rely on standard array order of titleParts, but re-verify Y if needed.
    // For now, joining them in index order usually works for multi-line titles if they were parsed in order.

    // Sometimes title parts are reading order, but let's just join them.
    const rawTitle = titleParts.map(t => t.str).join(' ');

    return rawTitle;
}

export function cleanFilename(text, isFallback = false) {
    if (!text) return 'untitled';

    let clean = text.trim();

    // Remove forbidden file characters
    clean = clean.replace(/[<>:"/\\|?*]/g, '');

    // Normalize spaces
    clean = clean.replace(/\s+/g, ' ');

    // Truncate to reasonable length (e.g. 100 chars)
    if (clean.length > 100) {
        clean = clean.substring(0, 100).trim();
    }

    return clean;
}
