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

// Default configuration for the AI service
const DEFAULT_CONFIG: AIServiceConfig = {
  apiEndpoint: 'http://localhost:8000/api',
  model: 'gpt-4',
  maxTokens: 2048,
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
      const response = await axios.post(`${this.config.apiEndpoint}/parse-intent`, {
        query,
        model: this.config.model,
        temperature: this.config.temperature
      });

      const intent: QueryIntent = response.data;
      
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
      const response = await axios.post(`${this.config.apiEndpoint}/extract-entities`, {
        query,
        schema,
        model: this.config.model
      });

      const entities: Entity[] = response.data;
      
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
      const response = await axios.post(`${this.config.apiEndpoint}/generate-sql`, {
        query: query.text,
        intent: query.intent,
        entities: query.entities,
        schema,
        context,
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const generatedSQL: GeneratedSQL = {
        id: crypto.randomUUID(),
        ...response.data
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
  async executeSQL(sql: GeneratedSQL, schema: DatabaseSchema): Promise<QueryResult> {
    try {
      const response = await axios.post(`${this.config.apiEndpoint}/execute-sql`, {
        sql: sql.query,
        schemaId: schema.id,
        timeout: 30000 // 30 seconds timeout
      });

      const result: QueryResult = {
        id: crypto.randomUUID(),
        ...response.data,
        executionTime: response.data.executionTime || 0,
        status: response.data.error ? 'error' : 'success'
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
    schema: DatabaseSchema, 
    queryHistory: UserQuery[]
  ): Promise<string[]> {
    try {
      const response = await axios.post(`${this.config.apiEndpoint}/get-suggestions`, {
        schema,
        queryHistory: queryHistory.slice(0, 5), // Last 5 queries
        model: this.config.model
      });

      return response.data.suggestions || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      
      // Fallback suggestions
      return this.getFallbackSuggestions(schema);
    }
  }

  // Upload and analyze database schema
  async uploadSchema(schemaFile: File): Promise<DatabaseSchema> {
    const formData = new FormData();
    formData.append('schema', schemaFile);

    try {
      const response = await axios.post(`${this.config.apiEndpoint}/upload-schema`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading schema:', error);
      throw new Error('Failed to upload and analyze schema');
    }
  }

  // Generate schema embeddings for better matching
  async generateSchemaEmbedding(schema: DatabaseSchema): Promise<number[]> {
    try {
      const response = await axios.post(`${this.config.apiEndpoint}/embed-schema`, {
        schema,
        model: 'text-embedding-ada-002'
      });

      return response.data.embedding;
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
