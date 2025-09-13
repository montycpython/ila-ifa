#include <emscripten/emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>

#define MAX_NODES 100
#define MAX_EDGES 200
#define MAX_MESSAGE_SIZE 256
#define NODE_ID_LENGTH 16
#define COLOR_LENGTH 16
#define STATEMENT_LENGTH 128

// An enumeration to keep track of the value's type
typedef enum {
    TYPE_UNDEFINED,
    TYPE_STRING,
    TYPE_INTEGER,
    TYPE_DOUBLE,
    TYPE_BOOLEAN
} ValueType;

// A union to store different types of values in the same memory space
typedef union {
    char s[64];  // String
    long i;       // Integer
    double d;     // Double
    bool b;       // Boolean
} NodeValue;

// Structs for graph data
typedef struct {
    char id[NODE_ID_LENGTH];
    float x, y;
    float vx, vy;
    char color[COLOR_LENGTH];
    bool isTraversed;
    ValueType type;
    NodeValue value;
} Node;

typedef struct {
    char source[NODE_ID_LENGTH];
    char target[NODE_ID_LENGTH];
    double weight;
    char statement[STATEMENT_LENGTH];
} Edge;

typedef struct {
    int successCount;
    int errorCount;
    char lastMessage[MAX_MESSAGE_SIZE];
} InterpreterResult;

// Global graph data structures
Node nodes[MAX_NODES];
Edge edges[MAX_EDGES];
int nodeCount = 0;
int edgeCount = 0;
bool isDirected = false;
bool isWeighted = false;

// Emscripten-exported function to get pointers to the data
EMSCRIPTEN_KEEPALIVE Node* getNodesPtr() { return nodes; }
EMSCRIPTEN_KEEPALIVE Edge* getEdgesPtr() { return edges; }
EMSCRIPTEN_KEEPALIVE int getNodeCount() { return nodeCount; }
EMSCRIPTEN_KEEPALIVE int getEdgeCount() { return edgeCount; }
EMSCRIPTEN_KEEPALIVE int getNodeSize() { return sizeof(Node); }
EMSCRIPTEN_KEEPALIVE int getEdgeSize() { return sizeof(Edge); }
EMSCRIPTEN_KEEPALIVE InterpreterResult* getResultPtr() {
    static InterpreterResult result;
    return &result;
}

// Helpers to find node index by ID
int findNodeIndex(const char* nodeId) {
    for (int i = 0; i < nodeCount; ++i) {
        if (strcmp(nodes[i].id, nodeId) == 0) {
            return i;
        }
    }
    return -1;
}

// Function to safely get a node's double value for calculations
double getNodeDoubleValue(const char* nodeId) {
    int index = findNodeIndex(nodeId);
    if (index == -1) return 0.0;
    switch (nodes[index].type) {
        case TYPE_INTEGER:
            return (double)nodes[index].value.i;
        case TYPE_DOUBLE:
            return nodes[index].value.d;
        case TYPE_BOOLEAN:
            return nodes[index].value.b ? 1.0 : 0.0;
        default:
            return 0.0;
    }
}

// A simple expression parser and evaluator
void evaluateExpression(const char* expr, Node* resultNode, char** sources, int* sourceCount) {
    // This is a simplified evaluator that only handles "A op B" where A and B are node IDs or numbers
    char firstOperand[NODE_ID_LENGTH], op[2], secondOperand[NODE_ID_LENGTH];
    *sourceCount = 0;
    
    int numScanned = sscanf(expr, "%s %s %s", firstOperand, op, secondOperand);
    
    double val1 = 0.0;
    int index1 = findNodeIndex(firstOperand);
    if (index1 != -1) {
        val1 = getNodeDoubleValue(firstOperand);
        sources[(*sourceCount)++] = nodes[index1].id;
    } else {
        val1 = atof(firstOperand);
    }

    if (numScanned < 3) {
        resultNode->type = TYPE_DOUBLE;
        resultNode->value.d = val1;
        return;
    }

    double val2 = 0.0;
    int index2 = findNodeIndex(secondOperand);
    if (index2 != -1) {
        val2 = getNodeDoubleValue(secondOperand);
        sources[(*sourceCount)++] = nodes[index2].id;
    } else {
        val2 = atof(secondOperand);
    }
    
    // Perform the calculation based on the operator
    if (strcmp(op, "+") == 0) {
        resultNode->type = TYPE_DOUBLE;
        resultNode->value.d = val1 + val2;
    } else if (strcmp(op, "-") == 0) {
        resultNode->type = TYPE_DOUBLE;
        resultNode->value.d = val1 - val2;
    } else if (strcmp(op, "*") == 0) {
        resultNode->type = TYPE_DOUBLE;
        resultNode->value.d = val1 * val2;
    } else if (strcmp(op, "/") == 0) {
        resultNode->type = TYPE_DOUBLE;
        resultNode->value.d = val1 / val2;
    } else if (strcmp(op, "==") == 0) {
        resultNode->type = TYPE_BOOLEAN;
        resultNode->value.b = val1 == val2;
    } else if (strcmp(op, "!=") == 0) {
        resultNode->type = TYPE_BOOLEAN;
        resultNode->value.b = val1 != val2;
    } else if (strcmp(op, "<") == 0) {
        resultNode->type = TYPE_BOOLEAN;
        resultNode->value.b = val1 < val2;
    } else if (strcmp(op, ">") == 0) {
        resultNode->type = TYPE_BOOLEAN;
        resultNode->value.b = val1 > val2;
    } else {
        // Fallback for unrecognized operator
        resultNode->type = TYPE_UNDEFINED;
    }
}


