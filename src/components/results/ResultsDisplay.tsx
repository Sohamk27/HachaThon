import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  BarChart as ChartIcon,
  TableChart as TableIcon,
  Code as CodeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRowsProp } from '@mui/x-data-grid';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import type { QueryResult, ChartConfig } from '../../types';
import { formatNumber, formatExecutionTime, suggestChartType, formatDataForChart } from '../../utils/helpers';

interface ResultsDisplayProps {
  result?: QueryResult;
  isLoading?: boolean;
  sqlQuery?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  isLoading = false,
  sqlQuery
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedChart, setSelectedChart] = useState<ChartConfig | null>(null);

  // Memoized chart suggestions
  const chartSuggestions = useMemo(() => {
    if (!result) return [];
    return suggestChartType(result);
  }, [result]);

  // Prepare data for DataGrid
  const gridColumns: GridColDef[] = useMemo(() => {
    if (!result?.columns) return [];
    
    return result.columns.map(col => ({
      field: col.name,
      headerName: col.name,
      type: col.type.includes('int') || col.type.includes('float') || col.type.includes('decimal') ? 'number' : 'string',
      flex: 1,
      minWidth: 150
    }));
  }, [result?.columns]);

  const gridRows: GridRowsProp = useMemo(() => {
    if (!result?.data) return [];
    
    return result.data.map((row, index) => ({
      id: index,
      ...row
    }));
  }, [result?.data]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!result || !selectedChart) return [];
    return formatDataForChart(result, selectedChart);
  }, [result, selectedChart]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleExport = () => {
    if (!result?.data) return;
    
    const csv = [
      result.columns.map(col => col.name).join(','),
      ...result.data.map(row => 
        result.columns.map(col => row[col.name] ?? '').join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'query_results.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    if (!selectedChart || chartData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Select a chart type to visualize your data
          </Typography>
        </Box>
      );
    }

    const { type } = selectedChart;

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={selectedChart.xAxis} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {selectedChart.yAxis.map((yKey, index) => (
                <Bar key={yKey} dataKey={yKey} fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={selectedChart.xAxis} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {selectedChart.yAxis.map((yKey, index) => (
                <Line key={yKey} type="monotone" dataKey={yKey} stroke={COLORS[index % COLORS.length]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <Typography>Unsupported chart type</Typography>;
    }
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Executing query...
        </Typography>
      </Paper>
    );
  }

  if (!result) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No results to display. Execute a query to see results here.
        </Typography>
      </Paper>
    );
  }

  if (result.status === 'error') {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6">Query Error</Typography>
        <Typography variant="body2">
          {result.error}
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Results Summary */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Query Results</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                size="small"
                label={`${formatNumber(result.rowCount)} rows`}
                color="primary"
                variant="outlined"
              />
              <Chip
                size="small"
                label={formatExecutionTime(result.executionTime)}
                color="secondary"
                variant="outlined"
              />
              <Chip
                size="small"
                label={result.status}
                color={result.status === 'success' ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
          </Box>

          {result.metadata && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Tables: {result.metadata.tablesUsed.join(', ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cost: {result.metadata.cost}
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions>
          <Button startIcon={<DownloadIcon />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button startIcon={<ShareIcon />}>
            Share
          </Button>
          <Button startIcon={<InfoIcon />}>
            Details
          </Button>
        </CardActions>
      </Card>

      {/* Results Tabs */}
      <Paper>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab icon={<TableIcon />} label="Table View" />
          <Tab icon={<ChartIcon />} label="Chart View" />
          <Tab icon={<CodeIcon />} label="SQL Query" />
        </Tabs>

        <Divider />

        {/* Table View */}
        <TabPanel value={currentTab} index={0}>
          <DataGrid
            rows={gridRows}
            columns={gridColumns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 }
              }
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'background.default'
              }
            }}
          />
        </TabPanel>

        {/* Chart View */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Chart Suggestions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {chartSuggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={`${suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Chart`}
                  onClick={() => setSelectedChart(suggestion)}
                  color={selectedChart === suggestion ? 'primary' : 'default'}
                  variant={selectedChart === suggestion ? 'filled' : 'outlined'}
                  clickable
                />
              ))}
            </Box>
            {selectedChart && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedChart.description}
              </Typography>
            )}
          </Box>

          <Box sx={{ height: 400 }}>
            {renderChart()}
          </Box>
        </TabPanel>

        {/* SQL Query */}
        <TabPanel value={currentTab} index={2}>
          {sqlQuery && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                backgroundColor: 'background.default',
                fontFamily: 'monospace',
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {sqlQuery}
              </pre>
            </Paper>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ResultsDisplay;
