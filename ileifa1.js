// --- Enhanced Interpreter Logic with Control Flow, Named Graphs, and Data Types ---

// Changed from single graphData to multiple graphs
let graphs = {
    main: {
        nodes: [],
        edges: [],
        directed: false,
        weighted: false,
        bgColor: '#f5f5f5'
    }
};

let currentGraphName = 'main';
let variables = {};

// Get current graph reference
function getCurrentGraph() {
    return graphs[currentGraphName];
}

// Command to initialize a default graph
const defaultGraphCommands = `
Create Node 0 VALUE 10.
Create Node 1 VALUE "Start".
Create Node 2 VALUE true.
Create Node 3 VALUE 3.14.
Create Node 4.
Create Node 5.
Create Node 6.
Create Node 7.
Create Node 8.
Create Node 9.
Create Node 10.
Create Node 11.
Create Node 12.
Create Node 13.
Create Node 14.
Create Node 15.
Create Node 16.
Set DIRECTED true.
Connect 0 To 1.
Connect 1 To 2.
Connect 2 To 3.
Connect 3 To 4.
Connect 4 To 5.
Connect 5 To 6.
Connect 6 To 7.
Connect 7 To 8.
Connect 8 To 9.
Connect 9 To 10.
Connect 10 To 11.
Connect 11 To 12.
Remove EDGE 2 To 3.
Connect 1 To 3.
Connect 2 To 4.
Remove EDGE 4 To 5.
Connect 3 To 5.
Connect 4 To 6.
Remove EDGE 6 To 7.
Connect 5 To 7.
Connect 6 To 8.
Remove EDGE 8 To 9.
Connect 7 To 9.
Connect 9 To 11.
Connect 10 To 12.
Connect 8 To 10.
Connect 13 To 14.
Connect 15 To 16.
Connect 11 To 13.
Connect 12 To 14.
Connect 13 To 15.
Connect 14 To 16.
Remove EDGE 10 To 11.
Set NODE_COLOR 2 red.
Set NODE_COLOR 3 red.
Set NODE_COLOR 5 red.
Set NODE_COLOR 7 red.
Set NODE_COLOR 11 red.
Set NODE_COLOR 13 red.
Set Background Black.

Let counter = 0.
For i = 5 to 8 {
    Create Node $i VALUE $counter.
    Connect $i To 4.
    Let counter = $counter + 1.
}

If CONNECTED 0 1 {
    Set NODE_COLOR 0 blue.
}

Create Node C.
Connect C to 0.
Create Node Coco.
Set Node_Color Coco Pink.
Connect Coco To C.
Create Node Bigo.
Connect Coco to Bigo.
Create Node Women. 
Create Node Men. 
Connect Women To Men.
Create Node Intelligence.
Connect Men To Intelligence. 
Connect Women To Intelligence.
Connect Intelligence To 0.
Create Node Evil.
Create Node Good.
Connect Evil To Women.
Connect Good To Men.
Create Node Fool.
Connect Fool To Men.
Set Node_Color Women Red.
Set Node_Color Evil Black.
Create Node 🪙.
Connect Coco To 🪙.
Create Node Napoki.
Connect Napoki To Bigo.
Connect Coco To Napoki.
Connect Bigo to 🪙.
Create Node Monty.
Connect Monty To C.
Connect Monty To 🪙.
Connect Monty To Coco.
Create Node Disrespect.
Connect Disrespect To Monty.
Create Node Annoyance.
Connect Annoyance To Coco.`;

// Add a variable to hold the background color state - now per graph
let canvasBgColor = '#f5f5f5';

function initializeGraph() {
    resetGraph();
    interpretPenCode(defaultGraphCommands);
}

function resetGraph() {
    const graphData = getCurrentGraph();
    graphData.nodes = [];
    graphData.edges = [];
    graphData.directed = false;
    graphData.weighted = false;
    nodePositions.clear(); // Clear the visualization positions
    graphData.bgColor = '#f5f5f5'; // Reset background color
    canvasBgColor = graphData.bgColor; // Update global for compatibility
}

// Enhanced node creation with data types
function createNode(id, value = null, type = 'undefined') {
    const graphData = getCurrentGraph();
    if (graphData.nodes.some(node => node.id === id)) {
        throw new Error(`Node ${id} already exists.`);
    }
    
    // Parse the value based on type
    let parsedValue = value;
    let detectedType = type;
    
    if (value !== null && type === 'undefined') {
        // Auto-detect type
        if (value === 'true' || value === 'false') {
            parsedValue = value === 'true';
            detectedType = 'bool';
        } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
            if (value.includes('.')) {
                parsedValue = parseFloat(value);
                detectedType = 'double';
            } else {
                parsedValue = parseInt(value);
                detectedType = 'int';
            }
        } else if (value.startsWith('"') && value.endsWith('"')) {
            parsedValue = value.slice(1, -1);
            detectedType = 'string';
        } else if (value.length === 1) {
            detectedType = 'char';
        } else {
            detectedType = 'string';
        }
    }
    
    const canvas = document.getElementById('graphCanvas');
    graphData.nodes.push({
        id: id,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
        color: '#4a90e2',
        value: parsedValue,
        type: detectedType
    });
}

