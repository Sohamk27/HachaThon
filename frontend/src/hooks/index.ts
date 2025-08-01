import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store';
import { aiService } from '../services/aiService';
import type { 
  UserQuery, 
  DatabaseSchema, 
  ChatMessage 
} from '../types';
import { generateId } from '../utils/helpers';

// Hook for managing natural language query processing
export const useNaturalLanguageQuery = () => {
  const {
    currentSchema,
    addUserQuery,
    addChatMessage,
    updateChatMessage,
    setQueryResult,
    setError,
    getLastQuery
  } = useAppStore();

  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processQuery = useCallback(async (queryText: string) => {
    if (!currentSchema) {
      setError('No database schema loaded');
      return;
    }

    setIsProcessing(true);
    setError(undefined);

    try {
      // Create user query object
      const userQuery: UserQuery = {
        id: generateId(),
        text: queryText,
        timestamp: new Date()
      };

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: queryText,
        timestamp: new Date(),
        query: userQuery
      };
      addChatMessage(userMessage);

      // Parse intent
      const intent = await aiService.parseIntent(queryText);
      userQuery.intent = intent;

      // Extract entities
      const entities = await aiService.extractEntities(queryText, currentSchema);
      userQuery.entities = entities;

      // Add to query history
      addUserQuery(userQuery);

      // Generate assistant response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: 'Processing your query...',
        timestamp: new Date()
      };
      addChatMessage(assistantMessage);

      // Generate SQL
      const generatedSQL = await aiService.generateSQL(userQuery, currentSchema);
      
      // Update assistant message with SQL
      updateChatMessage(assistantMessage.id, {
        content: `I'll execute this SQL query:\n\`\`\`sql\n${generatedSQL.query}\n\`\`\`\n\n${generatedSQL.explanation}`,
        sqlResult: generatedSQL
      });

      // Execute SQL
      const result = await aiService.executeSQL(generatedSQL, currentSchema);
      setQueryResult(result);

      // Update assistant message with results
      const resultSummary = result.status === 'success' 
        ? `Query executed successfully! Found ${result.rowCount} rows in ${result.executionTime}ms.`
        : `Query failed: ${result.error}`;

      updateChatMessage(assistantMessage.id, {
        content: `${assistantMessage.content}\n\n${resultSummary}`,
        dataResult: result
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      addChatMessage({
        id: generateId(),
        type: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentSchema, addUserQuery, addChatMessage, updateChatMessage, setQueryResult, setError]);

  return {
    currentQuery,
    setCurrentQuery,
    processQuery,
    isProcessing,
    lastQuery: getLastQuery()
  };
};

// Hook for managing database schema
export const useSchema = () => {
  const { currentSchema, setSchema, setError } = useAppStore();
  const queryClient = useQueryClient();

  const uploadSchemaMutation = useMutation({
    mutationFn: (file: File) => aiService.uploadSchema(file),
    onSuccess: (schema: DatabaseSchema) => {
      setSchema(schema);
      queryClient.invalidateQueries({ queryKey: ['schema-suggestions'] });
    },
    onError: (error: Error) => {
      setError(`Failed to upload schema: ${error.message}`);
    }
  });

  const generateEmbeddingMutation = useMutation({
    mutationFn: (schema: DatabaseSchema) => aiService.generateSchemaEmbedding(schema),
    onError: (error: Error) => {
      console.warn('Failed to generate schema embedding:', error);
    }
  });

  const uploadSchema = useCallback((file: File) => {
    uploadSchemaMutation.mutate(file);
  }, [uploadSchemaMutation]);

  useEffect(() => {
    if (currentSchema) {
      generateEmbeddingMutation.mutate(currentSchema);
    }
  }, [currentSchema]); // Removed generateEmbeddingMutation from dependencies

  return {
    schema: currentSchema,
    uploadSchema,
    isUploading: uploadSchemaMutation.isPending,
    uploadError: uploadSchemaMutation.error
  };
};

// Hook for getting query suggestions
export const useQuerySuggestions = () => {
  const { currentSchema, getRecentQueries } = useAppStore();

  return useQuery({
    queryKey: ['schema-suggestions', currentSchema?.id],
    queryFn: () => {
      if (!currentSchema) return [];
      return aiService.getSuggestions(currentSchema, getRecentQueries());
    },
    enabled: !!currentSchema,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
};

// Hook for managing chat functionality
export const useChat = () => {
  const { getChatHistory, clearChat, addChatMessage } = useAppStore();
  const [isTyping, setIsTyping] = useState(false);

  const messages = getChatHistory();

  const simulateTyping = useCallback((duration: number = 1000) => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), duration);
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    try {
      // Add user message to chat
      const userMessage: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: messageText.trim(),
        timestamp: new Date()
      };
      addChatMessage(userMessage);

      // Show typing indicator
      setIsTyping(true);

      // Send message to AI service
      const response = await aiService.sendChatMessage(
        messageText.trim(),
        'user-1', // Default user ID for demo
        undefined, // No conversation ID for simplicity
        {}
      );

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.actions?.map((action: any) => action.label || action.text || action) || []
      };
      addChatMessage(aiMessage);
      
    } catch (error) {
      console.error('Error sending chat message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      addChatMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }, [addChatMessage]);

  return {
    messages,
    isTyping,
    simulateTyping,
    clearChat,
    sendMessage
  };
};

// Hook for real-time query validation
export const useQueryValidation = (query: string) => {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }>({
    isValid: true,
    errors: [],
    suggestions: []
  });

  useEffect(() => {
    if (!query.trim()) {
      setValidation({ isValid: true, errors: [], suggestions: [] });
      return;
    }

    // Simple validation rules
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check for very short queries
    if (query.trim().length < 3) {
      errors.push('Query is too short');
    }

    // Check for SQL injection patterns (basic)
    if (query.includes(';')) {
      errors.push('Semicolons are not allowed');
    }

    // Provide suggestions for better queries
    if (!query.toLowerCase().includes('from') && query.toLowerCase().includes('show')) {
      suggestions.push('Try: "Show me data from [table_name]"');
    }

    if (query.toLowerCase().includes('all') && !query.toLowerCase().includes('table')) {
      suggestions.push('Specify which table you want to query');
    }

    setValidation({
      isValid: errors.length === 0,
      errors,
      suggestions
    });
  }, [query]);

  return validation;
};

// Hook for managing query history
export const useQueryHistory = () => {
  const { queryHistory, clearHistory } = useAppStore();
  const [filter, setFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'text'>('date');

  const filteredHistory = queryHistory.filter(query =>
    query.text.toLowerCase().includes(filter.toLowerCase()) ||
    query.intent?.description.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return a.text.localeCompare(b.text);
  });

  return {
    history: sortedHistory,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    clearHistory,
    totalQueries: queryHistory.length
  };
};

// Hook for managing application settings
export const useAppSettings = () => {
  const [settings, setSettings] = useState({
    theme: 'light' as 'light' | 'dark',
    autoExecute: false,
    showSuggestions: true,
    cacheResults: true,
    maxHistoryItems: 100
  });

  const updateSetting = useCallback(<K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load saved settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
  }, [settings]);

  return {
    settings,
    updateSetting
  };
};

// Hook for handling drag and drop file uploads
export const useFileUpload = (onUpload: (file: File) => void) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onUpload(files[0]);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  }, [onUpload]);

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect
  };
};
