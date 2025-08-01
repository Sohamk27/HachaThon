import type { QueryResult, ChartConfig } from '../types';

// Format data for different chart types
export const formatDataForChart = (result: QueryResult, config: ChartConfig): any[] => {
  if (!result.data || result.data.length === 0) {
    return [];
  }

  const { type, xAxis, yAxis } = config;

  switch (type) {
    case 'pie':
      // For pie charts, we need label and value pairs
      return result.data.map(row => ({
        name: row[xAxis],
        value: row[yAxis[0]]
      }));

    case 'bar':
    case 'line':
    case 'area':
      // For bar/line charts, we need x-axis and y-axis data
      return result.data.map(row => {
        const point: any = { [xAxis]: row[xAxis] };
        yAxis.forEach(y => {
          point[y] = row[y];
        });
        return point;
      });

    case 'scatter':
      // For scatter plots, we need x, y coordinates
      return result.data.map(row => ({
        x: row[xAxis],
        y: row[yAxis[0]]
      }));

    default:
      return result.data;
  }
};

// Suggest appropriate chart type based on data
export const suggestChartType = (result: QueryResult): ChartConfig[] => {
  if (!result.data || result.data.length === 0) {
    return [];
  }

  const numericColumns = result.columns.filter(col => 
    col.type.includes('int') || 
    col.type.includes('float') || 
    col.type.includes('decimal') ||
    col.type.includes('number')
  );

  const textColumns = result.columns.filter(col => 
    col.type.includes('varchar') || 
    col.type.includes('text') || 
    col.type.includes('char')
  );

  const suggestions: ChartConfig[] = [];

  // If we have at least one text column and one numeric column
  if (textColumns.length > 0 && numericColumns.length > 0) {
    const xAxis = textColumns[0].name;
    const yAxis = numericColumns[0].name;

    // Bar chart suggestion
    suggestions.push({
      type: 'bar',
      xAxis,
      yAxis: [yAxis],
      title: `${yAxis} by ${xAxis}`,
      description: 'Shows distribution across categories'
    });

    // Line chart if data appears to be time-series
    if (xAxis.toLowerCase().includes('date') || xAxis.toLowerCase().includes('time')) {
      suggestions.push({
        type: 'line',
        xAxis,
        yAxis: [yAxis],
        title: `${yAxis} over ${xAxis}`,
        description: 'Shows trend over time'
      });
    }

    // Pie chart for categorical data with reasonable number of categories
    if (result.data.length <= 10) {
      suggestions.push({
        type: 'pie',
        xAxis,
        yAxis: [yAxis],
        title: `Distribution of ${yAxis}`,
        description: 'Shows proportional breakdown'
      });
    }
  }

  // If we have two numeric columns, suggest scatter plot
  if (numericColumns.length >= 2) {
    suggestions.push({
      type: 'scatter',
      xAxis: numericColumns[0].name,
      yAxis: [numericColumns[1].name],
      title: `${numericColumns[1].name} vs ${numericColumns[0].name}`,
      description: 'Shows correlation between variables'
    });
  }

  return suggestions;
};

// Format SQL query for display with syntax highlighting
export const formatSQL = (sql: string): string => {
  let formatted = sql.trim();

  // Add line breaks after major clauses
  formatted = formatted.replace(/\b(SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|HAVING)\b/gi, '\n$1');
  
  // Indent subqueries and conditions
  const lines = formatted.split('\n');
  const indentedLines = lines.map((line, index) => {
    if (index === 0) return line;
    if (line.trim().match(/^(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING)/i)) {
      return line;
    }
    return '    ' + line.trim();
  });

  return indentedLines.join('\n').trim();
};

// Validate SQL query for basic security
export const validateSQL = (sql: string): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  const lowerSQL = sql.toLowerCase().trim();

  // Check for dangerous operations
  if (lowerSQL.includes('drop')) {
    warnings.push('Query contains DROP statement - potentially dangerous');
  }

  if (lowerSQL.includes('delete') && !lowerSQL.includes('where')) {
    warnings.push('DELETE without WHERE clause - will affect all rows');
  }

  if (lowerSQL.includes('update') && !lowerSQL.includes('where')) {
    warnings.push('UPDATE without WHERE clause - will affect all rows');
  }

  // Check for SQL injection patterns
  const injectionPatterns = [
    /union\s+select/i,
    /;\s*drop/i,
    /;\s*delete/i,
    /';\s*--/i,
    /\bor\s+1=1/i
  ];

  injectionPatterns.forEach(pattern => {
    if (pattern.test(sql)) {
      warnings.push('Query contains potentially malicious pattern');
    }
  });

  // Check for missing quotes around string literals
  if (sql.match(/=\s*[a-zA-Z]+\s/)) {
    warnings.push('Unquoted string values detected - may cause syntax errors');
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
};

// Generate unique IDs
export const generateId = (): string => {
  return crypto.randomUUID();
};

// Format numbers for display
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format execution time
export const formatExecutionTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if value is empty
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Format date for display
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Convert camelCase to title case
export const camelToTitle = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

// Extract file extension
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Check if string is valid JSON
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};