// Control flow evaluation
function evaluateCondition(condition) {
    if (condition === 'HAS_CYCLE') {
        return !isAcyclic();
    } else if (condition === 'IS_TREE') {
        return isTree();
    } else if (condition === 'IS_CONNECTED') {
        return isConnected();
    } else if (condition.startsWith('CONNECTED ')) {
        const parts = condition.split(' ');
        const nodeA = resolveValue(parts[1]);
        const nodeB = resolveValue(parts[2]);
        return areAdjacent(nodeA, nodeB);
    }
    return false;
}

// Variable resolution
function resolveValue(token) {
    if (token.startsWith('$')) {
        const varName = token.substring(1);
        if (variables.hasOwnProperty(varName)) {
            return variables[varName].toString();
        }
        throw new Error(`Variable ${varName} not found.`);
    }
    return token;
}

// Expression evaluation for arithmetic
function evaluateExpression(expr) {
    // Replace variables in expression
    let resolved = expr.replace(/\$(\w+)/g, (match, varName) => {
        if (variables.hasOwnProperty(varName)) {
            return variables[varName];
        }
        throw new Error(`Variable ${varName} not found.`);
    });
    
    // Simple arithmetic evaluation
    try {
        return Function(`"use strict"; return (${resolved})`)();
    } catch (e) {
        throw new Error(`Invalid expression: ${expr}`);
    }
}

/**
 * Breadth-First Search (BFS) for traversal, connectivity, and finding paths.
 * @param {string} startNodeId The ID of the starting node.
 * @param {string|null} targetNodeId The ID of the target node (optional).
 * @returns {Set|Array|null} A Set of visited nodes, an array representing a path, or null if no path is found.
 */
function bfs(startNodeId, targetNodeId = null) {
    const graphData = getCurrentGraph();
    const queue = [startNodeId];
    const visited = new Set();
    const parent = {};
    visited.add(startNodeId);
    
    while (queue.length > 0) {
        const currentId = queue.shift();
        
        // Check if target is found
        if (targetNodeId && currentId === targetNodeId) {
            let path = [];
            let curr = targetNodeId;
            while (curr) {
                path.unshift(curr);
                curr = parent[curr];
            }
            return path;
        }

        const neighbors = graphData.edges
            .filter(edge => edge.source === currentId || edge.target === currentId)
            .map(edge => edge.source === currentId ? edge.target : edge.source);

        for (const neighborId of neighbors) {
            if (!visited.has(neighborId)) {
                visited.add(neighborId);
                parent[neighborId] = currentId;
                queue.push(neighborId);
            }
        }
    }
    return targetNodeId ? null : visited; // Return visited set for connectivity check
}

/**
 * Dijkstra's algorithm for finding the shortest path in a weighted graph.
 * @param {string} startNodeId The ID of the starting node.
 * @param {string} targetNodeId The ID of the target node.
 * @returns {Array|null} An array representing the path, or null if no path is found.
 */
function dijkstra(startNodeId, targetNodeId) {
    const graphData = getCurrentGraph();
    const distances = {};
    const previous = {};
    const pq = new PriorityQueue(); // A simple min-priority queue
    
    graphData.nodes.forEach(node => {
        distances[node.id] = Infinity;
        previous[node.id] = null;
    });
    distances[startNodeId] = 0;
    pq.enqueue(startNodeId, 0);

    while (!pq.isEmpty()) {
        const { element: currentId, priority: currentDistance } = pq.dequeue();

        if (currentId === targetNodeId) {
            const path = [];
            let temp = targetNodeId;
            while (previous[temp]) {
                path.unshift(temp);
                temp = previous[temp];
            }
            path.unshift(startNodeId);
            return path;
        }

        if (currentDistance > distances[currentId]) {
            continue;
        }

        const neighbors = graphData.edges
            .filter(edge => edge.source === currentId || (!graphData.directed && edge.target === currentId));

        for (const edge of neighbors) {
            const neighborId = edge.source === currentId ? edge.target : edge.source;
            const weight = edge.weight || 1;
            const newDistance = currentDistance + weight;
            if (newDistance < distances[neighborId]) {
                distances[neighborId] = newDistance;
                previous[neighborId] = currentId;
                pq.enqueue(neighborId, newDistance);
            }
        }
    }
    return null;
}

