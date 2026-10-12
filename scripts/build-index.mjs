#!/usr/bin/env node
// Writes index.json from skills/<key>/SKILL.md: every skill checked against the rules the Mighty console holds a
// market skill to, with the file's exact size and SHA-256.
//   node scripts/build-index.mjs           write index.json
//   node scripts/build-index.mjs --check   fail when index.json is not what the skills make (CI)
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_BASE = 'https://raw.githubusercontent.com/mighty-hq/skills-market/main';
const KEY = /^[a-z][a-z0-9-]{1,39}$/;
const BUILT_IN_KEYS = new Set(['mighty-console', 'tasks', 'acceptance', 'on-a-pc']);
const MAX = { body: 12_000, bytes: 65_536, description: 240, name: 80, skills: 500 };

let failed = false;
const fail = (message) => {
  console.error(`✗ ${message}`);
  failed = true;
};

/** The file's bytes, its frontmatter's one-line fields and its body, as the console reads them. */
const readSkill = (key) => {
  const buffer = fs.readFileSync(path.join(ROOT, 'skills', key, 'SKILL.md'));
  const text = buffer.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(buffer)) {
    fail(`${key}: SKILL.md is not UTF-8`);
  }
  if (text.includes('\r')) {
    fail(`${key}: SKILL.md has CRLF line endings; this repository keeps LF`);
  }
  const lines = text.replace(/^﻿/, '').split('\n');
  const end = lines[0]?.trim() === '---' ? lines.findIndex((line, at) => at > 0 && line.trim() === '---') : -1;
  if (end === -1) {
    fail(`${key}: SKILL.md opens with no frontmatter (--- name, description ---)`);
    return null;
  }
  const fields = {};
  for (const line of lines.slice(1, end)) {
    const field = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!field) {
      continue;
    }
    let value = field[2].trim();
    if (/^[>|]/.test(value)) {
      fail(`${key}: write ${field[1]} on one line`);
      continue;
    }
    if (/^(".*"|'.*')$/.test(value)) {
      value = value.slice(1, -1);
    }
    fields[field[1]] = value;
  }
  const body = lines
    .slice(end + 1)
    .join('\n')
    .replace(/^(\s*\n)+/, '')
    .trimEnd();
  return { body, buffer, fields };
};

const keys = fs
  .readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const skills = [];
for (const key of keys) {
  if (!KEY.test(key)) {
    fail(`${key}: a key is 2 to 40 lower-case letters, digits and hyphens, a letter first`);
    continue;
  }
  if (BUILT_IN_KEYS.has(key)) {
    fail(`${key}: the key of a skill every console already ships`);
    continue;
  }
  const skill = readSkill(key);
  if (skill === null) {
    continue;
  }
  const { description, name } = skill.fields;
  if (!name) fail(`${key}: the frontmatter names no name`);
  if (!description) fail(`${key}: the frontmatter names no description`);
  if (name && name.length > MAX.name) fail(`${key}: the name runs past ${MAX.name} characters`);
  if (description && description.length > MAX.description) {
    fail(`${key}: the description runs past ${MAX.description} characters (${description.length})`);
  }
  if (skill.body === '') fail(`${key}: no instructions under the frontmatter`);
  if (skill.body.length > MAX.body) fail(`${key}: the instructions run past ${MAX.body} characters`);
  if (skill.buffer.length > MAX.bytes) fail(`${key}: the file runs past ${MAX.bytes} bytes`);
  skills.push({
    key,
    name,
    description,
    url: `${RAW_BASE}/skills/${key}/SKILL.md`,
    bytes: skill.buffer.length,
    sha256: createHash('sha256').update(skill.buffer).digest('hex'),
  });
}
if (skills.length > MAX.skills) {
  fail(`the index may list at most ${MAX.skills} skills`);
}
if (failed) {
  process.exit(1);
}

const json = `${JSON.stringify({ version: 1, skills }, null, 2)}\n`;
const target = path.join(ROOT, 'index.json');
if (process.argv.includes('--check')) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (current !== json) {
    fail('index.json is not what the skills make: run node scripts/build-index.mjs and commit it');
    process.exit(1);
  }
  console.log(`✓ index.json matches its ${skills.length} skill(s)`);
} else {
  fs.writeFileSync(target, json);
  console.log(`✓ index.json written: ${skills.length} skill(s)`);
}
