# PDF Renamer

Drag and drop PDF files to automatically suggest filenames based on document titles. Supports batch renaming and download.

## Usage

1. Open `index.html` in a browser (or serve via a local HTTP server)
2. Drag PDF files onto the page, or click to select files
3. Wait for analysis to complete and review the suggested filenames
4. Edit the suggested names if needed, then click the download button to save the renamed PDFs

> **Note**: Only PDF files are supported. Non-PDF files are skipped automatically.

---

## Title Resolution Logic

The suggested filename is determined by trying the following sources in order until a valid title is found:

### 1. PDF Metadata Title

First, read the embedded `metadata.info.Title` from the PDF. If it exists and passes validation, it is used as the suggested name.

### 2. Metadata Title Validation (`isValidTitle`)

The following cases are treated as invalid and trigger the next fallback:

- Empty or not a string
- Length < 3 after trimming whitespace
- Starts with (case-insensitive) any of:
  - `microsoft word -`
  - `untitled`
  - `replace this title`
  - `presentation`

### 3. First-Page Text Inference

If the metadata title is invalid, the first page is parsed and the title is inferred from font size:

1. **Filter candidates**: Text items with length > 2 and at least one letter
2. **Sort by font size**: Descending by font height
3. **Get max size**: Take the largest font height
4. **Merge title**: Take items with height ≥ 95% of max, join in reading order

### 4. Fallback to Original Filename

If all above fail, the original filename (without `.pdf` extension) is used as the suggested name.

---

## Filename Sanitization (`cleanFilename`)

Regardless of the title source, the final name is sanitized as follows:

| Rule | Behavior |
|------|----------|
| **Colon** | `:` and surrounding spaces → single underscore `_`, no space after underscore |
| **Other forbidden chars** | `< > " / \ \| ? *` → removed |
| **Spaces** | Consecutive whitespace → single space |
| **Length** | Over 100 chars → truncated to 100 |
| **Empty result** | If sanitized string is empty → use `untitled` |

### Examples

| Original Title | Sanitized |
|----------------|-----------|
| `Chapter 1: Introduction` | `Chapter 1_Introduction` |
| `A : B` | `A_B` |
| `Paper Title/Version 2` | `Paper TitleVersion 2` |
| `Document<draft>` | `Documentdraft` |

---

## Project Structure

```
pdf-renamer/
├── index.html      # Entry page
├── style.css       # Styles
├── src/
│   ├── app.js      # Drag & drop, file handling, download logic
│   ├── renamer.js  # Title resolution and filename sanitization
│   └── pdf-parser.js  # PDF.js wrapper for metadata and text extraction
└── README.md
```

## Tech Stack

- Vanilla JavaScript (ES Modules)
- [PDF.js](https://mozilla.github.io/pdf.js/) (loaded via CDN)

No build step required. Open `index.html` directly to use. If you hit CORS issues, run a local server (e.g. `npx serve .`).
