#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

// --- Data Structures for the Graph ---

// Enum for the types of operations on an edge.
typedef enum {
    OP_ADD,
    OP_SUB,
    OP_MUL,
    OP_DIV,
    OP_MOD,
    OP_INC,
    OP_DEC,
    OP_EQUALS,
    OP_UNKNOWN
} EdgeOperation;

// Enum for the data types a node can hold.
typedef enum {
    TYPE_INT,
    TYPE_DOUBLE,
    TYPE_STRING,
    TYPE_UNKNOWN
} ValueType;

// A node represents a data container in the graph.
typedef struct {
    char* name;
    ValueType value_type;
    union {
        int int_value;
        double double_value;
        char* string_value;
    } value;
    int is_output;
} Node;

// An edge represents an operation and the flow between nodes.
typedef struct {
    char* from_node_name;
    char* to_node_name;
    EdgeOperation operation;
    char* function_name;
} Edge;

// --- Global State for the Graph and Lexer/Parser ---

Node* nodes = NULL;
int num_nodes = 0;
Edge* edges = NULL;
int num_edges = 0;

typedef enum {
    TOKEN_KEYWORD,
    TOKEN_PUNCTUATION,
    TOKEN_NUMBER,
    TOKEN_STRING_LITERAL,
    TOKEN_IDENTIFIER,
    TOKEN_EOF,
    TOKEN_UNKNOWN
} TokenType;

typedef struct {
    TokenType type;
    char* value;
} Token;

Token* tokens = NULL;
int token_count = 0;
int current_token_index = 0;

// --- Lexer (Tokenizer) Functions ---

void tokenize(const char* input) {
    if (tokens) {
        for (int i = 0; i < token_count; i++) {
            free(tokens[i].value);
        }
        free(tokens);
        tokens = NULL;
    }
    token_count = 0;
    current_token_index = 0;

    const char* p = input;
    while (*p) {
        if (isspace((unsigned char)*p)) { p++; continue; }
        if (*p == '/' && *(p+1) == '/') { while (*p && *p != '\n') { p++; } continue; }
        
        const char* keywords[] = {"node", "edge", "output", "true", "false", "type", "int", "double", "string"};
        int is_keyword = 0;
        for (int i = 0; i < 9; ++i) {
            int len = strlen(keywords[i]);
            if (strncmp(p, keywords[i], len) == 0 && !isalnum((unsigned char)p[len])) {
                tokens = (Token*)realloc(tokens, (++token_count) * sizeof(Token));
                tokens[token_count - 1].type = TOKEN_KEYWORD;
                tokens[token_count - 1].value = strdup(keywords[i]);
                p += len;
                is_keyword = 1;
                break;
            }
        }
        if (is_keyword) continue;

        if (*p == '{' || *p == '}' || *p == '(' || *p == ')' || *p == ':' || *p == ',' || *p == '>' || *p == '=' || *p == '+' || *p == '-' || *p == '*' || *p == '/' || *p == '%') {
            tokens = (Token*)realloc(tokens, (++token_count) * sizeof(Token));
            tokens[token_count - 1].type = TOKEN_PUNCTUATION;
            tokens[token_count - 1].value = (char*)malloc(2);
            tokens[token_count - 1].value[0] = *p;
            tokens[token_count - 1].value[1] = '\0';
            p++;
            continue;
        }

        if (isdigit((unsigned char)*p) || (*p == '-' && isdigit((unsigned char)p[1]))) {
            const char* start = p;
            p++;
            while (isdigit((unsigned char)*p) || *p == '.') { p++; }
            int len = p - start;
            tokens = (Token*)realloc(tokens, (++token_count) * sizeof(Token));
            tokens[token_count - 1].type = TOKEN_NUMBER;
            tokens[token_count - 1].value = (char*)malloc(len + 1);
            strncpy(tokens[token_count - 1].value, start, len);
            tokens[token_count - 1].value[len] = '\0';
            continue;
        }

        if (*p == '\'' || *p == '"') {
            char quote_char = *p;
            const char* start = ++p;
            while (*p && *p != quote_char) { p++; }
            if (*p) {
                int len = p - start;
                tokens = (Token*)realloc(tokens, (++token_count) * sizeof(Token));
                tokens[token_count - 1].type = TOKEN_STRING_LITERAL;
                tokens[token_count - 1].value = (char*)malloc(len + 1);
                strncpy(tokens[token_count - 1].value, start, len);
                tokens[token_count - 1].value[len] = '\0';
                p++;
                continue;
            }
        }

        if (isalpha((unsigned char)*p) || *p == '_') {
            const char* start = p;
            while (isalnum((unsigned char)*p) || *p == '_') { p++; }
            int len = p - start;
            tokens = (Token*)realloc(tokens, (++token_count) * sizeof(Token));
            tokens[token_count - 1].type = TOKEN_IDENTIFIER;
            tokens[token_count - 1].value = (char*)malloc(len + 1);
            strncpy(tokens[token_count - 1].value, start, len);
            tokens[token_count - 1].value[len] = '\0';
            continue;
        }

        tokens = (Token*)realloc(tokens, (++token_count) * sizeof(Token));
        tokens[token_count - 1].type = TOKEN_UNKNOWN;
        tokens[token_count - 1].value = (char*)malloc(2);
        tokens[token_count - 1].value[0] = *p;
        tokens[token_count - 1].value[1] = '\0';
        p++;
    }
    tokens = (Token*)realloc(tokens, (token_count + 1) * sizeof(Token));
    tokens[token_count].type = TOKEN_EOF;
    tokens[token_count].value = NULL;
}

