import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  QueryStats as QueryIcon,
  History as HistoryIcon,
  Storage as DatabaseIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Assignment as AssignmentIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAppStore } from '../../store';
import { useSchema, useQueryHistory } from '../../hooks';
import type { UserQuery } from '../../types';

interface DashboardProps {
  onNewQuery?: () => void;
  onViewHistory?: () => void;
  onManageSchema?: () => void;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: 'up' | 'down' | 'stable';
  onClick?: () => void;
}

interface RecentQueryItemProps {
  query: UserQuery;
  onRerun?: (query: string) => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  onClick
}) => {
  const cardContent = (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <TrendingUpIcon 
                  fontSize="small" 
                  color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'disabled'}
                  sx={{ 
                    transform: trend === 'down' ? 'rotate(180deg)' : 'none',
                    mr: 0.5 
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  vs last week
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <CardActionArea onClick={onClick} sx={{ height: '100%', borderRadius: 1 }}>
        {cardContent}
      </CardActionArea>
    );
  }

  return cardContent;
};

const RecentQueryItem: React.FC<RecentQueryItemProps> = ({ query, onRerun }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <ListItem
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        '&:hover': { bgcolor: 'action.hover' }
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <QueryIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="body2" sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {query.text}
          </Typography>
        }
        secondary={
          <Typography variant="caption" color="text.secondary">
            {formatTime(query.timestamp)}
          </Typography>
        }
      />
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Re-run query">
          <IconButton size="small" onClick={() => onRerun?.(query.text)}>
            <PlayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton size="small">
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
    </ListItem>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  onNewQuery,
  onViewHistory,
  onManageSchema
}) => {
  const { queryHistory } = useAppStore();
  const { schema } = useSchema();
  const { history, totalQueries } = useQueryHistory();

  // Calculate dashboard stats
  const todayQueries = queryHistory.filter(q => {
    const today = new Date();
    const queryDate = new Date(q.timestamp);
    return queryDate.toDateString() === today.toDateString();
  }).length;

  const recentQueries = history.slice(0, 5);
  const successRate = 85; // Placeholder value
  const avgResponseTime = 245; // Placeholder value

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Monitor your AI SQL assistant performance and activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <StatsCard
          title="Total Queries"
          value={totalQueries}
          subtitle="All time"
          icon={<QueryIcon />}
          color="primary"
          trend="up"
          onClick={onViewHistory}
        />
        <StatsCard
          title="Today's Queries"
          value={todayQueries}
          subtitle="Last 24 hours"
          icon={<TrendingUpIcon />}
          color="success"
          trend="up"
        />
        <StatsCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle="Query accuracy"
          icon={<AssignmentIcon />}
          color="warning"
          trend="stable"
        />
        <StatsCard
          title="Avg Response"
          value={`${avgResponseTime}ms`}
          subtitle="Query execution"
          icon={<SpeedIcon />}
          color="secondary"
          trend="down"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Recent Queries */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Queries</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Refresh">
                  <IconButton size="small">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button size="small" onClick={onViewHistory}>
                  View All
                </Button>
              </Box>
            </Box>

            <List sx={{ p: 0 }}>
              {recentQueries.length > 0 ? (
                recentQueries.map((query: UserQuery) => (
                  <RecentQueryItem
                    key={query.id}
                    query={query}
                    onRerun={onNewQuery}
                  />
                ))
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                  <QueryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No queries yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start by asking a question about your data
                  </Typography>
                  <Button variant="contained" onClick={onNewQuery}>
                    Create First Query
                  </Button>
                </Paper>
              )}
            </List>
          </CardContent>
        </Card>

        {/* Quick Actions & Schema Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<QueryIcon />}
                  onClick={onNewQuery}
                  fullWidth
                >
                  New Query
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={onViewHistory}
                  fullWidth
                >
                  Query History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DatabaseIcon />}
                  onClick={onManageSchema}
                  fullWidth
                >
                  Manage Schema
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Schema Status */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Database Schema
              </Typography>
              {schema ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                      <DatabaseIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {schema.name || 'Active Schema'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Connected
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`${schema.tables.length} tables`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`${schema.tables.reduce((sum, table) => sum + table.columns.length, 0)} columns`}
                      variant="outlined"
                    />
                  </Box>
                  <Button
                    size="small"
                    onClick={onManageSchema}
                    sx={{ mt: 2 }}
                  >
                    Manage Schema
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <DatabaseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No schema loaded
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={onManageSchema}
                  >
                    Upload Schema
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Activity
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Queries Run</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {todayQueries}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Success Rate</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {successRate}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Avg Response</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {avgResponseTime}ms
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
