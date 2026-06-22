#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (err) {
  console.error('Failed to read input:', err.message);
  process.exit(1);
}

const { fileNodes = [], importEdges = [], allEdges = [] } = input;
const nodeById = new Map(fileNodes.map((n) => [n.id, n]));

// --- Directory pattern tables ---
const DIR_PATTERNS = {
  routes: 'api', api: 'api', controllers: 'api', endpoints: 'api', handlers: 'api',
  services: 'service', core: 'service', lib: 'service', domain: 'service', logic: 'service',
  models: 'data', db: 'data', data: 'data', persistence: 'data', repository: 'data', entities: 'data',
  components: 'ui', views: 'ui', pages: 'ui', ui: 'ui', layouts: 'ui', screens: 'ui',
  middleware: 'middleware', plugins: 'middleware', interceptors: 'middleware', guards: 'middleware',
  utils: 'utility', helpers: 'utility', common: 'utility', shared: 'utility', tools: 'utility',
  config: 'config', constants: 'config', env: 'config', settings: 'config',
  __tests__: 'test', test: 'test', tests: 'test', spec: 'test', specs: 'test',
  types: 'types', interfaces: 'types', schemas: 'types', contracts: 'types', dtos: 'types',
  hooks: 'hooks',
  store: 'state', state: 'state', reducers: 'state', actions: 'state', slices: 'state',
  assets: 'assets', static: 'assets', public: 'assets',
  migrations: 'data',
  management: 'config', commands: 'config',
  templatetags: 'utility',
  signals: 'service',
  serializers: 'api',
  cmd: 'entry',
  internal: 'service',
  pkg: 'utility',
  dto: 'types', request: 'types', response: 'types',
  entity: 'data',
  controller: 'api',
  routers: 'api',
  composables: 'service',
  blueprints: 'api',
  mailers: 'service', jobs: 'service', channels: 'service',
  bin: 'entry',
  docs: 'documentation', documentation: 'documentation', wiki: 'documentation',
  deploy: 'infrastructure', deployment: 'infrastructure', infra: 'infrastructure', infrastructure: 'infrastructure',
  '.github': 'ci-cd', '.gitlab': 'ci-cd', '.circleci': 'ci-cd',
  k8s: 'infrastructure', kubernetes: 'infrastructure', helm: 'infrastructure', charts: 'infrastructure',
  terraform: 'infrastructure', tf: 'infrastructure',
  docker: 'infrastructure',
  sql: 'data', database: 'data', schema: 'data',
  plugin: 'assets',
  media: 'assets',
  src: 'service',
};

function classifyFilePattern(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (/\.(test|spec)\./.test(base) || /^test_/.test(base) || /_test\.(go|py|rb)$/.test(base) ||
      /Test\.(java|cs)$/.test(base) || /_spec\.rb$/.test(base) || /Tests\.cs$/.test(base)) {
    return 'test';
  }
  if (ext === '.d.ts') return 'types';
  if (base === 'index.html' || base === 'index.ts' || base === 'index.js' || base === '__init__.py') return 'entry';
  if (base === 'manage.py') return 'entry';
  if (base === 'wsgi.py' || base === 'asgi.py') return 'config';
  if (/^main\.go$/.test(base) && filePath.includes('cmd/')) return 'entry';
  if ((base === 'main.rs' || base === 'lib.rs') && filePath.startsWith('src/')) return 'entry';
  if (base === 'Application.java' || base === 'Program.cs') return 'entry';
  if (base === 'config.ru') return 'entry';
  if (['Cargo.toml', 'go.mod', 'Gemfile', 'pom.xml', 'build.gradle', 'composer.json'].includes(base)) return 'config';
  if (base === 'Dockerfile' || /^docker-compose/.test(base)) return 'infrastructure';
  if (ext === '.tf' || ext === '.tfvars') return 'infrastructure';
  if (filePath.includes('.github/workflows/') || base === '.gitlab-ci.yml' || base === 'Jenkinsfile') return 'ci-cd';
  if (ext === '.sql') return 'data';
  if (['.graphql', '.gql', '.proto'].includes(ext)) return 'types';
  if (['.md', '.rst'].includes(ext)) return 'documentation';
  if (base === 'Makefile') return 'infrastructure';
  if (ext === '.css') return 'ui';
  if (ext === '.js' && (filePath.includes('jquery') || filePath.includes('html2canvas'))) return 'utility';
  if (ext === '.otf' || ext === '.webp' || ext === '.png' || ext === '.jpg' || ext === '.svg') return 'assets';
  return null;
}

// --- A. Directory Grouping ---
function computeCommonPrefix(paths) {
  if (paths.length === 0) return '';
  const splitPaths = paths.map((p) => p.split('/'));
  const minLen = Math.min(...splitPaths.map((s) => s.length));
  const prefix = [];
  for (let i = 0; i < minLen; i++) {
    const seg = splitPaths[0][i];
    if (splitPaths.every((s) => s[i] === seg)) prefix.push(seg);
    else break;
  }
  if (prefix.length === 0) return '';
  return prefix.join('/') + (prefix.length > 0 ? '/' : '');
}