// --- Interpreter Functions ---
EMSCRIPTEN_KEEPALIVE
void initializeGraph() {
    if (nodeCount > 0) return;
    
    strcpy(nodes[nodeCount].id, "A");
    nodes[nodeCount].type = TYPE_INTEGER;
    nodes[nodeCount++].value.i = 10;
    
    strcpy(nodes[nodeCount].id, "B");
    nodes[nodeCount].type = TYPE_INTEGER;
    nodes[nodeCount++].value.i = 20;

    strcpy(nodes[nodeCount].id, "C");
    nodes[nodeCount].type = TYPE_DOUBLE;
    nodes[nodeCount++].value.d = 3.14;

    strcpy(nodes[nodeCount].id, "D");
    nodes[nodeCount].type = TYPE_BOOLEAN;
    nodes[nodeCount++].value.b = true;

    strcpy(edges[edgeCount].source, "A"); strcpy(edges[edgeCount].target, "B");
    edges[edgeCount].weight = 1.0; strcpy(edges[edgeCount++].statement, "Connect A to B");
    
    isDirected = false;
    isWeighted = true;
}

EMSCRIPTEN_KEEPALIVE
void resetGraph() {
    nodeCount = 0;
    edgeCount = 0;
    isDirected = false;
    isWeighted = false;
}

// Emscripten-exported function to update simulation forces
EMSCRIPTEN_KEEPALIVE
void updateSimulation(float canvasWidth, float canvasHeight) {
    if (nodeCount == 0) return;
    
    const float K_REPEL = 50000;
    const float K_ATTRACT = 0.5;
    const float DT = 0.5;
    const float NODE_RADIUS = 15.0;

    // Repulsion force
    for (int i = 0; i < nodeCount; i++) {
        Node* node1 = &nodes[i];
        for (int j = i + 1; j < nodeCount; j++) {
            Node* node2 = &nodes[j];
            float dx = node2->x - node1->x;
            float dy = node2->y - node1->y;
            float distance = sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                float force = K_REPEL / (distance * distance);
                float fx = force * dx / distance;
                float fy = force * dy / distance;
                node1->vx -= fx * DT;
                node1->vy -= fy * DT;
                node2->vx += fx * DT;
                node2->vy += fy * DT;
            }
        }
    }

    // Attraction force
    for (int i = 0; i < edgeCount; i++) {
        Edge* edge = &edges[i];
        int sourceIndex = findNodeIndex(edge->source);
        int targetIndex = findNodeIndex(edge->target);
        if (sourceIndex == -1 || targetIndex == -1) continue;
        
        Node* node1 = &nodes[sourceIndex];
        Node* node2 = &nodes[targetIndex];
        
        float dx = node2->x - node1->x;
        float dy = node2->y - node1->y;
        float distance = sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            float force = K_ATTRACT * distance;
            float fx = force * dx / distance;
            float fy = force * dy / distance;
            node1->vx += fx * DT;
            node1->vy += fy * DT;
            node2->vx -= fx * DT;
            node2->vy -= fy * DT;
        }
    }
    
    // Update positions and apply damping/boundary checks
    for (int i = 0; i < nodeCount; i++) {
        Node* node = &nodes[i];
        node->vx *= 0.9;
        node->vy *= 0.9;
        node->x += node->vx * DT;
        node->y += node->vy * DT;
        node->x = fmax(NODE_RADIUS, fmin(canvasWidth - NODE_RADIUS, node->x));
        node->y = fmax(NODE_RADIUS, fmin(canvasHeight - NODE_RADIUS, node->y));
    }
}

