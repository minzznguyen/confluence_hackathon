import React, { useMemo, useCallback, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { rankParentsByReplies, getCommentLabel } from '../utils/commentRanking';
import { scrollToComment } from '../utils/htmlProcessing';

// Atlassian Design System colors
const COLORS = {
  B400: '#0052CC', // Primary blue
  B300: '#0065FF',
  B100: '#4C9AFF',
  N800: '#172B4D',
  N200: '#6B778C',
  N40: '#DFE1E6',
};

export default function CommentRepliesChart({
  comments,
  status = 'open',
  maxItems = 10,
}) {
  const rankedCommentsRef = useRef([]);

  const chartOption = useMemo(() => {
    if (!comments || comments.length === 0) {
      rankedCommentsRef.current = [];
      return null;
    }

    const ranked = rankParentsByReplies(comments, { status });
    const topComments = ranked.slice(0, maxItems);

    if (topComments.length === 0) {
      rankedCommentsRef.current = [];
      return null;
    }

    const reversed = [...topComments].reverse();
    rankedCommentsRef.current = reversed;

    const labels = reversed.map((node) => getCommentLabel(node, 20));
    const data = reversed.map((node) => node.replyCount);
    const dynamicHeight = Math.max(200, topComments.length * 32 + 60);

    return {
      height: dynamicHeight,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
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
          return `<span style="color:${COLORS.N200}">${item.name}</span><br/><strong>${item.value}</strong> replies`;
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
          name: 'Replies',
          type: 'bar',
          data: data,
          barWidth: 16,
          itemStyle: {
            color: COLORS.B400,
            borderRadius: [0, 3, 3, 0],
          },
          emphasis: {
            itemStyle: {
              color: COLORS.B300,
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
  }, [comments, status, maxItems]);

  const chartHeight = chartOption?.height || 200;

  const onChartClick = useCallback((params) => {
    if (params.componentType === 'series') {
      const comment = rankedCommentsRef.current[params.dataIndex];
      if (comment?.inlineMarkerRef) {
        scrollToComment(comment.inlineMarkerRef);
      }
    }
  }, []);

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
      opts={{ renderer: 'svg' }}
      onEvents={onEvents}
    />
  );
}
