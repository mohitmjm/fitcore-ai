import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function loadTypeScriptModule(path, injectedRequire = require) {
  const source = fs.readFileSync(path, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(output, { module: loadedModule, exports: loadedModule.exports, require: injectedRequire });
  return loadedModule.exports;
}

const catalog = loadTypeScriptModule('lib/exercises/catalog.ts');
const source = fs.readFileSync('lib/exercises/animations.ts', 'utf8');
const mappedSlugs = new Set([...source.matchAll(/^\s{2}'([^']+)': \{/gm)].map((match) => match[1]));
const issues = [];

for (const exercise of catalog.EXERCISES) {
  if (!mappedSlugs.has(exercise.slug)) issues.push(`${exercise.slug}: missing animation definition`);
  if (!exercise.primaryMuscles?.length) issues.push(`${exercise.slug}: missing primary muscles`);
  if (!exercise.instructions?.length) issues.push(`${exercise.slug}: missing technique instructions`);
}

if (issues.length) {
  console.error(`Exercise animation validation failed (${issues.length} issue${issues.length === 1 ? '' : 's'}):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Exercise animation validation passed: ${catalog.EXERCISES.length}/${catalog.EXERCISES.length} exercises mapped.`);
}
