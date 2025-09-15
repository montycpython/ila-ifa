// --- Enhanced Interpreter Logic with Control Flow, Named Graphs, and Data Types ---

// Enhanced data structure to support multiple named graphs
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

// Maintain backward compatibility
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
    if (typeof nodePositions !== 'undefined') {
        nodePositions.clear(); // Clear the visualization positions if available
    }
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
    
    // Get canvas dimensions safely
    const canvas = document.getElementById('graphCanvas');
    const canvasWidth = canvas ? canvas.width : 800;
    const canvasHeight = canvas ? canvas.height : 600;
    
    graphData.nodes.push({
        id: id,
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
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
                    
                    let iterations = 0;
                    while (evaluateCondition(condition) && iterations < 100) { // Safety limit
                        const blockResult = interpretPenCode(blockStatements.join('\n'));
                        successCount += blockResult.success;
                        errorCount += blockResult.errors;
                        if (blockResult.lastMessage) lastMessage = blockResult.lastMessage;
                        iterations++;
                    }
                    continue;
                }
            }

            // Check if the line ends with a period
            if (!originalLine.endsWith('.')) {
                errorCount++;
                lastMessage = `Error on line ${i + 1}: Each statement must end with a period.`;
                i++;
                continue;
            }

            // Remove the period and split the command. The command is now case-sensitive.
            const parts = originalLine.slice(0, -1).split(/\s+/);
            const command = parts[0];
            
            switch (command) {
                case 'Initialize':
                    initializeGraph();
                    lastMessage = 'Graph initialized with a default example.';
                    successCount++;
                    break;

                case 'Reset':
                    resetGraph();
                    lastMessage = 'Graph has been reset.';
                    successCount++;
                    break;
                    
                case 'Create':
                    if (parts[1] === 'GRAPH') {
                        const graphName = parts[2];
                        if (graphs[graphName]) {
                            throw new Error(`Graph ${graphName} already exists.`);
                        }
                        graphs[graphName] = {
                            nodes: [],
                            edges: [],
                            directed: false,
                            weighted: false,
                            bgColor: '#f5f5f5'
                        };
                        lastMessage = `Created graph ${graphName}.`;
                        successCount++;
                    } else if (parts[1] === 'Node') {
                        const nodeId = resolveValue(parts[2]);
                        let value = null;
                        
                        if (parts[3] === 'VALUE') {
                            value = parts[4];
                            // Handle variable references in values
                            if (value.startsWith('$')) {
                                value = resolveValue(value);
                            }
                        }
                        
                        createNode(nodeId, value);
                        lastMessage = `Created node ${nodeId}${value !== null ? ` with value ${value}` : ''}.`;
                        successCount++;
                    } else {
                        throw new Error(`Invalid CREATE command: ${originalLine}`);
                    }
                    break;
                    
                case 'Use':
                    if (parts[1] === 'GRAPH') {
                        const graphName = parts[2];
                        if (!graphs[graphName]) {
                            throw new Error(`Graph ${graphName} not found.`);
                        }
                        currentGraphName = graphName;
                        const graphData = getCurrentGraph();
                        canvasBgColor = graphData.bgColor; // Update global background
                        lastMessage = `Now using graph ${graphName}.`;
                        successCount++;
                    } else {
                        throw new Error(`Invalid USE command: ${originalLine}`);
                    }
                    break;
                    
                case 'Let':
                    const varName = parts[1];
                    const expression = parts.slice(3).join(' '); // Skip 'Let', varName, and '='
                    variables[varName] = evaluateExpression(resolveValue(expression));
                    lastMessage = `Set variable ${varName} = ${variables[varName]}.`;
                    successCount++;
                    break;
                    
                // Enhanced SET command
                case 'Set':
                    if (parts[1].toLowerCase() === 'background') {
                        const color = parts[2] ? parts[2].toLowerCase() : 'white';
                        
                        // Simple mapping for common colors
                        const colors = {
                            'black': '#1E1E1E',
                            'red': '#FF5555',
                            'blue': '#6272A4',
                            'green': '#50FA7B',
                            'yellow': '#F1FA8C',
                            'purple': '#BD93F9',
                            'white': '#F5F5F5',
                            'clear': 'transparent'
                        };
                        
                        getCurrentGraph().bgColor = colors[color] || color;
                        canvasBgColor = getCurrentGraph().bgColor; // Update global for compatibility
                        lastMessage = `Canvas background set to ${color}.`;
                        successCount++;
                    } else if (parts[1].toLowerCase() === 'directed') {
                        getCurrentGraph().directed = (parts[2] && parts[2].toLowerCase() === 'true');
                        lastMessage = `Graph set to ${getCurrentGraph().directed ? 'directed' : 'undirected'}.`;
                        successCount++;
                    } else if (parts[1].toLowerCase() === 'weighted') {
                        getCurrentGraph().weighted = (parts[2] && parts[2].toLowerCase() === 'true');
                        lastMessage = `Graph set to ${getCurrentGraph().weighted ? 'weighted' : 'unweighted'}.`;
                        successCount++;
                    } else if (parts[1].toLowerCase() === 'node_color') {
                        const nodeId = resolveValue(parts[2]);
                        const color = parts[3];
                        const node = getCurrentGraph().nodes.find(n => n.id === nodeId);
                        if (!node) throw new Error(`Node ${nodeId} not found.`);
                        node.color = color;
                        lastMessage = `Node ${nodeId} color set to ${color}.`;
                        successCount++;
                    } else {
                        throw new Error(`Invalid SET command: ${originalLine}`);
                    }
                    break;
                
                case 'Connect':
                    const sourceId = resolveValue(parts[1]);
                    const targetId = resolveValue(parts[3]);
                    const graphData = getCurrentGraph();
                    const weight = graphData.weighted && parts[4] === 'WEIGHT' ? parseFloat(parts[5]) : 1;
                    
                    if (!graphData.nodes.some(node => node.id === sourceId) || !graphData.nodes.some(node => node.id === targetId)) {
                        throw new Error('Source or target node not found.');
                    }
                    if (graphData.edges.some(edge => (edge.source === sourceId && edge.target === targetId))) {
                        throw new Error(`Edge between ${sourceId} and ${targetId} already exists.`);
                    }
                    
                    graphData.edges.push({ source: sourceId, target: targetId, weight });
                    lastMessage = `Connected node ${sourceId} to ${targetId}${graphData.weighted ? ` with weight ${weight}` : ''}.`;
                    successCount++;
                    break;

                case 'Remove':
                    if (parts[1] === 'Node') {
                        const nodeId = resolveValue(parts[2]);
                        const graphData = getCurrentGraph();
                        const initialNodeCount = graphData.nodes.length;
                        graphData.nodes = graphData.nodes.filter(node => node.id !== nodeId);
                        if (graphData.nodes.length === initialNodeCount) {
                            throw new Error(`Node ${nodeId} not found.`);
                        }
                        graphData.edges = graphData.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
                        lastMessage = `Removed node ${nodeId} and its incident edges.`;
                        successCount++;
                    } else if (parts[1] === 'EDGE') {
                        const sourceId = resolveValue(parts[2]);
                        const targetId = resolveValue(parts[4]);
                        const graphData = getCurrentGraph();
                        const initialEdgeCount = graphData.edges.length;
                        graphData.edges = graphData.edges.filter(edge => !(edge.source === sourceId && edge.target === targetId) && !(edge.target === sourceId && edge.source === targetId));
                        if (graphData.edges.length === initialEdgeCount) {
                            throw new Error(`Edge between ${sourceId} and ${targetId} not found.`);
                        }
                        lastMessage = `Removed edge between ${sourceId} and ${targetId}.`;
                        successCount++;
                    } else {
                        throw new Error(`Invalid REMOVE command: ${originalLine}`);
                    }
                    break;

                // New command: Isolate
                case 'Isolate':
                    if (parts[1] === 'Node') {
                        const nodeId = resolveValue(parts[2]);
                        const graphData = getCurrentGraph();
                        const nodeExists = graphData.nodes.some(n => n.id === nodeId);
                        if (!nodeExists) throw new Error(`Node ${nodeId} not found.`);
                        graphData.edges = graphData.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
                        lastMessage = `Isolated node ${nodeId}.`;
                        successCount++;
                    } else {
                        throw new Error(`Invalid ISOLATE command: ${originalLine}`);
                    }
                    break;

                // --- Verbs ---
                case 'Traverse':
                    const startNodeId = resolveValue(parts[1]);
                    const visitedNodes = bfs(startNodeId);
                    if (!visitedNodes) {
                         throw new Error('Could not find starting node or no nodes exist.');
                    }
                    
                    // Highlight the visited nodes
                    getCurrentGraph().nodes.forEach(node => {
                        node.isTraversed = visitedNodes.has(node.id);
                    });
                    lastMessage = `Traversed graph from node ${startNodeId}. Nodes visited: ${[...visitedNodes].join(', ')}.`;
                    successCount++;
                    break;
                
                case 'Color':
                    if (parts[1] === 'GRAPH') {
                        const coloring = getColoring();
                        const output = Object.entries(coloring).map(([node, color]) => `${node}: Color ${color}`).join(', ');
                        lastMessage = `Graph colored with a greedy algorithm: ${output}.`;
                        successCount++;
                    }
                    break;
                
                case 'Subdivide':
                    const sourceSub = resolveValue(parts[2]);
                    const targetSub = resolveValue(parts[3]);
                    const newNodeId = resolveValue(parts[5]);
                    const graphData2 = getCurrentGraph();
                    const edgeToSubdivideIndex = graphData2.edges.findIndex(e => (e.source === sourceSub && e.target === targetSub) || (e.source === targetSub && e.target === sourceSub));
                    if (edgeToSubdivideIndex === -1) {
                        throw new Error(`Edge between ${sourceSub} and ${targetSub} not found.`);
                    }
                    if (graphData2.nodes.some(node => node.id === newNodeId)) {
                        throw new Error(`New node ${newNodeId} already exists.`);
                    }
                    const edgeToSubdivide = graphData2.edges.splice(edgeToSubdivideIndex, 1)[0];
                    const canvas = document.getElementById('graphCanvas');
                    const canvasWidth = canvas ? canvas.width : 800;
                    const canvasHeight = canvas ? canvas.height : 600;
                    graphData2.nodes.push({ 
                        id: newNodeId, 
                        x: Math.random() * canvasWidth, 
                        y: Math.random() * canvasHeight, 
                        vx: 0, 
                        vy: 0, 
                        color: '#4a90e2' 
                    });
                    graphData2.edges.push({ source: edgeToSubdivide.source, target: newNodeId });
                    graphData2.edges.push({ source: newNodeId, target: edgeToSubdivide.target });
                    lastMessage = `Subdivided edge between ${sourceSub} and ${targetSub} with new node ${newNodeId}.`;
                    successCount++;
                    break;

                case 'Contract':
                    const node1 = resolveValue(parts[1]);
                    const node2 = resolveValue(parts[2]);
                    const nodesToContract = [node1, node2];
                    if (!areAdjacent(node1, node2)) {
                        throw new Error('Cannot contract non-adjacent nodes.');
                    }
                    
                    const newId = `${node1}${node2}`;
                    const contractGraphData = getCurrentGraph();
                    if (contractGraphData.nodes.some(node => node.id === newId)) {
                        throw new Error(`New node ID ${newId} already exists.`);
                    }

                    const contractedNode = {
                        id: newId,
                        x: (contractGraphData.nodes.find(n => n.id === node1).x + contractGraphData.nodes.find(n => n.id === node2).x) / 2,
                        y: (contractGraphData.nodes.find(n => n.id === node1).y + contractGraphData.nodes.find(n => n.id === node2).y) / 2,
                        vx: 0,
                        vy: 0,
                        color: '#4a90e2'
                    };
                    
                    contractGraphData.nodes = contractGraphData.nodes.filter(node => !nodesToContract.includes(node.id));
                    contractGraphData.nodes.push(contractedNode);
                    
                    contractGraphData.edges = contractGraphData.edges.filter(edge => !(nodesToContract.includes(edge.source) && nodesToContract.includes(edge.target)));
                    
                    contractGraphData.edges.forEach(edge => {
                        if (edge.source === node1 || edge.source === node2) edge.source = newId;
                        if (edge.target === node1 || edge.target === node2) edge.target = newId;
                    });
                    
                    lastMessage = `Contracted nodes ${node1} and ${node2} into a new node ${newId}.`;
                    successCount++;
                    break;

                case 'Partition':
                    const visitedNodesForPartition = new Set();
                    const components = [];
                    const partitionGraphData = getCurrentGraph();
                    for (const node of partitionGraphData.nodes) {
                        if (!visitedNodesForPartition.has(node.id)) {
                            const component = bfs(node.id);
                            components.push(component);
                            component.forEach(c => visitedNodesForPartition.add(c));
                        }
                    }
                    const componentList = components.map((comp, i) => `Component ${i+1}: ${[...comp].join(', ')}`).join('; ');
                    lastMessage = `Graph partitioned into ${components.length} components. Details: ${componentList}`;
                    successCount++;
                    break;
                    
                // Enhanced GET command
                case 'Get':
                    if (parts[1] === 'DEGREE') {
                        const nodeId = resolveValue(parts[2]);
                        const nodeExists = getCurrentGraph().nodes.some(n => n.id === nodeId);
                        if (!nodeExists) throw new Error(`Node ${nodeId} not found.`);
                        const degree = getDegree(nodeId);
                        lastMessage = `The degree of node ${nodeId} is ${degree}.`;
                        successCount++;
                    } else if (parts[1] === 'CHROMATIC_NUMBER') {
                         const chromaticNumber = getChromaticNumber();
                         lastMessage = `The chromatic number of the graph (greedy approximation) is ${chromaticNumber}.`;
                         successCount++;
                    } else if (parts[1] === 'PATH') {
                         const start = resolveValue(parts[2]);
                         const end = resolveValue(parts[3]);
                         const pathGraphData = getCurrentGraph();
                         if (pathGraphData.weighted) {
                             const path = dijkstra(start, end);
                             if (path) {
                                 lastMessage = `Shortest path (Dijkstra's): ${path.join(' -> ')}`;
                                 successCount++;
                             } else {
                                 lastMessage = `No path found from ${start} to ${end}.`;
                                 errorCount++;
                             }
                         } else {
                             const path = bfs(start, end);
                             if (path) {
                                  lastMessage = `Shortest path (BFS): ${path.join(' -> ')}`;
                                  successCount++;
                             } else {
                                  lastMessage = `No path found from ${start} to ${end}.`;
                                  errorCount++;
                             }
                         }
                    } else if (parts[1] === 'COMPONENTS') {
                        const visitedNodesForComponents = new Set();
                        const components = [];
                        const componentsGraphData = getCurrentGraph();
                        for (const node of componentsGraphData.nodes) {
                            if (!visitedNodesForComponents.has(node.id)) {
                                const component = bfs(node.id);
                                components.push([...component]);
                                component.forEach(c => visitedNodesForComponents.add(c));
                            }
                        }
                        const output = components.map((comp, i) => `Component ${i + 1}: [${comp.join(', ')}]`).join(', ');
                        lastMessage = `Found ${components.length} connected components: ${output}`;
                        successCount++;
                    } else {
                         throw new Error(`Invalid GET command: ${originalLine}`);
                    }
                    break;
                
                default:
                    throw new Error(`Invalid command: ${originalLine}`);
            }
            
        } catch (e) {
            errorCount++;
            lastMessage = `Error on line ${i + 1}: ${e.message}`;
            // Continue processing other commands
        }
        
        i++;
    }

    return {
      success: successCount,
      errors: errorCount,
      lastMessage: lastMessage
    };
}

