import React, { useMemo, useCallback, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  rankParentsByReplies,
  getCommentLabel,
} from '../utils/commentRanking';
import { scrollToComment } from '../utils/htmlProcessing';

/**
 * Atlassian Design System colors
 * @see https://atlassian.design/foundations/color
 */
const ATLASSIAN_COLORS = {
  B400: '#0052CC', // Primary blue
  B300: '#0065FF',
  B100: '#4C9AFF',
  N800: '#172B4D', // Text
  N200: '#6B778C', // Subtle text
  N40: '#DFE1E6',  // Borders
  N20: '#F4F5F7',  // Background
};

/**
 * Horizontal bar chart displaying number of replies for each comment thread.
 * Uses Apache ECharts via echarts-for-react.
 * Styled to match Atlassian Design System.
 *
 * @param {Object} props
 * @param {Array} props.comments - Flat array of comments from getInlineComments()
 * @param {string} [props.status='open'] - Filter by resolution status ('open', 'resolved', 'all')
 * @param {number} [props.maxItems=10] - Maximum number of threads to display
 */
export default function CommentRepliesChart({
  comments,
  status = 'open',
  maxItems = 10,
}) {
  // Store reference to ranked comments for click handling
  const rankedCommentsRef = useRef([]);

  const chartOption = useMemo(() => {
    if (!comments || comments.length === 0) {
      rankedCommentsRef.current = [];
      return null;
    }

    // Get ranked parent comments by reply count
    const ranked = rankParentsByReplies(comments, { status });

    // Limit to maxItems
    const topComments = ranked.slice(0, maxItems);

    if (topComments.length === 0) {
      rankedCommentsRef.current = [];
      return null;
    }

    // Reverse for horizontal bar chart (highest at top)
    const reversed = [...topComments].reverse();
    
    // Store for click handler (reversed order matches chart display)
    rankedCommentsRef.current = reversed;

    // Extract short labels (max 20 chars) and data
    const labels = reversed.map((node) => getCommentLabel(node, 20));
    const data = reversed.map((node) => node.replyCount);

    // Calculate dynamic height based on number of items (32px per bar + padding)
    const dynamicHeight = Math.max(200, topComments.length * 32 + 60);

    return {
      height: dynamicHeight,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#FFFFFF',
        borderColor: ATLASSIAN_COLORS.N40,
        borderWidth: 1,
        textStyle: {
          color: ATLASSIAN_COLORS.N800,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 12,
        },
        formatter: (params) => {
          const item = params[0];
          return `<span style="color:${ATLASSIAN_COLORS.N200}">${item.name}</span><br/><strong>${item.value}</strong> replies`;
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
          lineStyle: { color: ATLASSIAN_COLORS.N40 },
        },
        axisLabel: {
          color: ATLASSIAN_COLORS.N200,
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
          color: ATLASSIAN_COLORS.N800,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 12,
          width: 120,
          overflow: 'truncate',
          ellipsis: '...',
        },
      },
      series: [
        {
          name: 'Replies',
          type: 'bar',
          data: data,
          barWidth: 16,
          itemStyle: {
            color: ATLASSIAN_COLORS.B400,
            borderRadius: [0, 3, 3, 0],
          },
          emphasis: {
            itemStyle: {
              color: ATLASSIAN_COLORS.B300,
            },
          },
          label: {
            show: true,
            position: 'right',
            color: ATLASSIAN_COLORS.N200,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 11,
            formatter: '{c}',
          },
        },
      ],
    };
  }, [comments, status, maxItems]);

  // Calculate dynamic height for the chart container
  const chartHeight = useMemo(() => {
    if (!chartOption) return 200;
    return chartOption.height || 200;
  }, [chartOption]);

  // Handle bar click - scroll to the comment in the document
  const onChartClick = useCallback((params) => {
    if (params.componentType === 'series') {
      const comment = rankedCommentsRef.current[params.dataIndex];
      if (comment?.inlineMarkerRef) {
        scrollToComment(comment.inlineMarkerRef);
      }
    }
  }, []);

  // ECharts event handlers
  const onEvents = useMemo(() => ({
    click: onChartClick,
  }), [onChartClick]);

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
      opts={{ renderer: 'svg' }}
      onEvents={onEvents}
    />
  );
}
