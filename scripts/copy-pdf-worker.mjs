import { copyFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const sourceCandidates = [
    path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
    path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs'),
    path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
    path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.js'),
];

async function findFirstExistingPath(paths) {
    for (const candidate of paths) {
        try {
            await access(candidate, constants.F_OK);
            return candidate;
        } catch {
            // Keep checking the remaining candidates.
        }
    }

    return null;
}

async function main() {
    const sourcePath = await findFirstExistingPath(sourceCandidates);

    if (!sourcePath) {
        throw new Error(
            'Could not locate pdf.worker.min.mjs/.js in node_modules/pdfjs-dist. Ensure pdfjs-dist is installed.',
        );
    }

    await mkdir(publicDir, { recursive: true });

    const destinationExt = path.extname(sourcePath) === '.js' ? '.js' : '.mjs';
    const destinationPath = path.join(publicDir, `pdf.worker.min${destinationExt}`);

    await copyFile(sourcePath, destinationPath);

    console.log(`[pdfjs-worker] Copied ${sourcePath} -> ${destinationPath}`);
}

main().catch((error) => {
    console.error('[pdfjs-worker] Failed to copy worker:', error);
    process.exit(1);
});
