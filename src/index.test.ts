import * as fs from 'fs';
import * as path from 'path';
import ava from 'ava';

ava('check index', async (t) => {
    const actual = (await fs.promises.readFile(path.join(__dirname, 'index.ts'), 'utf8'))
    .split('\n')
    .filter((line) => line.startsWith('export'))
    .join('\n');
    const expected = (await fs.promises.readdir(__dirname))
    .filter((name) => !name.includes('.test.') && name !== 'index.ts')
    .map((name) => `export * from './${path.basename(name, path.extname(name))}';`)
    .join('\n');
    t.is(actual, expected);
});