// --- Parser Functions ---

Token* peek() {
    if (current_token_index >= token_count) { return NULL; }
    return &tokens[current_token_index];
}

Token* consume() {
    if (current_token_index >= token_count) { return NULL; }
    return &tokens[current_token_index++];
}

Token* expect_token(const char* expected_value) {
    Token* token = consume();
    if (!token || strcmp(token->value, expected_value) != 0) {
        fprintf(stderr, "Parsing error: Expected '%s', but got '%s'\n", expected_value, token ? token->value : "EOF");
        return NULL;
    }
    return token;
}

void parse_node() {
    expect_token("node");
    expect_token("{");
    
    char* name = NULL;
    ValueType type = TYPE_UNKNOWN;
    int is_output = 0;
    
    Node temp_node;
    temp_node.value_type = TYPE_UNKNOWN;

    while (peek() && strcmp(peek()->value, "}") != 0) {
        Token* key = consume();
        if (strcmp(key->value, "name") == 0) {
            expect_token(":");
            Token* name_token = consume();
            if (name_token && name_token->type == TOKEN_IDENTIFIER) {
                name = strdup(name_token->value);
            }
        } else if (strcmp(key->value, "type") == 0) {
            expect_token(":");
            Token* type_token = consume();
            if (strcmp(type_token->value, "int") == 0) { type = TYPE_INT; }
            else if (strcmp(type_token->value, "double") == 0) { type = TYPE_DOUBLE; }
            else if (strcmp(type_token->value, "string") == 0) { type = TYPE_STRING; }
        } else if (strcmp(key->value, "value") == 0) {
            expect_token(":");
            Token* value_token = consume();
            if (type == TYPE_INT) { temp_node.value.int_value = atoi(value_token->value); }
            else if (type == TYPE_DOUBLE) { temp_node.value.double_value = atof(value_token->value); }
            else if (type == TYPE_STRING) { temp_node.value.string_value = strdup(value_token->value); }
            else { fprintf(stderr, "Parsing error: 'type' must be specified before 'value'\n"); }
        } else if (strcmp(key->value, "is_output") == 0) {
            expect_token(":");
            is_output = (strcmp(consume()->value, "true") == 0);
        }
        if (peek() && strcmp(peek()->value, ",") == 0) {
            consume();
        }
    }
    expect_token("}");

    if (name) {
        nodes = (Node*)realloc(nodes, (++num_nodes) * sizeof(Node));
        nodes[num_nodes - 1].name = name;
        nodes[num_nodes - 1].value_type = type;
        if (type == TYPE_INT) { nodes[num_nodes - 1].value.int_value = temp_node.value.int_value; }
        else if (type == TYPE_DOUBLE) { nodes[num_nodes - 1].value.double_value = temp_node.value.double_value; }
        else if (type == TYPE_STRING) { nodes[num_nodes - 1].value.string_value = temp_node.value.string_value; }
        nodes[num_nodes - 1].is_output = is_output;
    } else {
        fprintf(stderr, "Parsing error: Node must have a name\n");
    }
}

