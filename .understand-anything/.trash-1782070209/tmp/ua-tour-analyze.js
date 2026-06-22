#!/usr/bin/env node
'use strict';

const fs = require('fs');

const ENTRY_PATTERNS = [
  /^index\.(ts|js|html|php)$/,
  /^main\.(ts|js|go|py|rs|c|cpp)$/,
  /^app\.(ts|js|py)$/,
  /^server\.(ts|js)$/,
  /^mod\.rs$/,
  /^manage\.py$/,
  /^wsgi\.py$/,
  /^asgi\.py$/,
  /^run\.py$/,
  /^__main__\.py$/,
  /^Application\.java$/,
  /^Main\.java$/,
  /^Program\.cs$/,
  /^config\.ru$/,
  /^App\.swift$/,
  /^Application\.kt$/,
];

function isCodeFile(node) {
  return node.type === 'file';
}

function isDocFile(node) {
  return node.type === 'document';
}

function depthFromRoot(filePath) {
  if (!filePath) return 99;
  const parts = filePath.split('/').filter(Boolean);
  return parts.length <= 1 ? 0 : parts.length <= 2 ? 1 : 2;
}

function matchesEntryFilename(name) {
  return ENTRY_PATTERNS.some((re) => re.test(name));
}

function loadInput(path) {
  const raw = fs.readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

function buildAdjacency(edges, edgeTypes) {
  const adj = new Map();
  const typeSet = new Set(edgeTypes);
  for (const edge of edges) {
    if (!typeSet.has(edge.type)) continue;
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source).push(edge.target);
  }
  return adj;
}

function countFanIn(edges) {
  const fanIn = new Map();
  for (const edge of edges) {
    fanIn.set(edge.target, (fanIn.get(edge.target) || 0) + 1);
  }
  return fanIn;
}

function countFanOut(edges) {
  const fanOut = new Map();
  for (const edge of edges) {
    fanOut.set(edge.source, (fanOut.get(edge.source) || 0) + 1);
  }
  return fanOut;
}

function topN(map, nodesById, n, key) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([id, count]) => ({
      id,
      [key]: count,
      name: nodesById.get(id)?.name || id,
    }));
}

function scoreEntryPoints(nodes, fanIn, fanOut) {
  const fanOutValues = [...fanOut.values()].sort((a, b) => b - a);
  const fanInValues = [...fanIn.values()].sort((a, b) => a - b);
  const top10FanOutThreshold =
    fanOutValues[Math.floor(fanOutValues.length * 0.1)] || 0;
  const bottom25FanInThreshold =
    fanInValues[Math.floor(fanInValues.length * 0.25)] || 0;

  const scores = [];

  for (const node of nodes) {
    let score = 0;

    if (isDocFile(node)) {
      if (node.filePath === 'README.md' || node.name === 'README.md') {
        score += 5;
      } else if (
        node.filePath &&
        !node.filePath.includes('/') &&
        node.name.endsWith('.md')
      ) {
        score += 2;
      }
      if (score > 0) {
        scores.push({ id: node.id, score, name: node.name, summary: node.summary || '' });
      }
      continue;
    }

    if (!isCodeFile(node)) continue;

    if (matchesEntryFilename(node.name)) score += 3;
    if (depthFromRoot(node.filePath) <= 1) score += 1;

    const fo = fanOut.get(node.id) || 0;
    const fi = fanIn.get(node.id) || 0;
    if (fo >= top10FanOutThreshold && fo > 0) score += 1;
    if (fi <= bottom25FanInThreshold) score += 1;

    if (score > 0) {
      scores.push({ id: node.id, score, name: node.name, summary: node.summary || '' });
    }
  }

  return scores.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 5);
}

function bfsFromEntry(startId, edges) {
  const traverseTypes = new Set(['imports', 'calls', 'depends_on']);
  const adj = buildAdjacency(edges, [...traverseTypes]);

  const order = [];
  const depthMap = {};
  const visited = new Set();
  const queue = [{ id: startId, depth: 0 }];

  while (queue.length) {
    const { id, depth } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    order.push(id);
    depthMap[id] = depth;

    const neighbors = adj.get(id) || [];
    for (const target of neighbors) {
      if (!visited.has(target)) {
        queue.push({ id: target, depth: depth + 1 });
      }
    }
  }

  const byDepth = {};
  for (const [id, depth] of Object.entries(depthMap)) {
    const key = String(depth);
    if (!byDepth[key]) byDepth[key] = [];
    byDepth[key].push(id);
  }

  return { startNode: startId, order, depthMap, byDepth };
}