function getDirectoryGroup(filePath) {
  const parts = filePath.split('/');
  if (parts.length === 1) return 'root';
  return parts[0];
}

const filePaths = fileNodes.map((n) => n.filePath);
const commonPrefix = computeCommonPrefix(filePaths);

const directoryGroups = {};
for (const node of fileNodes) {
  let group;
  const rel = commonPrefix && node.filePath.startsWith(commonPrefix)
    ? node.filePath.slice(commonPrefix.length)
    : node.filePath;
  const relParts = rel.split('/').filter(Boolean);
  if (relParts.length <= 1 && !node.filePath.includes('/')) {
    group = 'root';
  } else if (relParts.length <= 1) {
    group = relParts[0] || 'root';
  } else {
    group = relParts[0];
  }
  if (!directoryGroups[group]) directoryGroups[group] = [];
  directoryGroups[group].push(node.id);
}

// Flat structure fallback: if only root group with many files, regroup by extension pattern
if (Object.keys(directoryGroups).length === 1 && directoryGroups.root && directoryGroups.root.length > 3) {
  const regrouped = {};
  for (const node of fileNodes) {
    const fp = node.filePath;
    let group = 'root';
    if (/\.(test|spec)\./.test(fp)) group = 'test';
    else if (/\.config\./.test(fp) || fp.endsWith('.json')) group = 'config';
    else if (fp.endsWith('.md')) group = 'documentation';
    else group = path.extname(fp).slice(1) || 'root';
    if (!regrouped[group]) regrouped[group] = [];
    regrouped[group].push(node.id);
  }
  Object.assign(directoryGroups, regrouped);
  delete directoryGroups.root;
}

// --- B. Node Type Grouping ---
const nodeTypeGroups = {};
for (const node of fileNodes) {
  const t = node.type || 'file';
  if (!nodeTypeGroups[t]) nodeTypeGroups[t] = [];
  nodeTypeGroups[t].push(node.id);
}

// --- C. Import Adjacency ---
const fileIds = new Set(fileNodes.map((n) => n.id));
const adjacency = {};
for (const id of fileIds) adjacency[id] = new Set();

for (const edge of importEdges) {
  if (fileIds.has(edge.source) && fileIds.has(edge.target)) {
    adjacency[edge.source].add(edge.target);
  }
}

const fileFanOut = {};
const fileFanIn = {};
for (const id of fileIds) {
  fileFanOut[id] = adjacency[id] ? adjacency[id].size : 0;
  fileFanIn[id] = 0;
}
for (const [src, targets] of Object.entries(adjacency)) {
  for (const tgt of targets) {
    fileFanIn[tgt] = (fileFanIn[tgt] || 0) + 1;
  }
}

function nodeToGroup(nodeId) {
  const node = nodeById.get(nodeId);
  if (!node) return null;
  const rel = commonPrefix && node.filePath.startsWith(commonPrefix)
    ? node.filePath.slice(commonPrefix.length)
    : node.filePath;
  const relParts = rel.split('/').filter(Boolean);
  if (relParts.length <= 1 && !node.filePath.includes('/')) return 'root';
  if (relParts.length <= 1) return relParts[0] || 'root';
  return relParts[0];
}

const groupImports = {};
const groupImportedBy = {};
for (const g of Object.keys(directoryGroups)) {
  groupImports[g] = {};
  groupImportedBy[g] = {};
}

for (const edge of importEdges) {
  if (!fileIds.has(edge.source) || !fileIds.has(edge.target)) continue;
  const fromG = nodeToGroup(edge.source);
  const toG = nodeToGroup(edge.target);
  if (!fromG || !toG) continue;
  groupImports[fromG][toG] = (groupImports[fromG][toG] || 0) + 1;
  groupImportedBy[toG][fromG] = (groupImportedBy[toG][fromG] || 0) + 1;
}

const interGroupImports = [];
for (const [from, targets] of Object.entries(groupImports)) {
  for (const [to, count] of Object.entries(targets)) {
    if (from !== to) interGroupImports.push({ from, to, count });
  }
}

// --- D. Cross-Category Dependency Analysis ---
const crossCategoryMap = {};
for (const edge of allEdges) {
  const srcNode = nodeById.get(edge.source);
  const tgtNode = nodeById.get(edge.target);
  if (!srcNode || !tgtNode) continue;
  const key = `${srcNode.type}|${tgtNode.type}|${edge.type}`;
  crossCategoryMap[key] = (crossCategoryMap[key] || 0) + 1;
}

const crossCategoryEdges = Object.entries(crossCategoryMap).map(([key, count]) => {
  const [fromType, toType, edgeType] = key.split('|');
  return { fromType, toType, edgeType, count };
});