void parse_edge() {
    expect_token("edge");
    expect_token("{");

    char* from_node_name = NULL;
    char* to_node_name = NULL;
    char* op_str = NULL;
    
    while (peek() && strcmp(peek()->value, "}") != 0) {
        Token* key = consume();
        if (strcmp(key->value, "from") == 0) {
            expect_token(":");
            from_node_name = strdup(consume()->value);
        } else if (strcmp(key->value, "to") == 0) {
            expect_token(":");
            to_node_name = strdup(consume()->value);
        } else if (strcmp(key->value, "op") == 0) {
            expect_token(":");
            op_str = strdup(consume()->value);
        }
        if (peek() && strcmp(peek()->value, ",") == 0) {
            consume();
        }
    }
    expect_token("}");

    if (from_node_name && to_node_name && op_str) {
        edges = (Edge*)realloc(edges, (++num_edges) * sizeof(Edge));
        edges[num_edges - 1].from_node_name = from_node_name;
        edges[num_edges - 1].to_node_name = to_node_name;
        
        if (strcmp(op_str, "+") == 0) { edges[num_edges - 1].operation = OP_ADD; }
        else if (strcmp(op_str, "-") == 0) { edges[num_edges - 1].operation = OP_SUB; }
        else if (strcmp(op_str, "*") == 0) { edges[num_edges - 1].operation = OP_MUL; }
        else if (strcmp(op_str, "/") == 0) { edges[num_edges - 1].operation = OP_DIV; }
        else if (strcmp(op_str, "%") == 0) { edges[num_edges - 1].operation = OP_MOD; }
        else if (strcmp(op_str, "++") == 0) { edges[num_edges - 1].operation = OP_INC; }
        else if (strcmp(op_str, "--") == 0) { edges[num_edges - 1].operation = OP_DEC; }
        else if (strcmp(op_str, "==") == 0) { edges[num_edges - 1].operation = OP_EQUALS; }
        else { edges[num_edges - 1].operation = OP_UNKNOWN; }
        
        edges[num_edges - 1].function_name = op_str;
    } else {
        fprintf(stderr, "Parsing error: Edge must have from, to, and op properties.\n");
    }
}

void parse_program() {
    while (peek() && peek()->type != TOKEN_EOF) {
        if (strcmp(peek()->value, "node") == 0) {
            parse_node();
        } else if (strcmp(peek()->value, "edge") == 0) {
            parse_edge();
        } else {
            fprintf(stderr, "Parsing error: Unexpected token '%s'\n", peek()->value);
            consume();
        }
    }
}

Node* find_node(const char* name) {
    for (int i = 0; i < num_nodes; ++i) {
        if (strcmp(nodes[i].name, name) == 0) {
            return &nodes[i];
        }
    }
    return NULL;
}

