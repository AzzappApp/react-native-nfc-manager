const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const glob = require('fast-glob');

const repoRoot = path.resolve(__dirname, '../../..');
const packagesDir = path.join(repoRoot, 'packages');

function getLocalDependencies(packagePath, visited = new Set()) {
  const pkgJsonPath = path.join(packagePath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return [];

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const deps = Object.assign({}, pkgJson.dependencies, pkgJson.devDependencies);
  const localDeps = [];

  // eslint-disable-next-line guard-for-in
  for (const depName in deps) {
    const depVersion = deps[depName];
    if (depVersion.startsWith('workspace:')) {
      const depPath = path.join(packagesDir, depName);
      if (fs.existsSync(depPath) && !visited.has(depName)) {
        visited.add(depName);
        localDeps.push(depPath);
        // Recurse
        localDeps.push(...getLocalDependencies(depPath, visited));
      }
    }
  }

  return localDeps;
}

function extractEnvKeysFromFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  const keys = [];

  traverse(ast, {
    ObjectExpression(path) {
      const parent = path.parent;
      if (
        t.isCallExpression(parent) &&
        t.isMemberExpression(parent.callee) &&
        t.isIdentifier(parent.callee.object, { name: 'z' }) &&
        t.isIdentifier(parent.callee.property, { name: 'object' })
      ) {
        for (const prop of path.node.properties) {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            keys.push(prop.key.name);
          }
        }
      }
    },
  });

  return keys;
}

async function listEnvVarsForApp(appName) {
  const appPath = path.join(packagesDir, appName);
  if (!fs.existsSync(appPath)) {
    console.error(`❌ App "${appName}" not found in packages/`);
    process.exit(1);
  }

  const allPaths = [appPath, ...getLocalDependencies(appPath)];
  const results = {};

  for (const dir of allPaths) {
    const envFiles = await glob(['env.@(ts|js)'], {
      cwd: dir,
      absolute: true,
    });

    for (const file of envFiles) {
      const keys = extractEnvKeysFromFile(file);
      const relPath = path.relative(repoRoot, file);
      keys.forEach(key => {
        if (!results[key]) results[key] = [];
        results[key].push(relPath);
      });
    }
  }

  console.log(
    `🧪 Variables d’environnement utilisées par "${appName}" et ses dépendances :\n`,
  );
  const sorted = Object.entries(results).sort(([a], [b]) => a.localeCompare(b));
  for (const [key, locations] of sorted) {
    console.log(`- ${key}`);
    locations.forEach(loc => console.log(`   ↳ ${loc}`));
  }
}

// ────────────── Start ──────────────

const appName = process.argv[2];
if (!appName) {
  console.error(
    '❌ Veuillez spécifier le nom de l’app (ex: node scripts/list-env-vars.js app-web)',
  );
  process.exit(1);
}

listEnvVarsForApp(appName);
