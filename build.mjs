/* Builds the sub-pages from index.html.

   index.html is the only place the shell lives — navigation, footer, bag and
   scripts. Each file in content/ supplies one page's <main>. Run after editing
   index.html, botanical.css, shop.js or anything in content/:

     node build.mjs

   Writes shop.html, commitment.html, professionals.html and journal.html. */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const shell = await readFile(join(here, 'index.html'), 'utf8');

const mainStart = shell.indexOf('<main id="top">');
const mainEnd = shell.indexOf('</main>');
if (mainStart < 0 || mainEnd < 0) throw new Error('index.html has no <main id="top"> … </main>');

const meta = (source, name) => (source.match(new RegExp('<!--' + name + ':\\s*([\\s\\S]*?)-->')) || [])[1]?.trim();

const slice = (html, open, close) => html.slice(html.indexOf(open), html.indexOf(close) + close.length);

const files = (await readdir(join(here, 'content'))).filter(f => f.endsWith('.html')).sort();
const built = [];

for (const file of files) {
  const source = await readFile(join(here, 'content', file), 'utf8');
  const title = meta(source, 'title');
  const description = meta(source, 'desc');
  const nav = meta(source, 'nav');
  if (!title || !description || !nav) throw new Error(file + ' is missing a title, desc or nav comment');

  const body = source.replace(/<!--(title|desc|nav):[\s\S]*?-->\s*/g, '');

  let page = shell.slice(0, mainStart) + '<main id="top">\n' + body + '\n' + shell.slice(mainEnd);
  page = page
    .replace(/<title>[\s\S]*?<\/title>/, '<title>' + title + '</title>')
    .replace(/(<meta name="description" content=")[\s\S]*?(">)/, '$1' + description + '$2');

  /* mark the open page — inside the navigation only, never in the footer */
  const navBlock = slice(page, '<nav class="nav">', '</nav>');
  page = page.replace(navBlock, navBlock.replace(
    new RegExp('(<a href="' + nav + '"(?![^>]*navbtn)[^>]*)(>)', 'g'), '$1 aria-current="page"$2'));

  await writeFile(join(here, file), page);
  built.push(file);
}

/* the shell must not drift: every page carries the same navigation and footer */
const navOf = html => slice(html, '<nav class="nav">', '</nav>').replace(/ aria-current="page"/g, '');
const footOf = html => slice(html, '<footer>', '</footer>');
for (const file of built) {
  const page = await readFile(join(here, file), 'utf8');
  if (navOf(page) !== navOf(shell)) throw new Error(file + ': navigation drifted from index.html');
  if (footOf(page) !== footOf(shell)) throw new Error(file + ': footer drifted from index.html');
}

console.log('built', built.length, 'pages from index.html —', built.join(', '));