// The core execution engine for the graph
void execute_graph() {
    for (int i = 0; i < num_edges; ++i) {
        Edge current_edge = edges[i];
        Node* from = find_node(current_edge.from_node_name);
        Node* to = find_node(current_edge.to_node_name);

        if (!from || !to) {
            fprintf(stderr, "Execution error: Node not found for edge from '%s' to '%s'\n", current_edge.from_node_name, current_edge.to_node_name);
            continue;
        }

        switch (current_edge.operation) {
            case OP_ADD: {
                if (from->value_type == TYPE_STRING || to->value_type == TYPE_STRING) {
                    // String concatenation
                    char* result_str;
                    if (from->value_type == TYPE_STRING && to->value_type == TYPE_STRING) {
                        int len = strlen(from->value.string_value) + strlen(to->value.string_value) + 1;
                        result_str = (char*)malloc(len);
                        strcpy(result_str, from->value.string_value);
                        strcat(result_str, to->value.string_value);
                    } else if (from->value_type == TYPE_STRING) {
                        char temp_str[100]; // Buffer for number
                        sprintf(temp_str, (to->value_type == TYPE_INT) ? "%d" : "%f", (to->value_type == TYPE_INT) ? to->value.int_value : to->value.double_value);
                        int len = strlen(from->value.string_value) + strlen(temp_str) + 1;
                        result_str = (char*)malloc(len);
                        strcpy(result_str, from->value.string_value);
                        strcat(result_str, temp_str);
                    } else { // to is a string
                         char temp_str[100]; // Buffer for number
                        sprintf(temp_str, (from->value_type == TYPE_INT) ? "%d" : "%f", (from->value_type == TYPE_INT) ? from->value.int_value : from->value.double_value);
                        int len = strlen(temp_str) + strlen(to->value.string_value) + 1;
                        result_str = (char*)malloc(len);
                        strcpy(result_str, temp_str);
                        strcat(result_str, to->value.string_value);
                    }
                    if (to->value_type == TYPE_STRING && to->value.string_value) free(to->value.string_value);
                    to->value_type = TYPE_STRING;
                    to->value.string_value = result_str;
                } else {
                    // Numeric addition
                    double from_val = (from->value_type == TYPE_INT) ? (double)from->value.int_value : from->value.double_value;
                    double to_val = (to->value_type == TYPE_INT) ? (double)to->value.int_value : to->value.double_value;
                    if (to->value_type == TYPE_INT && from->value_type == TYPE_INT) {
                        to->value.int_value = (int)(from_val + to_val);
                    } else {
                        to->value_type = TYPE_DOUBLE;
                        to->value.double_value = from_val + to_val;
                    }
                }
                break;
            }
            case OP_MUL: {
                if (from->value_type == TYPE_STRING || to->value_type == TYPE_STRING) {
                    char* string_to_repeat = (from->value_type == TYPE_STRING) ? from->value.string_value : to->value.string_value;
                    double repeat_count = (from->value_type == TYPE_STRING) ? (to->value_type == TYPE_INT) ? (double)to->value.int_value : to->value.double_value : (from->value_type == TYPE_INT) ? (double)from->value.int_value : from->value.double_value;
                    
                    if (to->value_type == TYPE_STRING && to->value.string_value) free(to->value.string_value);
                    
                    int initial_len = strlen(string_to_repeat);
                    int total_len = initial_len * (int)repeat_count + 1;
                    char* result_str = (char*)malloc(total_len);
                    result_str[0] = '\0';
                    for (int j = 0; j < (int)repeat_count; j++) {
                        strcat(result_str, string_to_repeat);
                    }
                    to->value_type = TYPE_STRING;
                    to->value.string_value = result_str;
                } else {
                    // Numeric multiplication
                    double from_val = (from->value_type == TYPE_INT) ? (double)from->value.int_value : from->value.double_value;
                    double to_val = (to->value_type == TYPE_INT) ? (double)to->value.int_value : to->value.double_value;
                    if (to->value_type == TYPE_INT && from->value_type == TYPE_INT) {
                        to->value.int_value = (int)(from_val * to_val);
                    } else {
                        to->value_type = TYPE_DOUBLE;
                        to->value.double_value = from_val * to_val;
                    }
                }
                break;
            }
            // For other operations, handle only numeric types and give errors for strings
            case OP_SUB:
            case OP_DIV:
            case OP_MOD:
            case OP_INC:
            case OP_DEC:
            case OP_EQUALS:
                if (from->value_type == TYPE_STRING || to->value_type == TYPE_STRING) {
                    fprintf(stderr, "Execution Error: Cannot perform numeric operation on a string value.\n");
                    continue;
                }
                double from_val = (from->value_type == TYPE_INT) ? (double)from->value.int_value : from->value.double_value;
                double to_val = (to->value_type == TYPE_INT) ? (double)to->value.int_value : to->value.double_value;
                switch (current_edge.operation) {
                    case OP_SUB: to->value.double_value = to_val - from_val; break;
                    case OP_DIV: to->value.double_value = (from_val != 0) ? to_val / from_val : 0; break;
                    case OP_MOD: to->value.int_value = (int)to_val % (int)from_val; break;
                    case OP_INC: to->value.double_value = to_val + 1; break;
                    case OP_DEC: to->value.double_value = to_val - 1; break;
                    case OP_EQUALS: to->value.int_value = (to_val == from_val) ? 1 : 0; break;
                    default: break;
                }
                if (to->value_type == TYPE_INT && from->value_type == TYPE_INT) {
                     // Keep type as int if both were int
                } else {
                    to->value_type = TYPE_DOUBLE;
                }
                break;
            default:
                fprintf(stderr, "Execution Error: Unknown operation '%s'\n", current_edge.function_name);
                break;
        }
    }
}

