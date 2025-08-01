import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import QueryInput from './components/query/QueryInput';
import ResultsDisplay from './components/results/ResultsDisplay';
import ChatInterface from './components/chat/ChatInterface';
import SchemaManager from './components/schema/SchemaManager';

// Store and hooks
import { useAppStore } from './store';
import { aiService } from './services/aiService';
import type { DatabaseSchema, UserQuery } from './types';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

type ViewType = 'dashboard' | 'query' | 'results' | 'chat' | 'schema' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { addUserQuery, queryHistory, setSchema, currentSchema } = useAppStore();

  // Load default schema on app start
  useEffect(() => {
    const loadDefaultSchema = async () => {
      try {
        if (!currentSchema) {
          const schema = await aiService.getSchemaInfo();
          setSchema(schema);
        }
      } catch (error) {
        console.error('Failed to load default schema:', error);
      }
    };

    loadDefaultSchema();
  }, [currentSchema, setSchema]);

  const handleSchemaChange = (schema: DatabaseSchema) => {
    console.log('Schema updated:', schema);
  };

  const handleQuerySubmit = (query: string) => {
    // Add query to history
    const userQuery: UserQuery = {
      id: Date.now().toString(),
      text: query,
      timestamp: new Date()
    };
    addUserQuery(userQuery);
    
    // Switch to results view to show the processing
    setCurrentView('results');
  };

  const handleRerunQuery = (query: string) => {
    handleQuerySubmit(query);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onNewQuery={() => setCurrentView('query')}
            onViewHistory={() => setCurrentView('history')}
            onManageSchema={() => setCurrentView('schema')}
          />
        );
      
      case 'query':
        return (
          <Box sx={{ p: 3 }}>
            <QueryInput onQuerySubmit={handleQuerySubmit} />
          </Box>
        );
      
      case 'results':
        return (
          <Box sx={{ p: 3 }}>
            <ResultsDisplay />
          </Box>
        );
      
      case 'chat':
        return (
          <ChatInterface onRerunQuery={handleRerunQuery} />
        );
      
      case 'schema':
        return (
          <SchemaManager onSchemaChange={handleSchemaChange} />
        );
      
      case 'history':
        return (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <h2>Query History</h2>
              <span>({queryHistory.length} queries)</span>
            </Box>
            {queryHistory.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <p>No queries yet. Start by creating your first query!</p>
              </Box>
            ) : (
              <Box>
                {queryHistory.slice().reverse().map((query, index) => (
                  <Box
                    key={query.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleRerunQuery(query.text)}
                  >
                    <div style={{ fontWeight: 'bold' }}>#{queryHistory.length - index}</div>
                    <div>{query.text}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '8px' }}>
                      {new Date(query.timestamp).toLocaleString()}
                    </div>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );
      
      default:
        return <Dashboard onNewQuery={() => setCurrentView('query')} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout
          currentPage={currentView}
          onPageChange={(page) => setCurrentView(page as ViewType)}
        >
          {renderCurrentView()}
        </Layout>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