// --- F. Intra-Group Import Density ---
const intraGroupDensity = {};
for (const group of Object.keys(directoryGroups)) {
  let internalEdges = 0;
  let totalEdges = 0;
  for (const edge of importEdges) {
    if (!fileIds.has(edge.source) || !fileIds.has(edge.target)) continue;
    const fromG = nodeToGroup(edge.source);
    const toG = nodeToGroup(edge.target);
    if (fromG === group || toG === group) {
      totalEdges++;
      if (fromG === group && toG === group) internalEdges++;
    }
  }
  intraGroupDensity[group] = {
    internalEdges,
    totalEdges,
    density: totalEdges > 0 ? internalEdges / totalEdges : 0,
  };
}

// --- G. Directory Pattern Matching ---
const patternMatches = {};
for (const group of Object.keys(directoryGroups)) {
  if (DIR_PATTERNS[group]) {
    patternMatches[group] = DIR_PATTERNS[group];
    continue;
  }
  const sampleNode = nodeById.get(directoryGroups[group][0]);
  if (sampleNode) {
    const fp = classifyFilePattern(sampleNode.filePath);
    if (fp) patternMatches[group] = fp;
  }
}

// --- H. Deployment Topology ---
const infraPatterns = [
  /^Dockerfile$/i,
  /^docker-compose/i,
  /\.tf$/,
  /\.tfvars$/,
  /^Makefile$/,
  /k8s\//,
  /kubernetes\//,
  /helm\//,
  /charts\//,
  /\.github\/workflows\//,
  /^\.gitlab-ci\.yml$/,
  /^Jenkinsfile$/,
];
const infraFiles = fileNodes
  .filter((n) => infraPatterns.some((p) => p.test(n.filePath) || p.test(n.name)))
  .map((n) => n.filePath);

const deploymentTopology = {
  hasDockerfile: fileNodes.some((n) => n.name === 'Dockerfile'),
  hasCompose: fileNodes.some((n) => /^docker-compose/.test(n.name)),
  hasK8s: fileNodes.some((n) => /k8s|kubernetes|helm|charts/.test(n.filePath)),
  hasTerraform: fileNodes.some((n) => /\.tf$|\.tfvars$/.test(n.filePath)),
  hasCI: fileNodes.some((n) => /\.github\/workflows\//.test(n.filePath) || n.name === '.gitlab-ci.yml' || n.name === 'Jenkinsfile'),
  infraFiles,
};

// --- I. Data Pipeline Detection ---
const schemaFiles = fileNodes.filter((n) => /\.(sql|graphql|gql|proto|prisma)$/.test(n.filePath)).map((n) => n.filePath);
const migrationFiles = fileNodes.filter((n) => /migrations?\//.test(n.filePath) && /\.sql$/.test(n.filePath)).map((n) => n.filePath);
const dataModelFiles = fileNodes.filter((n) => /models?\//.test(n.filePath) || n.type === 'table' || n.type === 'schema').map((n) => n.filePath);
const apiHandlerFiles = fileNodes.filter((n) => /routes?|api|controllers?|handlers?|endpoints?/.test(n.filePath)).map((n) => n.filePath);

const dataPipeline = { schemaFiles, migrationFiles, dataModelFiles, apiHandlerFiles };

// --- J. Documentation Coverage ---
const docGroups = new Set();
for (const node of fileNodes) {
  if (node.type === 'document' || node.filePath.endsWith('.md')) {
    const g = nodeToGroup(node.id);
    if (g) docGroups.add(g);
  }
  const dir = path.dirname(node.filePath);
  const readmePath = path.join(dir, 'README.md');
  if (fileNodes.some((n) => n.filePath === readmePath)) {
    const g = nodeToGroup(node.id);
    if (g) docGroups.add(g);
  }
}

const totalGroups = Object.keys(directoryGroups).length;
const docCoverage = {
  groupsWithDocs: docGroups.size,
  totalGroups,
  coverageRatio: totalGroups > 0 ? docGroups.size / totalGroups : 0,
  undocumentedGroups: Object.keys(directoryGroups).filter((g) => !docGroups.has(g)),
};

// --- K. Dependency Direction ---
const dependencyDirection = [];
const seenPairs = new Set();
for (const { from, to, count } of interGroupImports) {
  const reverse = interGroupImports.find((e) => e.from === to && e.to === from);
  const reverseCount = reverse ? reverse.count : 0;
  const pairKey = [from, to].sort().join('->');
  if (seenPairs.has(pairKey)) continue;
  seenPairs.add(pairKey);
  if (count > reverseCount) {
    dependencyDirection.push({ dependent: from, dependsOn: to });
  } else if (reverseCount > count) {
    dependencyDirection.push({ dependent: to, dependsOn: from });
  }
}

const filesPerGroup = {};
for (const [g, ids] of Object.entries(directoryGroups)) {
  filesPerGroup[g] = ids.length;
}

const nodeTypeCounts = {};
for (const [t, ids] of Object.entries(nodeTypeGroups)) {
  nodeTypeCounts[t] = ids.length;
}

const result = {
  scriptCompleted: true,
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats: {
    totalFileNodes: fileNodes.length,
    filesPerGroup,
    nodeTypeCounts,
  },
  fileFanIn,
  fileFanOut,
};

try {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Failed to write output:', err.message);
  process.exit(1);
}
