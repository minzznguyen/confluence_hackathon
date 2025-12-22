import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactECharts from 'echarts-for-react';
import { rankParentsByReplies, getCommentLabel, getCommentBody, findMostCommentedUser } from '../utils/commentRanking';
import { calculateScore } from '../utils/colorStrip';
import { scrollToComment } from '../utils/htmlProcessing';
import { getUserInfo } from '../api/confluence';
import { COMMENT_STATUS } from '../constants';

// Atlassian Design System color palette
const COLORS = {
  N800: '#172B4D',
  N200: '#6B778C',
  N40: '#DFE1E6',
};

// Comment rank colors matching inline comment highlighting (from comments.css)
const RANK_COLORS = {
  0: { normal: '#f5ec8e', emphasis: '#f9e85a' }, // Lightest - lowest reply count (yellow)
  1: { normal: '#f7b457', emphasis: '#f4a030' }, // Light-medium (orange)
  2: { normal: '#FE7440', emphasis: '#FE5A1A' }, // Medium-dark (darker orange)
  3: { normal: '#FE2923', emphasis: '#E01A1A' }, // Darkest - highest reply count (red)
};

/**
 * Horizontal bar chart displaying comment threads ranked by thread size.
 * Thread size = parent comment + all replies.
 * Clicking a bar scrolls to the corresponding inline comment in the page.
 * 
 * @param {Array} comments - Array of comment objects
 * @param {string} [status=COMMENT_STATUS.OPEN] - Filter comments by status
 * @param {number} [maxItems=10] - Maximum number of items to display
 */