// --- End of Enhanced Interpreter Logic ---

// --- Visualization and UI Logic ---
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const penCodeTextarea = document.getElementById('penCode');
const runButton = document.getElementById('runButton');
const resetButton = document.getElementById('resetButton');
const messageDiv = document.getElementById('message');

const NODE_RADIUS = 15;
const K_REPEL = 10000; // Increased again for better spacing
const K_ATTRACT = 0.2; // Reduced to prevent clumping
const DT = 0.5;

// Map to hold node position objects
const nodePositions = new Map();

// Camera state for pan and zoom
const camera = {
    x: 0,
    y: 0,
    scale: 1.0,
};
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let lastTouchPos = null;
let lastTouchDistance = null;

function updateSimulation() {
    const graphData = getCurrentGraph();
    if (graphData.nodes.length === 0) {
        return;
    }

    // Repulsion force
    for (let i = 0; i < graphData.nodes.length; i++) {
        const node1 = graphData.nodes[i];
        for (let j = i + 1; j < graphData.nodes.length; j++) {
            const node2 = graphData.nodes[j];
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check for overlap and apply a strong repulsive force
            if (distance < NODE_RADIUS * 2) {
                const overlap = (NODE_RADIUS * 2) - distance;
                const force = overlap * 2.0; // A stronger push
                const fx = force * dx / distance;
                const fy = force * dy / distance;
                node1.vx -= fx * DT;
                node1.vy -= fy * DT;
                node2.vx += fx * DT;
                node2.vy += fy * DT;
            } else if (distance > 0) {
                // The general repulsion force
                const force = K_REPEL / (distance * distance);
                const fx = force * dx / distance;
                const fy = force * dy / distance;
                node1.vx -= fx * DT;
                node1.vy -= fy * DT;
                node2.vx += fx * DT;
                node2.vy += fy * DT;
            }
        }
    }

    // Attraction force
    for (const edge of graphData.edges) {
        const node1 = graphData.nodes.find(n => n.id === edge.source);
        const node2 = graphData.nodes.find(n => n.id === edge.target);
        if (!node1 || !node2) continue;
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            const force = K_ATTRACT * distance; 
            const fx = force * dx / distance;
            const fy = force * dy / distance;
            node1.vx += fx * DT;
            node1.vy += fy * DT;
            node2.vx -= fx * DT;
            node2.vy -= fy * DT;
        }
    }
    
    // Update positions and apply damping
    const width = canvas.width;
    const height = canvas.height;
    for (const node of graphData.nodes) {
        node.vx *= 0.9; // Increased damping to make nodes settle faster
        node.vy *= 0.9; // Increased damping to make nodes settle faster
        node.x += node.vx * DT;
        node.y += node.vy * DT;
        // Boundary check
        node.x = Math.max(NODE_RADIUS, Math.min(width - NODE_RADIUS, node.x));
        node.y = Math.max(NODE_RADIUS, Math.min(height - NODE_RADIUS, node.y));
    }
}