// A simple Priority Queue implementation for Dijkstra's
class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    dequeue() {
        return this.elements.shift();
    }
    isEmpty() {
        return this.elements.length === 0;
    }
}

/**
 * Depth-First Search (DFS) helper for cycle detection.
 * @param {string} nodeId The current node ID.
 * @param {Set} visited A set of visited nodes.
 * @param {Set} recursionStack A set of nodes in the current recursion path.
 * @param {string|null} parentId The ID of the parent node.
 * @returns {boolean} True if a cycle is found, otherwise false.
 */
function hasCycleDFS(nodeId, visited, recursionStack, parentId) {
    const graphData = getCurrentGraph();
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graphData.edges
        .filter(e => e.source === nodeId || e.target === nodeId)
        .map(e => e.source === nodeId ? e.target : e.source);

    for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
            if (hasCycleDFS(neighborId, visited, recursionStack, nodeId)) {
                return true;
            }
        } else if (recursionStack.has(neighborId) && neighborId !== parentId) {
            return true;
        }
    }

    recursionStack.delete(nodeId);
    return false;
}

/**
 * Checks if the graph is connected.
 * @returns {boolean} True if the graph is connected, otherwise false.
 */
function isConnected() {
    const graphData = getCurrentGraph();
    if (graphData.nodes.length === 0) return true;
    const startNodeId = graphData.nodes[0].id;
    const reachableNodes = bfs(startNodeId);
    return reachableNodes.size === graphData.nodes.length;
}

/**
 * Checks if the graph is acyclic (a forest or a tree).
 * @returns {boolean} True if the graph has no cycles, otherwise false.
 */
