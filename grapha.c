#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <uuid/uuid.h>

// Assuming a robust hash map library with these function signatures.
// In a real project, you would include a .h file for this library.
typedef struct hashmap hashmap_t;
extern hashmap_t* hashmap_create();
extern void* hashmap_get(hashmap_t* map, const char* key);
extern void hashmap_put(hashmap_t* map, const char* key, void* value);
extern void hashmap_remove(hashmap_t* map, const char* key);
extern void hashmap_destroy(hashmap_t* map);
extern void hashmap_free_values_and_destroy(hashmap_t* map); // For cleanup

// A simple dynamic array (vector) for the adjacency lists
typedef struct {
    void** items;
    size_t size;
    size_t capacity;
} vector_t;

vector_t* vector_create(size_t initial_capacity);
void vector_push(vector_t* vec, void* item);
void* vector_get(vector_t* vec, size_t index);
void vector_remove(vector_t* vec, size_t index);
void vector_free(vector_t* vec);

// --- Graph Structs ---

typedef struct {
    char* id;
    hashmap_t* properties;
    vector_t* labels;
} Vertex;

typedef struct {
    char* id;
    char* source_id;
    char* target_id;
    hashmap_t* properties;
    char* label;
    bool directed;
} Edge;

typedef struct {
    hashmap_t* vertices; // Maps vertex_id (char*) to Vertex*
    hashmap_t* adjacency_list; // Maps vertex_id (char*) to vector_t* of Edge*
    bool is_directed;
    bool is_weighted;
} Graph;

// --- Graph Function Definitions ---

Graph* graph_create() {
    Graph* graph = malloc(sizeof(Graph));
    graph->vertices = hashmap_create();
    graph->adjacency_list = hashmap_create();
    graph->is_directed = false;
    graph->is_weighted = false;
    return graph;
}

void graph_add_vertex(Graph* graph, const char* vertex_id) {
    if (hashmap_get(graph->vertices, vertex_id) != NULL) {
        return; // Vertex already exists
    }

    Vertex* new_vertex = malloc(sizeof(Vertex));
    new_vertex->id = strdup(vertex_id);
    new_vertex->properties = hashmap_create();
    new_vertex->labels = vector_create(4);

    hashmap_put(graph->vertices, new_vertex->id, new_vertex);
    hashmap_put(graph->adjacency_list, new_vertex->id, vector_create(8));
}

void graph_add_edge(Graph* graph, const char* source_id, const char* target_id, bool directed, double weight, const char* label) {
    // Check if vertices exist
    if (hashmap_get(graph->vertices, source_id) == NULL || hashmap_get(graph->vertices, target_id) == NULL) {
        return;
    }

    // Allocate and initialize new edge
    Edge* new_edge = malloc(sizeof(Edge));
    uuid_t edge_uuid;
    uuid_generate_random(edge_uuid);
    char uuid_str[37];
    uuid_unparse_lower(edge_uuid, uuid_str);
    new_edge->id = strdup(uuid_str);
    new_edge->source_id = strdup(source_id);
    new_edge->target_id = strdup(target_id);
    new_edge->label = strdup(label);
    new_edge->directed = directed;
    new_edge->properties = hashmap_create();
    hashmap_put(new_edge->properties, "weight", &weight); // store weight in properties

    // Add to adjacency list of source
    vector_t* source_adj = (vector_t*)hashmap_get(graph->adjacency_list, source_id);
    vector_push(source_adj, new_edge);

    // If undirected, add to adjacency list of target
    if (!directed) {
        Edge* reverse_edge = malloc(sizeof(Edge));
        // Note: In a real implementation, you'd share the same Edge object
        // with two different "views" to save memory.
        *reverse_edge = *new_edge; // Shallow copy
        reverse_edge->directed = false;
        
        vector_t* target_adj = (vector_t*)hashmap_get(graph->adjacency_list, target_id);
        vector_push(target_adj, reverse_edge);
    }
}

// Memory-safe destruction and cleanup
void graph_destroy(Graph* graph) {
    // First, free all edge vectors and their contents
    vector_t* all_edges_to_free = vector_create(1);
    const char* key;
    hashmap_foreach_key_start(graph->adjacency_list, key) {
        vector_t* adj_list = (vector_t*)hashmap_get(graph->adjacency_list, key);
        for (size_t i = 0; i < adj_list->size; ++i) {
            Edge* edge = (Edge*)vector_get(adj_list, i);
            // Only free the edge if it's the primary one (i.e., not a reverse edge)
            if (strcmp(edge->source_id, key) == 0) {
                vector_push(all_edges_to_free, edge);
            }
        }
        vector_free(adj_list);
    } hashmap_foreach_key_end();

    for(size_t i = 0; i < all_edges_to_free->size; ++i) {
        Edge* edge = (Edge*)vector_get(all_edges_to_free, i);
        free(edge->id);
        free(edge->source_id);
        free(edge->target_id);
        free(edge->label);
        hashmap_destroy(edge->properties);
        free(edge);
    }
    vector_free(all_edges_to_free);

    // Then, free all vertices and their properties
    hashmap_foreach_key_start(graph->vertices, key) {
        Vertex* vertex = (Vertex*)hashmap_get(graph->vertices, key);
        free(vertex->id);
        hashmap_destroy(vertex->properties);
        vector_free(vertex->labels);
        free(vertex);
    } hashmap_foreach_key_end();

    // Finally, free the hash maps themselves
    hashmap_destroy(graph->vertices);
    hashmap_destroy(graph->adjacency_list);
    free(graph);
}
