import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactECharts from 'echarts-for-react';
import Spinner from '@atlaskit/spinner';
import { groupCommentsByUser } from '../utils/commentRanking';
import { userCache } from '../utils/userCache';
import { COMMENT_STATUS } from '../constants';

// Atlassian Design System color palette
// Using blue instead of green for better color-blind accessibility (red-green is problematic)
const COLORS = {
  B400: '#0052CC', // Primary blue - accessible alternative to green
  B300: '#0065FF', // Emphasis blue
  N800: '#172B4D',
  N200: '#6B778C',
  N40: '#DFE1E6',
};

/**
 * Fetches display names for an array of user comment counts.
 * Uses the user cache service to avoid redundant API calls and deduplicate requests.
 * 
 * @param {Array<{authorId: string, commentCount: number}>} userCounts - Array of user counts
 * @returns {Promise<Array<{authorId: string, commentCount: number, displayName: string}>>} Enriched array
 */
async function enrichWithDisplayNames(userCounts) {
  // Extract author IDs
  const authorIds = userCounts.map(item => item.authorId);
  
  // Use cache service to fetch user info efficiently (deduplicates and caches)
  const users = await userCache.getMultipleUserInfo(authorIds);
  
  // Combine user info with comment counts
  return userCounts.map((item, index) => ({
    ...item,
    displayName: users[index]?.displayName || 'Unknown User',
  }));
}

/**
 * Horizontal bar chart displaying comment counts per user.
 * Users are ranked by total number of comments (including replies).
 * 
 * Note: Unlike CommentRepliesChart, this component does not support onBarClick
 * because clicking a user doesn't have a clear navigation target (users may have
 * commented on multiple threads across the page).
 * 
 * @param {Array} comments - Array of comment objects
 * @param {string} [status=COMMENT_STATUS.OPEN] - Filter comments by status
 * @param {number} [maxItems] - Maximum number of users to display (shows all if not specified)
 */
export default function CommentsByUserChart({
  comments,
  status = COMMENT_STATUS.OPEN,
  maxItems,
}) {
  const [enrichedUsers, setEnrichedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Group comments by user and optionally limit to top N
  const userCounts = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    const grouped = groupCommentsByUser(comments, { status });
    return maxItems ? grouped.slice(0, maxItems) : grouped;
  }, [comments, status, maxItems]);

  // Fetch display names for users
  useEffect(() => {
    if (userCounts.length === 0) {
      setEnrichedUsers([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    enrichWithDisplayNames(userCounts).then((result) => {
      if (!cancelled) {
        setEnrichedUsers(result);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userCounts]);

  const chartOption = useMemo(() => {
    if (enrichedUsers.length === 0) return null;

    // Reverse order for display (most comments at top of chart)
    const reversed = [...enrichedUsers].reverse();

    const labels = reversed.map((u) => u.displayName);
    const data = reversed.map((u) => u.commentCount);

    // Dynamic height based on number of items (32px per item + padding)
    const dynamicHeight = Math.max(200, enrichedUsers.length * 32 + 60);

    return {
      height: dynamicHeight,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        renderMode: 'html',
        appendToBody: true,
        className: 'echarts-tooltip-container',
        position: (point) => [point[0] + 10, point[1] - 10],
        backgroundColor: '#FFFFFF',
        borderColor: COLORS.N40,
        borderWidth: 1,
        textStyle: {
          color: COLORS.N800,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 12,
        },
        formatter: (params) => {
          const item = params[0];
          const count = item.value;
          return `<strong>${item.name}</strong><br/>${count} ${count === 1 ? 'comment' : 'comments'}`;
        },
      },
      grid: {
        left: 8,
        right: 40,
        bottom: 8,
        top: 8,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: COLORS.N40 },
        },
        axisLabel: {
          color: COLORS.N200,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: COLORS.N800,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 12,
          width: 120,
          overflow: 'truncate',
          ellipsis: '...',
        },
      },
      series: [
        {
          name: 'Comments',
          type: 'bar',
          data: data,
          barWidth: 16,
          itemStyle: {
            color: '#000000', // Black bars
            borderRadius: [0, 3, 3, 0],
          },
          emphasis: {
            itemStyle: {
              color: '#333333', // Dark gray on hover
            },
          },
          label: {
            show: true,
            position: 'right',
            color: COLORS.N200,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 11,
            formatter: '{c}',
          },
        },
      ],
    };
  }, [enrichedUsers]);

  const chartHeight = chartOption?.height || 200;

  if (isLoading) {
    return (
      <div className="conf-chart-empty">
        <Spinner size="small" />
      </div>
    );
  }

  if (!chartOption) {
    return (
      <div className="conf-chart-empty">
        No comments found.
      </div>
    );
  }

  return (
    <ReactECharts
      option={chartOption}
      style={{ height: `${chartHeight}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

CommentsByUserChart.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    version: PropTypes.shape({
      authorId: PropTypes.string,
    }),
    resolutionStatus: PropTypes.string,
  })),
  status: PropTypes.oneOf(Object.values(COMMENT_STATUS)),
  maxItems: PropTypes.number,
};

CommentsByUserChart.defaultProps = {
  comments: [],
  status: COMMENT_STATUS.OPEN,
  maxItems: undefined,
};
