import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Upload as UploadIcon,
  Storage as DatabaseIcon,
  TableChart as TableIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useSchema } from '../../hooks';
import type { DatabaseSchema, Table, Column } from '../../types';

interface SchemaManagerProps {
  onSchemaChange?: (schema: DatabaseSchema) => void;
}

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File | string) => void;
}

interface TableDetailProps {
  table: Table;
  expanded: boolean;
  onToggle: () => void;
}

const TableDetail: React.FC<TableDetailProps> = ({ table, expanded, onToggle }) => {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <ListItem sx={{ cursor: 'pointer' }} onClick={onToggle}>
        <ListItemIcon>
          <TableIcon color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={table.name}
          secondary={`${table.columns.length} columns`}
        />
        <IconButton size="small">
          {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        </IconButton>
      </ListItem>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="subtitle2" gutterBottom>
            Columns:
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {table.columns.map((column: Column) => (
              <Chip
                key={column.name}
                size="small"
                label={`${column.name}: ${column.type}`}
                variant="outlined"
                color={column.primaryKey ? 'primary' : column.foreignKey ? 'secondary' : 'default'}
                icon={column.primaryKey ? <CheckIcon fontSize="small" /> : undefined}
              />
            ))}
          </Box>
          
          {table.description && (
            <Typography variant="body2" color="text.secondary">
              {table.description}
            </Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onUpload }) => {
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const [sqlText, setSqlText] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (file: File) => {
    onUpload(file);
    onClose();
  };

  const handleTextUpload = () => {
    if (sqlText.trim()) {
      onUpload(sqlText);
      setSqlText('');
      onClose();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const sqlFile = files.find(file => 
      file.type === 'application/sql' || 
      file.name.endsWith('.sql') ||
      file.name.endsWith('.ddl')
    );
    
    if (sqlFile) {
      handleFileUpload(sqlFile);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Database Schema</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Button
            variant={uploadType === 'file' ? 'contained' : 'outlined'}
            onClick={() => setUploadType('file')}
            sx={{ mr: 1 }}
          >
            Upload File
          </Button>
          <Button
            variant={uploadType === 'text' ? 'contained' : 'outlined'}
            onClick={() => setUploadType('text')}
          >
            Paste SQL
          </Button>
        </Box>

        {uploadType === 'file' ? (
          <Box
            sx={{
              border: 2,
              borderColor: dragOver ? 'primary.main' : 'divider',
              borderStyle: 'dashed',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragOver ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.sql,.ddl,text/plain';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileUpload(file);
              };
              input.click();
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drop SQL files here or click to upload
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports .sql, .ddl files or plain text
            </Typography>
          </Box>
        ) : (
          <TextField
            multiline
            rows={12}
            fullWidth
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            placeholder="Paste your CREATE TABLE statements here..."
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
          />
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Upload your database schema (CREATE TABLE statements) to help the AI understand 
            your data structure and generate more accurate queries.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={uploadType === 'file' ? undefined : handleTextUpload}
          variant="contained"
          disabled={uploadType === 'text' && !sqlText.trim()}
        >
          {uploadType === 'file' ? 'Select File' : 'Upload Schema'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const SchemaManager: React.FC<SchemaManagerProps> = ({ onSchemaChange }) => {
  const {
    schema: currentSchema,
    uploadSchema,
    isUploading: isLoading
  } = useSchema();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const handleUpload = async (fileOrText: File | string) => {
    try {
      if (typeof fileOrText === 'string') {
        // Convert string to file-like object
        const blob = new Blob([fileOrText], { type: 'text/plain' });
        const file = new File([blob], 'schema.sql', { type: 'text/plain' });
        await uploadSchema(file);
      } else {
        await uploadSchema(fileOrText);
      }
      onSchemaChange?.(currentSchema!);
    } catch (error) {
      console.error('Schema upload failed:', error);
    }
  };

  const handleRefresh = async () => {
    // Placeholder for refresh functionality
    console.log('Refresh schema');
  };

  const handleRemove = async () => {
    // Placeholder for remove functionality
    console.log('Remove schema');
  };

  const toggleTableExpansion = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const expandAll = () => {
    if (currentSchema) {
      setExpandedTables(new Set(currentSchema.tables.map((t: Table) => t.name)));
    }
  };

  const collapseAll = () => {
    setExpandedTables(new Set());
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Database Schema</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              size="small"
            >
              Upload
            </Button>
            {currentSchema && (
              <>
                <Tooltip title="Refresh schema">
                  <IconButton onClick={handleRefresh} disabled={isLoading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove schema">
                  <IconButton onClick={handleRemove} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {isLoading && <LinearProgress />}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {!currentSchema ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center'
            }}
          >
            <DatabaseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Schema Loaded
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              Upload your database schema to help the AI understand your data structure 
              and generate more accurate SQL queries.
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Schema
            </Button>
          </Box>
        ) : (
          <>
            {/* Schema Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <DatabaseIcon color="primary" />
                  <Typography variant="h6">
                    {currentSchema.name || 'Database Schema'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip
                    size="small"
                    label={`${currentSchema.tables.length} tables`}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Table Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Tables ({currentSchema.tables.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={expandAll}>
                  Expand All
                </Button>
                <Button size="small" onClick={collapseAll}>
                  Collapse All
                </Button>
              </Box>
            </Box>

            {/* Tables List */}
            <Box>
              {currentSchema.tables.map((table: Table) => (
                <TableDetail
                  key={table.name}
                  table={table}
                  expanded={expandedTables.has(table.name)}
                  onToggle={() => toggleTableExpansion(table.name)}
                />
              ))}
            </Box>

            {/* Schema Stats */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Schema Statistics
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {currentSchema.tables.reduce((sum: number, table: Table) => sum + table.columns.length, 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Columns
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6">
                      {currentSchema.tables.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Tables
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6">
                      {currentSchema.tables.filter((table: Table) => 
                        table.columns.some((col: Column) => col.primaryKey)
                      ).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tables with PK
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6">
                      {currentSchema.tables.filter((table: Table) => 
                        table.columns.some((col: Column) => col.foreignKey)
                      ).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tables with FK
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
      />
    </Box>
  );
};

export default SchemaManager;
