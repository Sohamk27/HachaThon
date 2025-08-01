import axios from 'axios';
import type { 
  UserQuery, 
  QueryIntent, 
  Entity, 
  GeneratedSQL, 
  QueryResult, 
  DatabaseSchema,
  AIServiceConfig
} from '../types';

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Default configuration for the AI service
const DEFAULT_CONFIG: AIServiceConfig = {
  apiEndpoint: API_BASE_URL,
  model: 'gpt-4-turbo-preview',
  maxTokens: 1000,
  temperature: 0.1,
  enableCaching: true
};

class AIService {
  private config: AIServiceConfig;
  private cache: Map<string, any> = new Map();

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Update configuration
  updateConfig(config: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Parse user intent from natural language query
  async parseIntent(query: string): Promise<QueryIntent> {
    const cacheKey = `intent:${query}`;
    
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.post(`${this.config.apiEndpoint}/nlp/parse-intent`, {
        query,
        context: {}
      });

      const intent: QueryIntent = {
        type: response.data.intent.toLowerCase() as any,
        confidence: response.data.confidence,
        description: response.data.explanation || `Detected ${response.data.intent} operation`
      };
      
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, intent);
      }

      return intent;
    } catch (error) {
      console.error('Error parsing intent:', error);
      
      // Fallback intent parsing
      return this.fallbackParseIntent(query);
    }
  }

  // Extract entities from query
  async extractEntities(query: string, schema?: DatabaseSchema): Promise<Entity[]> {
    const cacheKey = `entities:${query}:${schema?.id || 'no-schema'}`;
    
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.post(`${this.config.apiEndpoint}/nlp/extract-entities`, {
        query,
        schema_context: schema ? this.formatSchemaForAPI(schema) : null
      });

      const entities: Entity[] = response.data.entities.map((entity: any) => ({
        type: entity.type.toLowerCase(),
        value: entity.value,
        confidence: entity.confidence,
        position: {
          start: entity.position || 0,
          end: (entity.position || 0) + entity.value.length
        }
      }));
      
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, entities);
      }

      return entities;
    } catch (error) {
      console.error('Error extracting entities:', error);
      
      // Fallback entity extraction
      return this.fallbackExtractEntities(query, schema);
    }
  }

  // Generate SQL from natural language query
  async generateSQL(
    query: UserQuery, 
    schema: DatabaseSchema, 
    context?: any
  ): Promise<GeneratedSQL> {
    const cacheKey = `sql:${query.text}:${schema.id}:${JSON.stringify(context)}`;
    
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.post(`${this.config.apiEndpoint}/nlp/generate-sql`, {
        query: query.text,
        schema_context: this.formatSchemaForAPI(schema),
        conversation_history: context?.previousQueries?.map((q: string) => ({ query: q })) || [],
        user_preferences: context?.preferences || {}
      });

      const generatedSQL: GeneratedSQL = {
        id: crypto.randomUUID(),
        query: response.data.sql_query,
        explanation: response.data.explanation,
        confidence: response.data.confidence,
        warnings: response.data.suggested_modifications || []
      };
      
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, generatedSQL);
      }

      return generatedSQL;
    } catch (error) {
      console.error('Error generating SQL:', error);
      throw new Error('Failed to generate SQL query');
    }
  }

  // Execute SQL query safely
  async executeSQL(sql: GeneratedSQL, schema: DatabaseSchema, userId: string = 'anonymous'): Promise<QueryResult> {
    try {
      const response = await axios.post(`${this.config.apiEndpoint}/query/execute`, {
        sql_query: sql.query,
        parameters: {},
        user_id: userId,
        dry_run: false
      });

      const result: QueryResult = {
        id: crypto.randomUUID(),
        data: response.data.data || [],
        columns: response.data.columns?.map((col: any) => ({
          name: col,
          type: 'string',
          nullable: true
        })) || [],
        rowCount: response.data.row_count || 0,
        executionTime: response.data.execution_time || 0,
        status: response.data.success ? 'success' : 'error',
        error: response.data.success ? undefined : 'Query execution failed'
      };

      return result;
    } catch (error) {
      console.error('Error executing SQL:', error);
      
      return {
        id: crypto.randomUUID(),
        data: [],
        columns: [],
        rowCount: 0,
        executionTime: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get query suggestions based on schema and history
  async getSuggestions(
    partialQuery: string,
    schema: DatabaseSchema, 
    queryHistory: UserQuery[] = []
  ): Promise<string[]> {
    try {
      const response = await axios.post(`${this.config.apiEndpoint}/suggestions`, {
        partial_query: partialQuery,
        schema_context: this.formatSchemaForAPI(schema),
        user_history: queryHistory.slice(-5).map(q => ({ query: q.text, timestamp: q.timestamp }))
      });

      return response.data.suggestions?.map((s: any) => s.text) || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      
      // Fallback suggestions
      return this.getFallbackSuggestions(schema);
    }
  }

  // Upload and analyze database schema
  async uploadSchema(schemaFile: File): Promise<DatabaseSchema> {
    const formData = new FormData();
    formData.append('file', schemaFile);

    try {
      const response = await axios.post(`${this.config.apiEndpoint}/schema/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Convert backend response to frontend schema format
      return this.convertBackendSchemaToFrontend(response.data);
    } catch (error) {
      console.error('Error uploading schema:', error);
      throw new Error('Failed to upload and analyze schema');
    }
  }

  // Get schema information
  async getSchemaInfo(schemaId?: string): Promise<DatabaseSchema> {
    try {
      const response = await axios.get(`${this.config.apiEndpoint}/schema/info`, {
        params: schemaId ? { schema_id: schemaId } : {}
      });

      return this.convertBackendSchemaToFrontend(response.data);
    } catch (error) {
      console.error('Error fetching schema info:', error);
      throw new Error('Failed to fetch schema information');
    }
  }

  // Chat with AI assistant
  async sendChatMessage(
    message: string,
    userId: string,
    conversationId?: string,
    context?: any
  ): Promise<{ message: string; type: string; actions: any[] }> {
    try {
      const response = await axios.post(`${this.config.apiEndpoint}/chat/message`, {
        message,
        user_id: userId,
        conversation_id: conversationId,
        context
      });

      return {
        message: response.data.message,
        type: response.data.message_type,
        actions: response.data.suggested_actions || []
      };
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw new Error('Failed to send message');
    }
  }

  // Format schema for API consumption
  private formatSchemaForAPI(schema: DatabaseSchema) {
    return {
      schema_id: schema.id,
      schema_name: schema.name,
      tables: schema.tables.map(table => ({
        name: table.name,
        columns: table.columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          primary_key: col.primaryKey,
          foreign_key: col.foreignKey ? {
            referenced_table: col.foreignKey.referencedTable,
            referenced_column: col.foreignKey.referencedColumn
          } : null
        }))
      })),
      relationships: schema.relationships.map(rel => ({
        from_table: rel.fromTable,
        to_table: rel.toTable,
        relationship_type: rel.type
      }))
    };
  }

  // Convert backend schema response to frontend format
  private convertBackendSchemaToFrontend(backendSchema: any): DatabaseSchema {
    return {
      id: backendSchema.schema_id || crypto.randomUUID(),
      name: backendSchema.schema_name || 'Database Schema',
      tables: backendSchema.tables?.map((table: any) => ({
        id: crypto.randomUUID(),
        name: table.name,
        columns: table.columns?.map((col: any) => ({
          id: crypto.randomUUID(),
          name: col.name,
          type: col.type,
          nullable: col.nullable !== false,
          primaryKey: col.primary_key || false,
          foreignKey: col.foreign_key ? {
            referencedTable: col.foreign_key.referenced_table,
            referencedColumn: col.foreign_key.referenced_column
          } : undefined
        })) || []
      })) || [],
      relationships: backendSchema.relationships?.map((rel: any) => ({
        id: crypto.randomUUID(),
        fromTable: rel.from_table,
        toTable: rel.to_table,
        type: rel.relationship_type
      })) || []
    };
  }

  // Generate schema embeddings for better matching
  async generateSchemaEmbedding(schema: DatabaseSchema): Promise<number[]> {
    try {
      const response = await axios.post(`${this.config.apiEndpoint}/schema/generate-embedding`, {
        schema: this.formatSchemaForAPI(schema)
      });

      return response.data.embedding || [];
    } catch (error) {
      console.error('Error generating schema embedding:', error);
      return [];
    }
  }

  // Fallback methods for offline functionality
  private fallbackParseIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('show') || lowerQuery.includes('select') || lowerQuery.includes('get')) {
      return { type: 'select', confidence: 0.7, description: 'Data retrieval query' };
    }
    
    if (lowerQuery.includes('count') || lowerQuery.includes('sum') || lowerQuery.includes('average')) {
      return { type: 'aggregate', confidence: 0.7, description: 'Aggregation query' };
    }
    
    if (lowerQuery.includes('filter') || lowerQuery.includes('where') || lowerQuery.includes('find')) {
      return { type: 'filter', confidence: 0.7, description: 'Filtering query' };
    }
    
    return { type: 'select', confidence: 0.5, description: 'General query' };
  }

  private fallbackExtractEntities(query: string, schema?: DatabaseSchema): Entity[] {
    const entities: Entity[] = [];
    const words = query.toLowerCase().split(/\s+/);
    
    if (schema) {
      // Find table names in query
      schema.tables.forEach(table => {
        const tableIndex = words.indexOf(table.name.toLowerCase());
        if (tableIndex !== -1) {
          entities.push({
            type: 'table',
            value: table.name,
            confidence: 0.8,
            position: { start: tableIndex, end: tableIndex + 1 }
          });
        }
        
        // Find column names
        table.columns.forEach(column => {
          const columnIndex = words.indexOf(column.name.toLowerCase());
          if (columnIndex !== -1) {
            entities.push({
              type: 'column',
              value: column.name,
              confidence: 0.7,
              position: { start: columnIndex, end: columnIndex + 1 }
            });
          }
        });
      });
    }
    
    return entities;
  }

  private getFallbackSuggestions(schema: DatabaseSchema): string[] {
    const suggestions: string[] = [];
    
    // Generate basic suggestions based on schema
    schema.tables.forEach(table => {
      suggestions.push(`Show all records from ${table.name}`);
      suggestions.push(`Count total records in ${table.name}`);
      
      if (table.columns.length > 0) {
        suggestions.push(`Show ${table.columns[0].name} from ${table.name}`);
      }
    });
    
    return suggestions.slice(0, 10);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
