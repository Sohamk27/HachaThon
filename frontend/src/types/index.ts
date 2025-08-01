// Core types for the agentic AI service

export interface DatabaseSchema {
  id: string;
  name: string;
  tables: Table[];
  relationships: Relationship[];
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  description?: string;
}

export interface Column {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: ForeignKey;
  description?: string;
}

export interface ForeignKey {
  referencedTable: string;
  referencedColumn: string;
}

export interface Relationship {
  id: string;
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface UserQuery {
  id: string;
  text: string;
  timestamp: Date;
  intent?: QueryIntent;
  entities?: Entity[];
  context?: QueryContext;
}

export interface QueryIntent {
  type: 'select' | 'aggregate' | 'filter' | 'join' | 'update' | 'delete' | 'create';
  confidence: number;
  description: string;
}

export interface Entity {
  type: 'table' | 'column' | 'value' | 'operator' | 'function';
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

export interface QueryContext {
  previousQueries: string[];
  selectedTables: string[];
  appliedFilters: Filter[];
  sortOrder?: SortOrder;
}

export interface Filter {
  column: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
  value: any;
}

export interface SortOrder {
  column: string;
  direction: 'asc' | 'desc';
}

export interface GeneratedSQL {
  id: string;
  query: string;
  explanation: string;
  confidence: number;
  estimatedRows?: number;
  executionTime?: number;
  warnings?: string[];
}

export interface QueryResult {
  id: string;
  data: any[];
  columns: ResultColumn[];
  rowCount: number;
  executionTime: number;
  status: 'success' | 'error' | 'warning';
  error?: string;
  metadata?: QueryMetadata;
}

export interface ResultColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface QueryMetadata {
  tablesUsed: string[];
  indexesUsed: string[];
  cacheable: boolean;
  cost: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  query?: UserQuery;
  sqlResult?: GeneratedSQL;
  dataResult?: QueryResult;
  suggestions?: string[];
}

export interface AppState {
  currentSchema?: DatabaseSchema;
  queryHistory: UserQuery[];
  chatHistory: ChatMessage[];
  lastResult?: QueryResult;
  isLoading: boolean;
  error?: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  xAxis: string;
  yAxis: string[];
  title: string;
  description?: string;
}

export interface SchemaCache {
  [schemaId: string]: {
    schema: DatabaseSchema;
    embedding?: number[];
    lastUpdated: Date;
  };
}

export interface AIServiceConfig {
  apiEndpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enableCaching: boolean;
}
