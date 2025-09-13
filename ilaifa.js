// --- Interpreter Logic ---
        let graphData = {
            nodes: [],
            edges: [],
            directed: false,
            weighted: false
        };

        // Command to initialize a default graph
        const defaultGraphCommands = `
CREATE NODE 0
CREATE NODE 1
CREATE NODE 2
CREATE NODE 3
CONNECT 0 TO 1
CONNECT 1 TO 2
CONNECT 2 TO 3
CONNECT 0 TO 2
CONNECT 0 TO 3`;
        
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

                const parts = originalLine.toUpperCase().split(/\s+/);
                const command = parts[0];
                
                try {
                    switch (command) {
                        case 'INITIALIZE':
                            initializeGraph();
                            lastMessage = 'Graph initialized with a default example.';
                            successCount++;
                            break;

                        case 'RESET':
                            resetGraph();
                            lastMessage = 'Graph has been reset.';
                            successCount++;
                            break;
                            
                        // New Case: SET BACKGROUND command
                        case 'SET':
                            if (parts[1] === 'BACKGROUND') {
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
                            } else {
                                throw new Error(`Invalid SET command: ${originalLine}`);
                            }
                            break;

                        case 'CREATE':
                            if (parts[1] === 'NODE') {
                                const nodeId = parts[2];
                                if (graphData.nodes.some(node => node.id === nodeId)) {
                                    throw new Error(`Node ${nodeId} already exists.`);
                                }
                                graphData.nodes.push({ id: nodeId, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0 });
                                lastMessage = `Created node ${nodeId}.`;
                                successCount++;
                            } else {
                                throw new Error(`Invalid CREATE command: ${originalLine}`);
                            }
                            break;
                        
                        case 'CONNECT':
                            const sourceId = parts[1];
                            const targetId = parts[3];
                            
                            if (!graphData.nodes.some(node => node.id === sourceId) || !graphData.nodes.some(node => node.id === targetId)) {
                                throw new Error('Source or target node not found.');
                            }
                            if (graphData.edges.some(edge => (edge.source === sourceId && edge.target === targetId) || (edge.source === targetId && edge.target === sourceId))) {
                                throw new Error(`Edge between ${sourceId} and ${targetId} already exists.`);
                            }
                            
                            graphData.edges.push({ source: sourceId, target: targetId });
                            lastMessage = `Connected node ${sourceId} to ${targetId}.`;
                            successCount++;
                            break;

                        case 'REMOVE':
                            if (parts[1] === 'NODE') {
                                const nodeId = parts[2];
                                const initialNodeCount = graphData.nodes.length;
                                graphData.nodes = graphData.nodes.filter(node => node.id !== nodeId);
                                if (graphData.nodes.length === initialNodeCount) {
                                    throw new Error(`Node ${nodeId} not found.`);
                                }
                                graphData.edges = graphData.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
                                lastMessage = `Removed node ${nodeId} and its incident edges.`;
                                successCount++;
                            } else {
                                throw new Error(`Invalid REMOVE command: ${originalLine}`);
                            }
                            break;

                        // --- Verbs ---
                        case 'TRAVERSE':
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
                        
                        case 'COLOR':
                            if (parts[1] === 'GRAPH') {
                                const coloring = getColoring();
                                const output = Object.entries(coloring).map(([node, color]) => `${node}: Color ${color}`).join(', ');
                                lastMessage = `Graph colored with a greedy algorithm: ${output}.`;
                                successCount++;
                            }
                            break;
                        
                        case 'SUBDIVIDE':
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
                            graphData.nodes.push({ id: newNodeId, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0 });
                            graphData.edges.push({ source: edgeToSubdivide.source, target: newNodeId });
                            graphData.edges.push({ source: newNodeId, target: edgeToSubdivide.target });
                            lastMessage = `Subdivided edge between ${sourceSub} and ${targetSub} with new node ${newNodeId}.`;
                            successCount++;
                            break;

                        case 'CONTRACT':
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
                 