function categorizeNonCode(nodes) {
  const result = {
    documentation: [],
    infrastructure: [],
    data: [],
    config: [],
  };

  for (const node of nodes) {
    const entry = {
      id: node.id,
      name: node.name,
      type: node.type,
      summary: node.summary || '',
    };

    switch (node.type) {
      case 'document':
        result.documentation.push(entry);
        break;
      case 'service':
      case 'pipeline':
      case 'resource':
        if (node.type === 'resource') {
          result.infrastructure.push(entry);
        } else {
          result.infrastructure.push(entry);
        }
        break;
      case 'table':
      case 'schema':
      case 'endpoint':
        result.data.push(entry);
        break;
      case 'config':
        result.config.push(entry);
        break;
      default:
        break;
    }
  }

  return result;
}

function findClusters(nodes, edges) {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const forward = new Map();
  const backward = new Map();

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    if (!forward.has(edge.source)) forward.set(edge.source, new Set());
    if (!backward.has(edge.target)) backward.set(edge.target, new Set());
    forward.get(edge.source).add(edge.target);
    backward.get(edge.target).add(edge.source);
  }

  const bidirectionalPairs = [];
  for (const edge of edges) {
    const rev =
      backward.get(edge.source)?.has(edge.target) &&
      forward.get(edge.target)?.has(edge.source);
    if (rev) {
      bidirectionalPairs.push([edge.source, edge.target]);
    }
  }

  const parent = new Map();
  function find(x) {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
    return parent.get(x);
  }
  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  }

  for (const [a, b] of bidirectionalPairs) {
    union(a, b);
  }

  const clustersMap = new Map();
  for (const [a, b] of bidirectionalPairs) {
    const root = find(a);
    if (!clustersMap.has(root)) clustersMap.set(root, new Set());
    clustersMap.get(root).add(a);
    clustersMap.get(root).add(b);
  }

  // Expand clusters: nodes connected to 2+ members
  for (const edge of edges) {
    for (const [, members] of clustersMap) {
      const memberHits = [...members].filter(
        (m) => edge.source === m || edge.target === m
      ).length;
      if (memberHits >= 1) {
        members.add(edge.source);
        members.add(edge.target);
      }
    }
  }

  const edgeTypeCounts = (memberList) => {
    const set = new Set(memberList);
    let count = 0;
    for (const edge of edges) {
      if (set.has(edge.source) && set.has(edge.target)) count++;
    }
    return count;
  };

  const clusters = [...clustersMap.values()]
    .map((s) => [...s])
    .filter((list) => list.length >= 2 && list.length <= 5)
    .map((list) => ({ nodes: list.sort(), edgeCount: edgeTypeCounts(list) }))
    .sort((a, b) => b.edgeCount - a.edgeCount || b.nodes.length - a.nodes.length)
    .slice(0, 10);

  return clusters;
}

function buildNodeSummaryIndex(nodes) {
  const index = {};
  for (const node of nodes) {
    index[node.id] = {
      name: node.name,
      type: node.type,
      summary: node.summary || '',
    };
  }
  return index;
}

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error('Usage: node ua-tour-analyze.js <input.json> <output.json>');
    process.exit(1);
  }

  const { nodes, edges, layers = [] } = loadInput(inputPath);
  const nodesById = new Map(nodes.map((n) => [n.id, n]));

  const fanInMap = countFanIn(edges);
  const fanOutMap = countFanOut(edges);

  const fanInRanking = topN(fanInMap, nodesById, 20, 'fanIn');
  const fanOutRanking = topN(fanOutMap, nodesById, 20, 'fanOut');

  const entryPointCandidates = scoreEntryPoints(nodes, fanInMap, fanOutMap);

  const codeEntry = entryPointCandidates.find((c) => c.id.startsWith('file:'));
  const bfsStart = codeEntry ? codeEntry.id : entryPointCandidates[0]?.id;
  const bfsTraversal = bfsStart
    ? bfsFromEntry(bfsStart, edges)
    : { startNode: null, order: [], depthMap: {}, byDepth: {} };

  const nonCodeFiles = categorizeNonCode(nodes);

  const result = {
    scriptCompleted: true,
    entryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal,
    nonCodeFiles,
    clusters: findClusters(nodes, edges),
    layers: {
      count: layers.length,
      list: layers.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
      })),
    },
    nodeSummaryIndex: buildNodeSummaryIndex(nodes),
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
}

main();
