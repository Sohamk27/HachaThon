import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  AppState, 
  UserQuery, 
  ChatMessage, 
  QueryResult, 
  DatabaseSchema
} from '../types';

interface AppStore extends AppState {
  // Actions
  setSchema: (schema: DatabaseSchema) => void;
  addUserQuery: (query: UserQuery) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setQueryResult: (result: QueryResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  clearHistory: () => void;
  clearChat: () => void;
  clearError: () => void;
  
  // Computed values
  getLastQuery: () => UserQuery | undefined;
  getRecentQueries: (limit?: number) => UserQuery[];
  getChatHistory: () => ChatMessage[];
  getQuerySuggestions: () => string[];
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSchema: undefined,
        queryHistory: [],
        chatHistory: [],
        lastResult: undefined,
        isLoading: false,
        error: undefined,

        // Actions
        setSchema: (schema: DatabaseSchema) => {
          set({ currentSchema: schema, error: undefined });
        },

        addUserQuery: (query: UserQuery) => {
          set((state) => ({
            queryHistory: [query, ...state.queryHistory.slice(0, 99)] // Keep last 100 queries
          }));
        },

        addChatMessage: (message: ChatMessage) => {
          set((state) => ({
            chatHistory: [...state.chatHistory, message]
          }));
        },

        updateChatMessage: (id: string, updates: Partial<ChatMessage>) => {
          set((state) => ({
            chatHistory: state.chatHistory.map(msg => 
              msg.id === id ? { ...msg, ...updates } : msg
            )
          }));
        },

        setQueryResult: (result: QueryResult) => {
          set({ lastResult: result, isLoading: false, error: undefined });
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | undefined) => {
          set({ error, isLoading: false });
        },

        clearHistory: () => {
          set({ queryHistory: [] });
        },

        clearChat: () => {
          set({ chatHistory: [] });
        },

        clearError: () => {
          set({ error: undefined });
        },

        // Computed values
        getLastQuery: () => {
          const { queryHistory } = get();
          return queryHistory[0];
        },

        getRecentQueries: (limit = 10) => {
          const { queryHistory } = get();
          return queryHistory.slice(0, limit);
        },

        getChatHistory: () => {
          const { chatHistory } = get();
          return chatHistory;
        },

        getQuerySuggestions: () => {
          const { queryHistory, currentSchema } = get();
          
          // Generate suggestions based on recent queries and schema
          const suggestions: string[] = [];
          
          if (currentSchema) {
            // Add common query patterns
            suggestions.push(
              "Show me all records from the users table",
              "What is the total revenue for this month?",
              "Find customers who made purchases in the last 30 days",
              "Show the top 10 products by sales",
              "Display the average order value by customer segment"
            );
            
            // Add table-specific suggestions
            currentSchema.tables.forEach(table => {
              suggestions.push(`Show all ${table.name}`);
              suggestions.push(`Count records in ${table.name}`);
            });
          }
          
          // Add suggestions based on recent queries
          const recentPatterns = queryHistory
            .slice(0, 5)
            .map(q => q.text)
            .filter(text => text.length > 10);
          
          return [...new Set([...suggestions, ...recentPatterns])].slice(0, 10);
        }
      }),
      {
        name: 'agentic-ai-store',
        partialize: (state) => ({
          queryHistory: state.queryHistory,
          chatHistory: state.chatHistory.slice(-50), // Persist only last 50 messages
          currentSchema: state.currentSchema
        })
      }
    ),
    {
      name: 'agentic-ai-store'
    }
  )
);

// Schema-specific store for caching schemas and embeddings
interface SchemaStore {
  schemas: { [id: string]: DatabaseSchema };
  embeddings: { [id: string]: number[] };
  currentSchemaId?: string;
  
  addSchema: (schema: DatabaseSchema) => void;
  setCurrentSchema: (id: string) => void;
  getSchema: (id: string) => DatabaseSchema | undefined;
  addEmbedding: (schemaId: string, embedding: number[]) => void;
  getEmbedding: (schemaId: string) => number[] | undefined;
}

export const useSchemaStore = create<SchemaStore>()(
  devtools(
    persist(
      (set, get) => ({
        schemas: {},
        embeddings: {},
        currentSchemaId: undefined,

        addSchema: (schema: DatabaseSchema) => {
          set((state) => ({
            schemas: { ...state.schemas, [schema.id]: schema },
            currentSchemaId: schema.id
          }));
        },

        setCurrentSchema: (id: string) => {
          set({ currentSchemaId: id });
        },

        getSchema: (id: string) => {
          const { schemas } = get();
          return schemas[id];
        },

        addEmbedding: (schemaId: string, embedding: number[]) => {
          set((state) => ({
            embeddings: { ...state.embeddings, [schemaId]: embedding }
          }));
        },

        getEmbedding: (schemaId: string) => {
          const { embeddings } = get();
          return embeddings[schemaId];
        }
      }),
      {
        name: 'schema-store'
      }
    ),
    {
      name: 'schema-store'
    }
  )
);
