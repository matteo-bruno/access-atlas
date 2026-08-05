// Preflight for the Node scripts.
//
// Everything under scripts/ is an ES module (.mjs). Node below 12 does not
// know that extension and parses the file as CommonJS, so the first `import`
// line fails with a bare `SyntaxError: Unexpected identifier` that says
// nothing about the real cause. This file is deliberately CommonJS, and
// deliberately free of modern syntax, so it parses and runs on any Node old
// enough to be the problem — and can therefore explain itself.

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
