import { loadPDF, extractMetadata } from './pdf-parser.js';
import { getSuggestedFilename } from './renamer.js';

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const template = document.getElementById('file-item-template');

// Drag & Drop Handlers
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = ''; // Reset to allow same file selection again
});

async function handleFiles(files) {
    for (const file of files) {
        if (file.type !== 'application/pdf') {
            console.warn(`Skipping non-PDF: ${file.name}`);
            continue;
        }
        await processFile(file);
    }
}

async function processFile(file) {
    // Render initial UI Item
    const itemFragment = template.content.cloneNode(true);
    const itemEl = itemFragment.querySelector('.file-item');

    // Populate simple data
    itemEl.querySelector('.name-text').textContent = file.name;
    const input = itemEl.querySelector('.new-name-input');
    const status = itemEl.querySelector('.status-message');
    const downloadBtn = itemEl.querySelector('.btn-download');
    const removeBtn = itemEl.querySelector('.btn-remove');

    // Add to list immediately
    fileList.appendChild(itemEl);

    // Initial state
    status.innerHTML = '<span class="spinner"></span> Analyzing...';
    input.disabled = true;

    try {
        const pdf = await loadPDF(file);
        const suggestedName = await getSuggestedFilename(pdf, file.name);

        input.value = suggestedName;
        input.disabled = false;

        status.innerHTML = '<span class="status-valid">✓ Ready to rename</span>';
        downloadBtn.disabled = false;

        // Setup Actions
        removeBtn.onclick = () => itemEl.remove();

        downloadBtn.onclick = () => {
            const finalName = input.value.trim() || 'untitled';
            downloadFile(file, `${finalName}.pdf`);
        };

        // Auto-validate input on change
        input.addEventListener('input', () => {
            if (input.value.trim().length === 0) {
                downloadBtn.disabled = true;
                status.innerHTML = '<span class="status-error">Filename cannot be empty</span>';
            } else {
                downloadBtn.disabled = false;
                status.innerHTML = '';
            }
        });

    } catch (error) {
        console.error(error);
        status.innerHTML = `<span class="status-error">Error: ${error.message}</span>`;
        // Allow manual entry even if parsing fails
        input.disabled = false;
        input.value = file.name.replace('.pdf', '');
        downloadBtn.disabled = false;
        removeBtn.onclick = () => itemEl.remove();
        downloadBtn.onclick = () => {
            const finalName = input.value.trim() || 'default';
            downloadFile(file, `${finalName}.pdf`);
        };
    }
}

function downloadFile(fileBlob, fileName) {
    const url = URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