// Emscripten-exported function for the main interpreter
EMSCRIPTEN_KEEPALIVE
InterpreterResult* interpretPenCode(const char* code) {
    static InterpreterResult result;
    result.successCount = 0;
    result.errorCount = 0;
    strcpy(result.lastMessage, "");

    char codeCopy[1024];
    strcpy(codeCopy, code);
    
    char* lines[50];
    int lineCount = 0;
    char* line = strtok(codeCopy, "\n");
    while (line != NULL && lineCount < 50) {
        lines[lineCount++] = line;
        line = strtok(NULL, "\n");
    }
    
    for (int i = 0; i < lineCount; i++) {
        char lineTrimmed[256];
        int len = 0;
        char* start = lines[i];
        while (*start == ' ' || *start == '\t') start++;
        while (start[len] != '\0' && start[len] != '\r' && start[len] != '\n') len++;
        strncpy(lineTrimmed, start, len);
        lineTrimmed[len] = '\0';
        
        if (strlen(lineTrimmed) == 0 || lineTrimmed[0] == '/') continue;

        char command[20], type1[20], type2[20], arg1[NODE_ID_LENGTH], arg2[NODE_ID_LENGTH];
        
        // Handle assignment/evaluation
        char* equals = strchr(lineTrimmed, '=');
        if (equals != NULL) {
            // This is an evaluation command with an assignment
            *equals = '\0';
            char* newNodeId = lineTrimmed;
            char* expr = equals + 1;
            
            // Trim spaces
            while (*newNodeId == ' ') newNodeId++;
            while (newNodeId[strlen(newNodeId) - 1] == ' ') newNodeId[strlen(newNodeId) - 1] = '\0';
            while (*expr == ' ') expr++;

            if (findNodeIndex(newNodeId) != -1) {
                sprintf(result.lastMessage, "Error: Node '%s' already exists. Cannot create it automatically.", newNodeId);
                result.errorCount++;
                continue;
            }

            if (nodeCount >= MAX_NODES) {
                strcpy(result.lastMessage, "Error: Max node count reached.");
                result.errorCount++;
                continue;
            }
            
            // Create a temporary node to store the result
            Node tempNode;
            char* sources[MAX_NODES];
            int sourceCount = 0;
            
            evaluateExpression(expr, &tempNode, sources, &sourceCount);

            // Create the new node in the graph
            strcpy(nodes[nodeCount].id, newNodeId);
            nodes[nodeCount].x = 100 + (float)rand() / (float)RAND_MAX * 400;
            nodes[nodeCount].y = 100 + (float)rand() / (float)RAND_MAX * 200;
            strcpy(nodes[nodeCount].color, "#f1c40f"); // A distinct color for calculated nodes
            nodes[nodeCount].isTraversed = false;
            nodes[nodeCount].type = tempNode.type;
            nodes[nodeCount].value = tempNode.value;
            nodeCount++;

            // Create edges from the source nodes to the new node
            for(int j = 0; j < sourceCount; j++) {
                if (edgeCount >= MAX_EDGES) break;
                strcpy(edges[edgeCount].source, sources[j]);
                strcpy(edges[edgeCount].target, newNodeId);
                edges[edgeCount].weight = 1.0;
                strcpy(edges[edgeCount].statement, lineTrimmed);
                edgeCount++;
            }
            
            sprintf(result.lastMessage, "Created new node '%s' by evaluating '%s'.", newNodeId, expr);
            result.successCount++;
            continue;
        }

        // Handle regular commands
        sscanf(lineTrimmed, "%s %s %s %s %s", command, type1, type2, arg1, arg2);
        
        bool success = false;
        
        if (strcmp(command, "Reset") == 0) {
            resetGraph();
            strcpy(result.lastMessage, "Graph has been reset.");
            success = true;
        } else if (strcmp(command, "Set") == 0) {
            if (strcmp(type1, "Directed") == 0) {
                isDirected = (strcmp(type2, "true") == 0);
                sprintf(result.lastMessage, "Graph set to %s.", isDirected ? "directed" : "undirected");
                success = true;
            } else if (strcmp(type1, "Weighted") == 0) {
                isWeighted = (strcmp(type2, "true") == 0);
                sprintf(result.lastMessage, "Graph set to %s.", isWeighted ? "weighted" : "unweighted");
                success = true;
            } else {
                sprintf(result.lastMessage, "Invalid Set command: %s", lineTrimmed);
            }
        } else if (strcmp(command, "Create") == 0 && strcmp(type1, "Node") == 0) {
            if (nodeCount >= MAX_NODES) {
                strcpy(result.lastMessage, "Error: Max node count reached.");
            } else if (findNodeIndex(type2) != -1) {
                sprintf(result.lastMessage, "Error: Node '%s' already exists.", type2);
            } else {
                strcpy(nodes[nodeCount].id, type2);
                nodes[nodeCount].x = 100 + (float)rand() / (float)RAND_MAX * 400;
                nodes[nodeCount].y = 100 + (float)rand() / (float)RAND_MAX * 200;
                strcpy(nodes[nodeCount].color, "#4a90e2");
                nodes[nodeCount].isTraversed = false;
                
                // Determine value type and assign
                if (strcmp(arg1, "true") == 0 || strcmp(arg1, "false") == 0) {
                    nodes[nodeCount].type = TYPE_BOOLEAN;
                    nodes[nodeCount].value.b = strcmp(arg1, "true") == 0;
                } else if (strchr(arg1, '.') != NULL) {
                    nodes[nodeCount].type = TYPE_DOUBLE;
                    nodes[nodeCount].value.d = atof(arg1);
                } else if (atol(arg1) != 0 || strcmp(arg1, "0") == 0) {
                    nodes[nodeCount].type = TYPE_INTEGER;
                    nodes[nodeCount].value.i = atol(arg1);
                } else {
                    nodes[nodeCount].type = TYPE_STRING;
                    strcpy(nodes[nodeCount].value.s, arg1);
                }
                
                nodeCount++;
                sprintf(result.lastMessage, "Created node '%s'.", type2);
                success = true;
            }
        } else if (strcmp(command, "Connect") == 0 && strcmp(type2, "to") == 0) {
            if (edgeCount >= MAX_EDGES) {
                strcpy(result.lastMessage, "Error: Max edge count reached.");
            } else {
                char* statement_start = strstr(lineTrimmed, "with {");
                if (statement_start == NULL) {
                    strcpy(result.lastMessage, "Error: 'Connect' command must have a 'with' statement inside {}.");
                } else {
                    statement_start += 6; // Move past "with {"
                    char* statement_end = strchr(statement_start, '}');
                    if (statement_end == NULL) {
                        strcpy(result.lastMessage, "Error: 'Connect' statement block is missing a closing '}'.");
                    } else {
                        *statement_end = '\0';
                        while (*statement_start == ' ' || *statement_start == '\t') statement_start++;
                        
                        int sourceIndex = findNodeIndex(type1);
                        int targetIndex = findNodeIndex(arg1);
                        if (sourceIndex == -1 || targetIndex == -1) {
                            strcpy(result.lastMessage, "Error: Source or target node not found.");
                        } else {
                            strcpy(edges[edgeCount].source, type1);
                            strcpy(edges[edgeCount].target, arg1);
                            edges[edgeCount].weight = 1.0;
                            strcpy(edges[edgeCount].statement, statement_start);
                            edgeCount++;
                            sprintf(result.lastMessage, "Connected %s to %s with statement.", type1, arg1);
                            success = true;
                        }
                    }
                }
            }
        } else if (strcmp(command, "Eval") == 0) {
            char* eval_arg1 = type1;
            char* expr_start = strstr(lineTrimmed, "with {");
            if (expr_start == NULL) {
                 strcpy(result.lastMessage, "Error: 'Eval' command must have a 'with' statement inside {}.");
                 result.errorCount++;
                 continue;
            }
            expr_start += 6;
            char* expr_end = strchr(expr_start, '}');
            if (expr_end == NULL) {
                strcpy(result.lastMessage, "Error: 'Eval' statement block is missing a closing '}'.");
                result.errorCount++;
                continue;
            }
            *expr_end = '\0';
            while (*expr_start == ' ' || *expr_start == '\t') expr_start++;
            
            int nodeIndex = findNodeIndex(eval_arg1);
            if (nodeIndex == -1) {
                sprintf(result.lastMessage, "Error: Node '%s' not found.", eval_arg1);
            } else {
                char* sources[MAX_NODES];
                int sourceCount = 0;
                
                evaluateExpression(expr_start, &nodes[nodeIndex], sources, &sourceCount);

                sprintf(result.lastMessage, "Evaluated expression for node '%s'.", eval_arg1);
                success = true;
            }
        } else {
            sprintf(result.lastMessage, "Error: Invalid command '%s'.", command);
        }
        
        if (success) {
            result.successCount++;
        } else {
            result.errorCount++;
            break;
        }
    }
    
    return &result;
}