// Function to draw arrows for directed edges
function drawArrow(x1, y1, x2, y2, arrowSize = 10) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // Calculate the end point of the arrow (at the edge of the target node)
    const endX = x2 - Math.cos(angle) * (NODE_RADIUS + 2);
    const endY = y2 - Math.sin(angle) * (NODE_RADIUS + 2);
    
    // Draw the arrow head
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = '#666';
    ctx.fill();
}

function drawGraph() {
    const graphData = getCurrentGraph();
    
    // First, fill the background with the current graph's background color
    ctx.fillStyle = graphData.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(camera.x + canvas.width / 2, camera.y + canvas.height / 2);
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw edges
    for (const edge of graphData.edges) {
        const sourceNode = graphData.nodes.find(n => n.id === edge.source);
        const targetNode = graphData.nodes.find(n => n.id === edge.target);
        if (sourceNode && targetNode) {
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw arrow for directed edges
            if (graphData.directed) {
                drawArrow(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
            }

            // Draw weight if weighted
            if (graphData.weighted && edge.weight) {
                const midX = (sourceNode.x + targetNode.x) / 2;
                const midY = (sourceNode.y + targetNode.y) / 2;
                ctx.fillStyle = '#fff';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(edge.weight, midX, midY);
            }
        }
    }

    // Draw nodes
    for (const node of graphData.nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = node.isTraversed ? '#ff79c6' : (node.color || '#4a90e2');
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw node ID
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y);

        // Draw node value and type below if they exist
        if (node.value !== null && node.value !== undefined) {
            ctx.fillStyle = '#333';
            ctx.font = '10px Inter';
            const valueText = `${node.value} (${node.type})`;
            ctx.fillText(valueText, node.x, node.y + NODE_RADIUS + 12);
        }
    }
    
    ctx.restore();
}

