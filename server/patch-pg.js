import fs from 'fs';
import path from 'path';

const targetFile = path.resolve('node_modules/@embedded-postgres/windows-x64/dist/index.js');
if (fs.existsSync(targetFile)) {
  const content = fs.readFileSync(targetFile, 'utf8');
  if (!content.includes('toShortPath')) {
    const patched = `import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

function toShortPath(p) {
  try {
    return execSync(\`cmd.exe /c for %I in ("\${p}") do @echo %~sI\`).toString().trim();
  } catch {
    return p;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const pg_ctl = toShortPath(path.resolve(__dirname, '..', 'native', 'bin', 'pg_ctl.exe'));
export const initdb = toShortPath(path.resolve(__dirname, '..', 'native', 'bin', 'initdb.exe'));
export const postgres = toShortPath(path.resolve(__dirname, '..', 'native', 'bin', 'postgres.exe'));
`;
    fs.writeFileSync(targetFile, patched, 'utf8');
    console.log('Patched @embedded-postgres/windows-x64 for Windows path compatibility.');
  }
}
