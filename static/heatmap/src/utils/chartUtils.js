import { rankParentsByReplies, getCommentLabel } from './commentRanking';
import { calculateScore } from './colorStrip';

// Atlassian Design System color palette
export const COLORS = {
  N800: '#172B4D',
  N200: '#6B778C',
  N40: '#DFE1E6',
};

// Comment rank colors matching inline comment highlighting (from comments.css)
export const RANK_COLORS = {
  0: { normal: '#f5ec8e', emphasis: '#f9e85a' }, // Lightest - lowest reply count (yellow)
  1: { normal: '#f7b457', emphasis: '#f4a030' }, // Light-medium (orange)
  2: { normal: '#FE7440', emphasis: '#FE5A1A' }, // Medium-dark (darker orange)
  3: { normal: '#FE2923', emphasis: '#E01A1A' }, // Darkest - highest reply count (red)
};

/**
 * Calculates base chart data for comment replies chart.
 * Processes comments, ranks them, calculates scores, and prepares chart-ready data.
 * 
 * @param {Array} comments - Array of comment objects
 * @param {string} status - Filter comments by status
 * @param {number} maxItems - Maximum number of items to display
 * @returns {Object|null} Object containing labels, data, participantCounts, and height, or null if no data
 */
export function calculateBaseChartData(comments, status, maxItems) {
  if (!comments || comments.length === 0) {
    return null;
  }

  // Rank comments by reply count and take top N items
  const ranked = rankParentsByReplies(comments, { status });
  const topComments = ranked.slice(0, maxItems);

  if (topComments.length === 0) {
    return null;
  }

  // Calculate scores for color ranking (based on position in sorted array)
  const scoredComments = calculateScore(topComments);

  // Reverse order for display (most replies at top of chart)
  const reversed = [...scoredComments].reverse();

  // Prepare chart data: labels (selected text) and values (thread counts)
  const labels = reversed.map((node) => getCommentLabel(node, 20));
  // Each data point includes value and itemStyle for individual bar coloring
  const data = reversed.map((node) => ({
    value: node.threadCount,
    itemStyle: {
      color: RANK_COLORS[node.score]?.normal || RANK_COLORS[0].normal,
    },
  }));
  const participantCounts = reversed.map((node) => node.participantCount || 0);
  // Dynamic height based on number of items (32px per item + padding)
  const dynamicHeight = Math.max(200, topComments.length * 32 + 60);

  return {
    labels,
    data,
    participantCounts,
    height: dynamicHeight,
    reversedComments: reversed, // Return reversed comments for ref assignment
  };
}

/**
 * Creates a tooltip formatter function for comment replies chart.
 * Formats tooltip content with comment count, participant count, and most commented user info.
 * 
 * @param {Object} baseChartData - Base chart data object with participantCounts
 * @param {Array} mostCommentedUserInfo - Array of user info objects (userId, displayName, avatarUrl)
 * @returns {Function|null} Tooltip formatter function or null if no base data
 */
export function createTooltipFormatter(baseChartData, mostCommentedUserInfo) {
  if (!baseChartData) return null;

  // Reverse mostCommentedUserInfo to match the reversed chart data order
  const reversedUserInfo = mostCommentedUserInfo.length > 0 
    ? [...mostCommentedUserInfo].reverse()
    : [];

  return (params) => {
    const item = params[0];
    const commentCount = item.value; // Total thread count (parent + replies)
    const participantCount = baseChartData.participantCounts[item.dataIndex];
    const userInfo = reversedUserInfo[item.dataIndex];
    
    let tooltipContent = `Number of comments: <strong>${commentCount}</strong><br/>Number of participants: <strong>${participantCount}</strong>`;
    
    // Add most commented by user if available
    if (userInfo && userInfo.displayName) {
      const avatarHtml = userInfo.avatarUrl 
        ? `<img src="${userInfo.avatarUrl}" class="conf-tooltip-avatar" alt="" />`
        : '';
      tooltipContent += `<br/>Most commented by: ${avatarHtml}<strong>${userInfo.displayName}</strong>`;
    }
    
    return tooltipContent;
  };
}

/**
 * Creates ECharts option configuration for comment replies chart.
 * Builds the complete chart configuration including tooltip, axes, grid, and series.
 * 
 * @param {Object} baseChartData - Base chart data object (labels, data, height)
 * @param {Function} tooltipFormatter - Tooltip formatter function
 * @returns {Object|null} ECharts option object or null if no base data
 */
export function createCommentRepliesChartOption(baseChartData, tooltipFormatter) {
  if (!baseChartData) {
    return null;
  }

  return {
    height: baseChartData.height,
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
      formatter: tooltipFormatter,
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
      data: baseChartData.labels,
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
        data: baseChartData.data,
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
}