export default function CommentRepliesChart({
  comments,
  status = COMMENT_STATUS.OPEN,
  maxItems = 10,
  onBarClick,
}) {
  // Store ranked comments for click handler access
  const rankedCommentsRef = useRef([]);
  // Store display names for most commented users per thread
  const [mostCommentedUserNames, setMostCommentedUserNames] = useState([]);

  // Calculate most commented user for each thread and fetch display names
  const topCommentsForEnrichment = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    const ranked = rankParentsByReplies(comments, { status });
    return ranked.slice(0, maxItems);
  }, [comments, status, maxItems]);

  // Fetch display names for most commented users
  useEffect(() => {
    if (topCommentsForEnrichment.length === 0) {
      setMostCommentedUserNames([]);
      return;
    }

    let cancelled = false;

    // Calculate most commented user for each thread
    const mostCommentedUserIds = topCommentsForEnrichment.map(node => findMostCommentedUser(node));

    // Fetch display names for unique user IDs
    const uniqueUserIds = [...new Set(mostCommentedUserIds.filter(id => id !== null))];
    
    Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const user = await getUserInfo(userId);
          return { userId, displayName: user?.displayName || 'Unknown User' };
        } catch {
          return { userId, displayName: 'Unknown User' };
        }
      })
    ).then((userInfoArray) => {
      if (!cancelled) {
        // Create a map for quick lookup
        const userMap = new Map(userInfoArray.map(info => [info.userId, info.displayName]));
        
        // Map back to the original order, matching each thread to its most commented user's display name
        const displayNames = mostCommentedUserIds.map(userId => 
          userId ? (userMap.get(userId) || 'Unknown User') : null
        );
        
        setMostCommentedUserNames(displayNames);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [topCommentsForEnrichment]);

  const chartOption = useMemo(() => {
    if (!comments || comments.length === 0) {
      rankedCommentsRef.current = [];
      return null;
    }

    // Rank comments by reply count and take top N items
    const ranked = rankParentsByReplies(comments, { status });
    const topComments = ranked.slice(0, maxItems);

    if (topComments.length === 0) {
      rankedCommentsRef.current = [];
      return null;
    }

    // Calculate scores for color ranking (based on position in sorted array)
    const scoredComments = calculateScore(topComments);

    // Reverse order for display (most replies at top of chart)
    const reversed = [...scoredComments].reverse();
    rankedCommentsRef.current = reversed;
    
    // Reverse mostCommentedUserNames to match the reversed chart data order
    // Ensure we have enough names (pad with null if needed)
    const reversedUserNames = mostCommentedUserNames.length > 0 
      ? [...mostCommentedUserNames].reverse()
      : [];

    // Prepare chart data: labels (selected text), tooltips (comment body), and values (thread counts)
    const labels = reversed.map((node) => getCommentLabel(node, 20));
    const tooltipLabels = reversed.map((node) => getCommentBody(node, 40));
    // Each data point includes value and itemStyle for individual bar coloring
    const data = reversed.map((node) => ({
      value: node.threadCount,
      itemStyle: {
        color: RANK_COLORS[node.score]?.normal || RANK_COLORS[0].normal,
      },
    }));
    const replyCounts = reversed.map((node) => node.threadCount - 1);
    const participantCounts = reversed.map((node) => node.participantCount || 0);
    // Dynamic height based on number of items (32px per item + padding)
    const dynamicHeight = Math.max(200, topComments.length * 32 + 60);

    return {
      height: dynamicHeight,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        renderMode: 'html', // Required for appendToBody to work
        appendToBody: true, // Render tooltip in document.body to avoid sidebar overflow clipping
        className: 'echarts-tooltip-container', // Custom class for styling if needed
        position: (point, params, dom, rect, size) => {
          // Position tooltip to the right of the cursor, ensuring it's visible
          return [point[0] + 10, point[1] - 10];
        },
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
          const tooltip = tooltipLabels[item.dataIndex];
          const replyCount = replyCounts[item.dataIndex];
          const participantCount = participantCounts[item.dataIndex];
          const mostCommentedBy = reversedUserNames[item.dataIndex];
          
          let tooltipContent = `<span style="color:${COLORS.N200}">${tooltip}</span><br/><strong>${replyCount}</strong> ${replyCount === 1 ? 'reply' : 'replies'}<br/><strong>${participantCount}</strong> ${participantCount === 1 ? 'participant' : 'participants'}`;
          
          // Add most commented by user if available
          if (mostCommentedBy) {
            tooltipContent += `<br/>Most commented by: <strong>${mostCommentedBy}</strong>`;
          }
          
          return tooltipContent;
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
            borderRadius: [0, 3, 3, 0],
          },
          label: {
            show: true,
            position: 'right',
            color: COLORS.N200,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 11,
            formatter: (params) => params.value,
          },
        },
      ],
    };
  }, [comments, status, maxItems, mostCommentedUserNames]);

  const chartHeight = chartOption?.height || 200;

  // Handle bar clicks to scroll to corresponding comment and trigger callback
  const onChartClick = useCallback((params, event) => {
    // Only handle clicks on actual bar series data
    if (params.componentType !== 'series' || params.seriesType !== 'bar') {
      return;
    }
    
    // Ensure we have a valid data index
    if (typeof params.dataIndex !== 'number' || params.dataIndex < 0) {
      return;
    }

    const comment = rankedCommentsRef.current[params.dataIndex];
    if (comment) {
      // Scroll to the comment in the page
      if (comment.inlineMarkerRef) {
        scrollToComment(comment.inlineMarkerRef);
      }
      // Trigger callback to show popup (if provided)
      if (onBarClick && comment.inlineMarkerRef) {
        onBarClick(comment.inlineMarkerRef);
      }
    }
  }, [onBarClick]);

  const onEvents = { click: onChartClick };

  if (!chartOption) {
    return (
      <div className="conf-chart-empty">
        No open comment threads found.
      </div>
    );
  }

  return (
    <ReactECharts
      option={chartOption}
      style={{ height: `${chartHeight}px`, width: '100%', cursor: 'pointer' }}
      opts={{ renderer: 'canvas' }} // Canvas renderer required for appendToBody tooltip
      onEvents={onEvents}
    />
  );
}

CommentRepliesChart.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    body: PropTypes.object,
    parentCommentId: PropTypes.string,
    resolutionStatus: PropTypes.string,
    properties: PropTypes.object,
  })),
  status: PropTypes.oneOf(['open']),
  maxItems: PropTypes.number,
  onBarClick: PropTypes.func,
};

CommentRepliesChart.defaultProps = {
  comments: [],
  status: COMMENT_STATUS.OPEN,
  maxItems: 10,
  onBarClick: null,
};