// --- Main function for demonstration ---
int main() {
    const char* sample_code = 
        "// Graph program demonstrating mixed data types\n"
        "node { name: firstName, type: string, value: 'John' }\n"
        "node { name: lastName, type: string, value: 'Doe' }\n"
        "node { name: numberA, type: double, value: 3.14 }\n"
        "node { name: numberB, type: int, value: 5 }\n"
        "node { name: repeatCount, type: int, value: 3 }\n"
        "node { name: temp, type: string, value: '' }\n"
        "node { name: temp_num, type: double, value: 0.0 }\n"
        "node { name: final_string, is_output: true, type: string, value: '' }\n"
        "node { name: final_number, is_output: true, type: double, value: 0.0 }\n"

        "// String Concatenation\n"
        "edge { from: firstName, to: temp, op: '+' }\n"
        "edge { from: temp, to: temp, op: '+' }\n" // Adds a space
        "edge { from: lastName, to: temp, op: '+' }\n"

        "// String Multiplication\n"
        "edge { from: temp, to: final_string, op: '*' }\n"
        "edge { from: repeatCount, to: final_string, op: '*' }\n"

        "// Numeric Operations (with type promotion)\n"
        "edge { from: numberA, to: temp_num, op: '+' }\n"
        "edge { from: numberB, to: temp_num, op: '+' }\n"
        "edge { from: temp_num, to: final_number, op: '*' }\n"
        "edge { from: numberB, to: final_number, op: '*' }\n"
    ;

    tokenize(sample_code);
    parse_program();

    printf("Executing the graph...\n");
    execute_graph();
    
    // Find the output node and print its final value
    Node* final_string_node = find_node("final_string");
    Node* final_number_node = find_node("final_number");
    
    if (final_string_node) {
        printf("Final value of 'final_string' node is: '%s'\n", final_string_node->value.string_value);
    }
    if (final_number_node) {
        printf("Final value of 'final_number' node is: %.2f\n", final_number_node->value.double_value);
    }

    // Cleanup
    for (int i = 0; i < num_nodes; ++i) {
        free(nodes[i].name);
        if (nodes[i].value_type == TYPE_STRING && nodes[i].value.string_value) {
            free(nodes[i].value.string_value);
        }
    }
    free(nodes);
    for (int i = 0; i < num_edges; ++i) {
        free(edges[i].from_node_name);
        free(edges[i].to_node_name);
        free(edges[i].
