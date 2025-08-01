import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  InputAdornment
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lightbulb as LightbulbIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { useNaturalLanguageQuery, useQuerySuggestions, useQueryValidation } from '../../hooks';
import { debounce } from '../../utils/helpers';

interface QueryInputProps {
  onQuerySubmit?: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const QueryInput: React.FC<QueryInputProps> = ({
  onQuerySubmit,
  placeholder = "Ask me anything about your data...",
  disabled = false
}) => {
  const {
    currentQuery,
    setCurrentQuery,
    processQuery,
    isProcessing
  } = useNaturalLanguageQuery();

  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuerySuggestions();
  const validation = useQueryValidation(currentQuery);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentQuery(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [setCurrentQuery]);

  // Debounced suggestion showing
  const debouncedShowSuggestions = debounce(() => {
    setShowSuggestions(currentQuery.length > 2);
  }, 300);

  useEffect(() => {
    debouncedShowSuggestions();
  }, [currentQuery, debouncedShowSuggestions]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!currentQuery.trim() || isProcessing || disabled) {
      return;
    }

    if (!validation.isValid) {
      return;
    }

    const query = currentQuery.trim();
    setShowSuggestions(false);
    
    try {
      await processQuery(query);
      onQuerySubmit?.(query);
      setCurrentQuery('');
    } catch (error) {
      console.error('Error processing query:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleVoiceInput = () => {
    if (!recognition.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.current.stop();
    } else {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const handleClear = () => {
    setCurrentQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          position: 'relative'
        }}
      >
        <form onSubmit={handleSubmit}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            error={!validation.isValid}
            helperText={validation.errors[0]}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SmartToyIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {currentQuery && (
                      <Tooltip title="Clear">
                        <IconButton
                          size="small"
                          onClick={handleClear}
                          disabled={disabled || isProcessing}
                        >
                          <ClearIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {recognition.current && (
                      <Tooltip title={isListening ? "Stop listening" : "Voice input"}>
                        <IconButton
                          size="small"
                          onClick={handleVoiceInput}
                          disabled={disabled || isProcessing}
                          color={isListening ? "secondary" : "default"}
                        >
                          <MicIcon />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={disabled || isProcessing || !currentQuery.trim() || !validation.isValid}
                      startIcon={isProcessing ? <CircularProgress size={16} /> : <SendIcon />}
                    >
                      {isProcessing ? 'Processing...' : 'Ask'}
                    </Button>
                  </Box>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
          />
        </form>

        {/* Validation Suggestions */}
        {validation.suggestions.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {validation.suggestions.map((suggestion, index) => (
              <Alert 
                key={index} 
                severity="info" 
                variant="outlined" 
                sx={{ mb: 1 }}
                icon={<LightbulbIcon />}
              >
                {suggestion}
              </Alert>
            ))}
          </Box>
        )}

        {/* Advanced Options */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label="Natural Language"
              color="primary"
              variant="outlined"
            />
            <Chip
              size="small"
              label="AI Powered"
              color="secondary"
              variant="outlined"
            />
          </Box>

          <Button
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            Advanced
          </Button>
        </Box>

        {/* Advanced Options Panel */}
        <Collapse in={showAdvanced}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Query Options
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label="Auto-execute"
                clickable
                variant="outlined"
              />
              <Chip
                size="small"
                label="Explain query"
                clickable
                variant="outlined"
              />
              <Chip
                size="small"
                label="Show schema"
                clickable
                variant="outlined"
              />
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* Query Suggestions */}
      <Collapse in={showSuggestions && suggestions.length > 0}>
        <Paper 
          elevation={1} 
          sx={{ 
            mt: 1, 
            maxHeight: 200, 
            overflow: 'auto',
            borderRadius: 2
          }}
        >
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, pb: 1 }}>
              Suggestions
            </Typography>
            <List dense>
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <ListItem
                  key={index}
                  component="div"
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{ 
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemText 
                    primary={suggestion}
                    primaryTypographyProps={{
                      variant: 'body2'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>
      </Collapse>

      {/* Loading suggestions indicator */}
      {loadingSuggestions && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <CircularProgress size={20} />
        </Box>
      )}
    </Box>
  );
};

export default QueryInput;