let animationFrameId;
function animateLoop() {
    updateSimulation();
    drawGraph();
    animationFrameId = requestAnimationFrame(animateLoop);
}

function resizeAndDraw() {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = 400; // Fixed height for a cleaner layout
    
    drawGraph();
}

runButton.addEventListener('click', () => {
    // Reset highlighting on every run
    getCurrentGraph().nodes.forEach(node => {
        node.isTraversed = false;
    });
    const result = interpretPenCode(penCodeTextarea.value);
    messageDiv.textContent = result.lastMessage;
    if (result.errors > 0) {
        messageDiv.style.color = '#ff5555';
    } else {
        messageDiv.style.color = '#50fa7b';
    }
    drawGraph();
});

resetButton.addEventListener('click', () => {
    resetGraph();
    messageDiv.textContent = 'Graph has been reset.';
    messageDiv.style.color = '#50fa7b';
    drawGraph();
});

// Event listeners for zoom and pan (mouse)
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;
    
    const oldScale = camera.scale;
    camera.scale *= (e.deltaY < 0) ? scaleFactor : 1 / scaleFactor;
    camera.scale = Math.max(0.25, Math.min(3.0, camera.scale));
    
    camera.x -= (mouseX - (canvas.width / 2) - camera.x) * (camera.scale / oldScale - 1);
    camera.y -= (mouseY - (canvas.height / 2) - camera.y) * (camera.scale / oldScale - 1);

    drawGraph();
});

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    camera.x += dx;
    camera.y += dy;
    lastMousePos = { x: e.clientX, y: e.clientY };
    drawGraph();
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

// Event listeners for zoom and pan (touch)
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
        lastTouchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouchPos) {
        const dx = e.touches[0].clientX - lastTouchPos.x;
        const dy = e.touches[0].clientY - lastTouchPos.y;
        camera.x += dx;
        camera.y += dy;
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        drawGraph();
    } else if (e.touches.length === 2 && lastTouchDistance) {
        const newDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const scaleFactor = newDistance / lastTouchDistance;
        const oldScale = camera.scale;
        camera.scale *= scaleFactor;
        camera.scale = Math.max(0.25, Math.min(3.0, camera.scale));

        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        camera.x -= (centerX - (canvas.width / 2) - camera.x) * (camera.scale / oldScale - 1);
        camera.y -= (centerY - (canvas.height / 2) - camera.y) * (camera.scale / oldScale - 1);

        lastTouchDistance = newDistance;
        drawGraph();
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    lastTouchPos = null;
    lastTouchDistance = null;
});

window.addEventListener('load', () => {
    resizeAndDraw();
    initializeGraph();
    animateLoop();
    penCodeTextarea.value = defaultGraphCommands;
});
window.addEventListener('resize', resizeAndDraw);