function isAcyclic() {
    const graphData = getCurrentGraph();
    const visited = new Set();
    for (const node of graphData.nodes) {
        if (!visited.has(node.id)) {
            const recursionStack = new Set();
            if (hasCycleDFS(node.id, visited, recursionStack, null)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Checks if the graph is a tree.
 * @returns {boolean} True if the graph is a tree, otherwise false.
 */
function isTree() {
    return isConnected() && isAcyclic();
}

/**
 * Checks if the graph is a forest.
 * @returns {boolean} True if the graph is a forest, otherwise false.
 */
function isForest() {
    return isAcyclic();
}

/**
 * Checks if the graph is a simple graph.
 * @returns {boolean} True if the graph is simple, otherwise false.
 */
function isSimple() {
    const graphData = getCurrentGraph();
    const seenEdges = new Set();
    for (const edge of graphData.edges) {
        // Check for loops
        if (edge.source === edge.target) return false;
        
        // Check for parallel edges (undirected)
        const edgeKey1 = `${edge.source}-${edge.target}`;
        const edgeKey2 = `${edge.target}-${edge.source}`;
        
        if (seenEdges.has(edgeKey1) || seenEdges.has(edgeKey2)) {
            return false;
        }
        seenEdges.add(edgeKey1);
    }
    return true;
}

/**
 * Finds the degree of a given node.
 * @param {string} nodeId The ID of the node.
 * @returns {number} The degree of the node.
 */
function getDegree(nodeId) {
    const graphData = getCurrentGraph();
    return graphData.edges.filter(edge => edge.source === nodeId || edge.target === nodeId).length;
}

/**
 * Checks if the graph is regular.
 * @returns {boolean} True if the graph is regular, otherwise false.
 */
function isRegular() {
    const graphData = getCurrentGraph();
    if (graphData.nodes.length <= 1) return true;
    const firstDegree = getDegree(graphData.nodes[0].id);
    for (const node of graphData.nodes) {
        if (getDegree(node.id) !== firstDegree) {
            return false;
        }
    }
    return true;
}

/**
 * Checks if the graph is complete.
 * @returns {boolean} True if the graph is complete, otherwise false.
 */
function isComplete() {
    const graphData = getCurrentGraph();
    const n = graphData.nodes.length;
    const m = graphData.edges.length;
    // In a simple complete graph, m = n * (n - 1) / 2
    return isSimple() && m === (n * (n - 1) / 2);
}

/**
 * Checks if two nodes are adjacent.
 * @param {string} id1 The ID of the first node.
 * @param {string} id2 The ID of the second node.
 * @returns {boolean} True if the nodes are adjacent, otherwise false.
 */
function areAdjacent(id1, id2) {
    const graphData = getCurrentGraph();
    return graphData.edges.some(edge =>
        (edge.source === id1 && edge.target === id2) ||
        (edge.source === id2 && edge.target === id1)
    );
}

/**
 * Checks if a graph is bipartite using 2-coloring (BFS-based).
 * @returns {boolean} True if the graph is bipartite, otherwise false.
 */
function isBipartite() {
    const graphData = getCurrentGraph();
    const colors = {};
    for (const node of graphData.nodes) {
        if (!(node.id in colors)) {
            const queue = [node.id];
            colors[node.id] = 0;
            while (queue.length > 0) {
                const u = queue.shift();
                const neighbors = graphData.edges.filter(e => e.source === u || e.target === u).map(e => e.source === u ? e.target : e.source);
                for (const v of neighbors) {
                    if (!(v in colors)) {
                        colors[v] = 1 - colors[u];
                        queue.push(v);
                    } else if (colors[v] === colors[u]) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

/**
 * A simplified graph coloring function using a greedy algorithm.
 * @returns {Object} An object mapping node IDs to their assigned color.
 */
function getColoring() {
    const graphData = getCurrentGraph();
    const colors = {};
    for (const node of graphData.nodes) {
        const usedColors = new Set();
        const neighbors = graphData.edges.filter(e => e.source === node.id || e.target === node.id).map(e => e.source === node.id ? e.target : e.source);
        for (const neighborId of neighbors) {
            if (colors[neighborId] !== undefined) {
                usedColors.add(colors[neighborId]);
            }
        }
        let color = 0;
        while (usedColors.has(color)) {
            color++;
        }
        colors[node.id] = color;
    }
    return colors;
}

/**
 * Gets the chromatic number (greedy approximation).
 * @returns {number} The chromatic number.
 */
function getChromaticNumber() {
    const colors = getColoring();
    if (Object.keys(colors).length === 0) return 0;
    return Math.max(...Object.values(colors)) + 1;
}

/**
 * Enhanced interpreter with control flow and named graphs
 * @param {string} code The string containing the commands.
 * @returns {Object} An object with success/error counts and the last message.
 */
function interpretPenCode(code) {
    const lines = code.split('\n');
    let successCount = 0;
    let errorCount = 0;
    let lastMessage = '';
    let i = 0;
    
    function parseBlock() {
        const statements = [];
        let braceCount = 0;
        let currentStatement = '';
        
        while (i < lines.length) {
            const line = lines[i].trim();
            if (line === '' || line.startsWith('//')) {
                i++;
                continue;
            }
            
            currentStatement += line + ' ';
            
            if (line.includes('{')) braceCount += (line.match(/\{/g) || []).length;
            if (line.includes('}')) braceCount -= (line.match(/\}/g) || []).length;
            
            if (braceCount === 0 && (line.endsWith('.') || line.endsWith('}'))) {
                statements.push(currentStatement.trim());
                currentStatement = '';
                i++;
                if (line.endsWith('}')) break;
            } else {
                i++;
            }
        }
        
        return statements;
    }
    
    while (i < lines.length) {
        const originalLine = lines[i].trim();
        if (originalLine.startsWith('//') || originalLine === '') {
            i++;
            continue;
        }

        try {
            // Handle control flow
            if (originalLine.startsWith('If ')) {
                const conditionMatch = originalLine.match(/If (.+) \{/);
                if (conditionMatch) {
                    const condition = conditionMatch[1];
                    i++;
                    const blockStatements = parseBlock();
                    
                    if (evaluateCondition(condition)) {
                        const blockResult = interpretPenCode(blockStatements.join('\n'));
                        successCount += blockResult.success;
                        errorCount += blockResult.errors;
                        if (blockResult.lastMessage) lastMessage = blockResult.lastMessage;
                    }
                    continue;
                }
            }
            
            if (originalLine.startsWith('For ')) {
                const forMatch = originalLine.match(/For (\w+) = (\w+) to (\w+) \{/);
                if (forMatch) {
                    const [, varName, startVal, endVal] = forMatch;
                    const start = evaluateExpression(resolveValue(startVal));
                    const end = evaluateExpression(resolveValue(endVal));
                    
                    i++;
                    const blockStatements = parseBlock();
                    
                    for (let loopVar = start; loopVar <= end; loopVar++) {
                        variables[varName] = loopVar;
                        const blockResult = interpretPenCode(blockStatements.join('\n'));
                        successCount += blockResult.success;
                        errorCount += blockResult.errors;
                        if (blockResult.lastMessage) lastMessage = blockResult.lastMessage;
                    }
                    continue;
                }
            }
            
            if (originalLine.startsWith('While ')) {
                const whileMatch = originalLine.match(/While (.+) \{/);
                if (whileMatch) {
                    const condition = whileMatch[1];
                    i++;
                    const blockStatements = parseBlock();
         
