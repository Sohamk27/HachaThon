import React, { useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Replay as ReplayIcon
} from '@mui/icons-material';
import { useChat } from '../../hooks';
import type { ChatMessage } from '../../types';
import { formatDate } from '../../utils/helpers';

interface ChatInterfaceProps {
  onRerunQuery?: (query: string) => void;
}

interface MessageBubbleProps {
  message: ChatMessage;
  onRerun?: (query: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRerun }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRerun = () => {
    if (message.query) {
      onRerun?.(message.query.text);
    }
  };

  return (
    <ListItem
      sx={{
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        py: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          maxWidth: '85%',
          flexDirection: isUser ? 'row-reverse' : 'row'
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isUser ? 'primary.main' : isSystem ? 'warning.main' : 'secondary.main',
            fontSize: '0.875rem'
          }}
        >
          {isUser ? <PersonIcon /> : <BotIcon />}
        </Avatar>

        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.main' : isSystem ? 'warning.light' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            position: 'relative',
            '&::before': isUser ? {
              content: '""',
              position: 'absolute',
              top: 8,
              right: -8,
              width: 0,
              height: 0,
              borderLeft: '8px solid',
              borderLeftColor: 'primary.main',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent'
            } : {
              content: '""',
              position: 'absolute',
              top: 8,
              left: -8,
              width: 0,
              height: 0,
              borderRight: '8px solid',
              borderRightColor: isSystem ? 'warning.light' : 'background.paper',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent'
            }
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>

          {/* SQL Code Block */}
          {message.sqlResult && (
            <Paper
              variant="outlined"
              sx={{
                mt: 2,
                p: 1,
                bgcolor: 'background.default',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {message.sqlResult.query}
              </pre>
            </Paper>
          )}

          {/* Query Results Summary */}
          {message.dataResult && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={`${message.dataResult.rowCount} rows`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${message.dataResult.executionTime}ms`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={message.dataResult.status}
                  color={message.dataResult.status === 'success' ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </Box>
          )}

          {/* Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                Suggestions:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {message.suggestions.slice(0, 3).map((suggestion, index) => (
                  <Chip
                    key={index}
                    size="small"
                    label={suggestion}
                    variant="outlined"
                    clickable
                    onClick={() => onRerun?.(suggestion)}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Message Actions */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 0.5,
              mt: 1,
              opacity: 0.7,
              '&:hover': { opacity: 1 }
            }}
          >
            <Tooltip title="Copy message">
              <IconButton size="small" onClick={handleCopy}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {message.query && (
              <Tooltip title="Re-run query">
                <IconButton size="small" onClick={handleRerun}>
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {!isUser && (
              <>
                <Tooltip title="Helpful">
                  <IconButton size="small">
                    <ThumbUpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Not helpful">
                  <IconButton size="small">
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Paper>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mt: 0.5,
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          mr: isUser ? 5 : 0,
          ml: isUser ? 0 : 5
        }}
      >
        {formatDate(message.timestamp)}
      </Typography>
    </ListItem>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onRerunQuery }) => {
  const { messages, isTyping, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
            <BotIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2">AI Assistant</Typography>
            <Typography variant="caption" color="text.secondary">
              Ask me anything about your data
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Clear chat">
          <IconButton onClick={clearChat}>
            <ReplayIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'background.default'
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4,
              textAlign: 'center'
            }}
          >
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'secondary.main', mb: 2 }}>
              <BotIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Welcome to AI SQL Assistant!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
              I can help you query your database using natural language. Just ask me questions 
              like "Show me all customers" or "What are the top selling products?"
            </Typography>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip
                size="small"
                label="Natural Language Processing"
                color="primary"
                variant="outlined"
              />
              <Chip
                size="small"
                label="SQL Generation"
                color="secondary"
                variant="outlined"
              />
              <Chip
                size="small"
                label="Smart Suggestions"
                color="success"
                variant="outlined"
              />
            </Box>
          </Box>
        ) : (
          <List sx={{ py: 1 }}>
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                <MessageBubble
                  message={message}
                  onRerun={onRerunQuery}
                />
                {index < messages.length - 1 && <Divider variant="middle" />}
              </React.Fragment>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <ListItem
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    <BotIcon />
                  </Avatar>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.25,
                        '& > div': {
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: 'text.secondary',
                          animation: 'pulse 1.4s infinite ease-in-out'
                        },
                        '& > div:nth-of-type(1)': {
                          animationDelay: '-0.32s'
                        },
                        '& > div:nth-of-type(2)': {
                          animationDelay: '-0.16s'
                        },
                        '@keyframes pulse': {
                          '0%, 80%, 100%': {
                            transform: 'scale(0.5)',
                            opacity: 0.5
                          },
                          '40%': {
                            transform: 'scale(1)',
                            opacity: 1
                          }
                        }
                      }}
                    >
                      <div />
                      <div />
                      <div />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      AI is thinking...
                    </Typography>
                  </Paper>
                </Box>
              </ListItem>
            )}

            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ChatInterface;
