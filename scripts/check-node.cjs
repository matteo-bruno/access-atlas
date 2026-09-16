// Preflight for the Node scripts.
//
// Everything under scripts/ is an ES module (.mjs). Node below 12 does not
// know that extension and parses the file as CommonJS, so the first `import`
// line fails with a bare `SyntaxError: Unexpected identifier` that says
// nothing about the real cause. This file is deliberately CommonJS, and
// deliberately free of modern syntax, so it parses and runs on any Node old
// enough to be the problem — and can therefore explain itself.
//
// It also checks the packages a script imports are on disk. Node's own answer
// to a missing one is `ERR_MODULE_NOT_FOUND: Cannot find package 'h3-js'`,
// which names the package but not the reason: every package the scripts
// import is a devDependency, so a tree installed with `--omit=dev` does not
// have it, and neither does one installed before the dependency was added.
// Each npm script names what it needs:
//
//     node scripts/check-node.cjs h3-js && node scripts/build-data.mjs
//
// A name package.json does not declare, playwright, which the browser suites
// install on the fly, is reported as such, with the line that installs it.

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var MINIMUM = 20;
var current = parseInt(process.versions.node.split('.')[0], 10);

if (!(current >= MINIMUM)) {
  process.stderr.write(
    '\n  This repository needs Node ' +
      MINIMUM +
      ' or newer — you are running ' +
      process.version +
      '.\n\n' +
      '  The scripts are ES modules and the build targets the same version CI\n' +
      '  uses (Node 22). With nvm:\n\n' +
      '      nvm install 22 && nvm use 22\n\n',
  );
  process.exit(1);
}

// Resolution walks up from the repo, the way Node's own does, so a checkout
// nested inside another install is still seen as installed.
function isInstalled(name) {
  var dir = ROOT;
  for (;;) {
    if (fs.existsSync(path.join(dir, 'node_modules', name, 'package.json'))) return true;
    var up = path.dirname(dir);
    if (up === dir) return false;
    dir = up;
  }
}

function isDeclared(name) {
  var pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  } catch (err) {
    return false;
  }
  return Boolean(
    (pkg.dependencies && pkg.dependencies[name]) ||
      (pkg.devDependencies && pkg.devDependencies[name]),
  );
}

var required = process.argv.slice(2);
var missing = [];
var i;
for (i = 0; i < required.length; i += 1) {
  if (!isInstalled(required[i])) missing.push(required[i]);
}

if (missing.length) {
  var declared = [];
  var undeclared = [];
  for (i = 0; i < missing.length; i += 1) {
    (isDeclared(missing[i]) ? declared : undeclared).push(missing[i]);
  }

  var out =
    '\n  This script needs ' +
    missing.join(', ') +
    ', which ' +
    (missing.length === 1 ? 'is' : 'are') +
    ' not installed.\n\n';

  if (declared.length) {
    out +=
      '  package.json declares them, so an install brings them in. The ones the\n' +
      '  scripts import are devDependencies, which an install made with\n' +
      '  --omit=dev, or under NODE_ENV=production, leaves out. So does one made\n' +
      '  before the dependency was added:\n\n' +
      '      npm install\n\n';
  }

  if (undeclared.length) {
    var browser = undeclared.indexOf('playwright') !== -1;
    out +=
      (browser
        ? '  Playwright is deliberately not a project dependency. Only the browser\n' +
          '  suites and the preview shots need one:\n\n'
        : '  package.json does not declare it. Install it for this run:\n\n') +
      '      npm install --no-save ' +
      undeclared.join(' ') +
      (browser ? ' && npx playwright install chromium' : '') +
      '\n\n';
  }

  process.stderr.write(out);
  process.exit(1);
}
