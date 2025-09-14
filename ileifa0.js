// --- Interpreter Logic ---
let graphData = {
    nodes: [],
    edges: [],
    directed: false,
    weighted: false
};

// Command to initialize a default graph
const defaultGraphCommands = `
Create Node 0.
Create Node 1.
Create Node 2.
Create Node 3.
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

// Add a variable to hold the background color state
let canvasBgColor = '#f5f5f5';

function initializeGraph() {
    resetGraph();
    interpretPenCode(defaultGraphCommands);
}

function resetGraph() {
    graphData.nodes = [];
    graphData.edges = [];
    graphData.directed = false;
    graphData.weighted = false;
    nodePositions.clear(); // Clear the visualization positions
    canvasBgColor = '#f5f5f5'; // Reset background color
}

/**
 * Breadth-First Search (BFS) for traversal, connectivity, and finding paths.
 * @param {string} startNodeId The ID of the starting node.
 * @param {string|null} targetNodeId The ID of the target node (optional).
 * @returns {Set|Array|null} A Set of visited nodes, an array representing a path, or null if no path is found.
 */
function bfs(startNodeId, targetNodeId = null) {
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
    return graphData.edges.filter(edge => edge.source === nodeId || edge.target === nodeId).length;
}

/**
 * Checks if the graph is regular.
 * @returns {boolean} True if the graph is regular, otherwise false.
 */
function isRegular() {
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
 * Interprets a string of commands to manipulate and analyze a graph.
 * @param {string} code The string containing the commands.
 * @returns {Object} An object with success/error counts and the last message.
 */
function interpretPenCode(code) {
    const lines = code.split('\n');
    let successCount = 0;
    let errorCount = 0;
    let lastMessage = '';
    
    lines.forEach((line, index) => {
        const originalLine = line.trim();
        if (originalLine.startsWith('//') || originalLine === '') return;

        // Check if the line ends with a period
        if (!originalLine.endsWith('.')) {
            errorCount++;
            lastMessage = `Error on line ${index + 1}: Each statement must end with a period.`;
            return;
        }

        // Remove the period and split the command. The command is now case-sensitive.
        const parts = originalLine.slice(0, -1).split(/\s+/);
        const command = parts[0];
        
        try {
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
                    
                // New Case: SET command
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
                            'clear': 'transparent' // Special case for a transparent background
                        };
                        
                        canvasBgColor = colors[color] || color; // Use mapped color or raw string
                        lastMessage = `Canvas background set to ${color}.`;
                        successCount++;
                    } else if (parts[1].toLowerCase() === 'directed') {
                        graphData.directed = (parts[2] && parts[2].toLowerCase() === 'true');
                        lastMessage = `Graph set to ${graphData.directed ? 'directed' : 'undirected'}.`;
                        successCount++;
                    } else if (parts[1].toLowerCase() === 'weighted') {
                        graphData.weighted = (parts[2] && parts[2].toLowerCase() === 'true');
                        lastMessage = `Graph set to ${graphData.weighted ? 'weighted' : 'unweighted'}.`;
                        successCount++;
                    } else if (parts[1].toLowerCase() === 'node_color') {
                        const nodeId = parts[2];
                        const color = parts[3];
                        const node = graphData.nodes.find(n => n.id === nodeId);
                        if (!node) throw new Error(`Node ${nodeId} not found.`);
                        node.color = color;
                        lastMessage = `Node ${nodeId} color set to ${color}.`;
                        successCount++;
                    } else {
                        throw new Error(`Invalid SET command: ${originalLine}`);
                    }
                    break;

                case 'Create':
                    if (parts[1] === 'Node') {
                        const nodeId = parts[2];
                        if (graphData.nodes.some(node => node.id === nodeId)) {
                            throw new Error(`Node ${nodeId} already exists.`);
                        }
                        graphData.nodes.push({ id: nodeId, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0, color: '#4a90e2' });
                        lastMessage = `Created node ${nodeId}.`;
                        successCount++;
                    } else {
                        throw new Error(`Invalid CREATE command: ${originalLine}`);
                    }
                    break;
                
                case 'Connect':
                    const sourceId = parts[1];
                    const targetId = parts[3];
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
                        const nodeId = parts[2];
                        const initialNodeCount = graphData.nodes.length;
                        graphData.nodes = graphData.nodes.filter(node => node.id !== nodeId);
                        if (graphData.nodes.length === initialNodeCount) {
                            throw new Error(`Node ${nodeId} not found.`);
                        }
                        graphData.edges = graphData.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
                        lastMessage = `Removed node ${nodeId} and its incident edges.`;
                        successCount++;
                    } else if (parts[1] === 'EDGE') {
                        const sourceId = parts[2];
                        const targetId = parts[4];
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
                        const nodeId = parts[2];
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
                    const startNodeId = parts[1];
                    const visitedNodes = bfs(startNodeId);
                    if (!visitedNodes) {
                         throw new Error('Could not find starting node or no nodes exist.');
                    }
                    
                    // Highlight the visited nodes
                    graphData.nodes.forEach(node => {
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
                    const sourceSub = parts[2];
                    const targetSub = parts[3];
                    const newNodeId = parts[5];
                    const edgeToSubdivideIndex = graphData.edges.findIndex(e => (e.source === sourceSub && e.target === targetSub) || (e.source === targetSub && e.target === sourceSub));
                    if (edgeToSubdivideIndex === -1) {
                        throw new Error(`Edge between ${sourceSub} and ${targetSub} not found.`);
                    }
                    if (graphData.nodes.some(node => node.id === newNodeId)) {
                        throw new Error(`New node ${newNodeId} already exists.`);
                    }
                    const edgeToSubdivide = graphData.edges.splice(edgeToSubdivideIndex, 1)[0];
                    graphData.nodes.push({ id: newNodeId, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0, color: '#4a90e2' });
                    graphData.edges.push({ source: edgeToSubdivide.source, target: newNodeId });
                    graphData.edges.push({ source: newNodeId, target: edgeToSubdivide.target });
                    lastMessage = `Subdivided edge between ${sourceSub} and ${targetSub} with new node ${newNodeId}.`;
                    successCount++;
                    break;

                case 'Contract':
                    const node1 = parts[1];
                    const node2 = parts[2];
                    const nodesToContract = [node1, node2];
                    if (!areAdjacent(node1, node2)) {
                        throw new Error('Cannot contract non-adjacent nodes.');
                    }
                    
                    const newId = `${node1}${node2}`;
                    if (graphData.nodes.some(node => node.id === newId)) {
                        throw new Error(`New node ID ${newId} already exists.`);
                    }

                    const contractedNode = {
                        id: newId,
                        x: (graphData.nodes.find(n => n.id === node1).x + graphData.nodes.find(n => n.id === node2).x) / 2,
                        y: (graphData.nodes.find(n => n.id === node1).y + graphData.nodes.find(n => n.id === node2).y) / 2,
                        vx: 0,
                        vy: 0,
                        color: '#4a90e2'
                    };
                    
                    graphData.nodes = graphData.nodes.filter(node => !nodesToContract.includes(node.id));
                    graphData.nodes.push(contractedNode);
                    
                    graphData.edges = graphData.edges.filter(edge => !(nodesToContract.includes(edge.source) && nodesToContract.includes(edge.target)));
                    
                    graphData.edges.forEach(edge => {
                        if (edge.source === node1 || edge.source === node2) edge.source = newId;
                        if (edge.target === node1 || edge.target === node2) edge.target = newId;
                    });
                    
                    lastMessage = `Contracted nodes ${node1} and ${node2} into a new node ${newId}.`;
                    successCount++;
                    break;

                case 'Partition':
                    const visitedNodesForPartition = new Set();
                    const components = [];
                    for (const node of graphData.nodes) {
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
                    
                // New GET command: GET COMPONENTS
                case 'Get':
                    if (parts[1] === 'DEGREE') {
                        const nodeId = parts[2];
                        const nodeExists = graphData.nodes.some(n => n.id === nodeId);
                        if (!nodeExists) throw new Error(`Node ${nodeId} not found.`);
                        const degree = getDegree(nodeId);
                        lastMessage = `The degree of node ${nodeId} is ${degree}.`;
                        successCount++;
                    } else if (parts[1] === 'CHROMATIC_NUMBER') {
                         const chromaticNumber = getChromaticNumber();
                         lastMessage = `The chromatic number of the graph (greedy approximation) is ${chromaticNumber}.`;
                         successCount++;
                    } else if (parts[1] === 'PATH') {
                         const start = parts[2];
                         const end = parts[3];
                         if (graphData.weighted) {
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
                        for (const node of graphData.nodes) {
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
            lastMessage = `Error on line ${index + 1}: ${e.message}`;
            // The fix is here: we now allow the loop to continue
        }
    });

    return {
      success: successCount,
      errors: errorCount,
      lastMessage: lastMessage
    };
}

// --- End of Interpreter Logic ---

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

function drawGraph() {
    // First, fill the background
    ctx.fillStyle = canvasBgColor;
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

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y);
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
    graphData.nodes.forEach(node => {
        node.isTraversed = false;
        node.color = '#4a90e2';
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
