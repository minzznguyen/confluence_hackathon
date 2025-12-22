import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactECharts from 'echarts-for-react';
import { rankParentsByReplies, findMostCommentedUser } from '../utils/commentRanking';
import { scrollToComment } from '../utils/htmlProcessing';
import { userCache } from '../utils/userCache';
import { 
  calculateBaseChartData, 
  createTooltipFormatter, 
  createCommentRepliesChartOption 
} from '../utils/chartUtils';
import { COMMENT_STATUS } from '../constants';

/**
 * Horizontal bar chart displaying comment threads ranked by thread size.
 * Thread size = parent comment + all replies.
 * Clicking a bar scrolls to the corresponding inline comment in the page.
 * 
 * @param {Array} comments - Array of comment objects
 * @param {string} [status=COMMENT_STATUS.OPEN] - Filter comments by status
 * @param {number} [maxItems] - Maximum number of items to display (shows all if not specified)
 */
export default function CommentRepliesChart({
  comments,
  status = COMMENT_STATUS.OPEN,
  maxItems,
  onBarClick,
}) {
  // Store ranked comments for click handler access
  const rankedCommentsRef = useRef([]);
  // Store display names and avatar URLs for most commented users per thread
  const [mostCommentedUserInfo, setMostCommentedUserInfo] = useState([]);

  // Calculate most commented user for each thread and fetch display names
  // Memoized to prevent recalculation when user info loads
  const topCommentsForEnrichment = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    const ranked = rankParentsByReplies(comments, { status });
    return ranked.slice(0, maxItems);
  }, [comments, status, maxItems]);

  // Memoize base chart data (labels, values, colors) - doesn't depend on user info
  // This prevents chart re-render when user info loads
  const baseChartData = useMemo(() => {
    const chartData = calculateBaseChartData(comments, status, maxItems);
    
    // Update ref with reversed comments for click handler access
    if (chartData) {
      rankedCommentsRef.current = chartData.reversedComments || [];
    } else {
      rankedCommentsRef.current = [];
    }
    
    return chartData;
  }, [comments, status, maxItems]);

  // Fetch display names and avatar URLs for most commented users using cache
  useEffect(() => {
    if (topCommentsForEnrichment.length === 0) {
      setMostCommentedUserInfo([]);
      return;
    }

    let cancelled = false;

    // Calculate most commented user for each thread
    const mostCommentedUserIds = topCommentsForEnrichment.map(node => findMostCommentedUser(node));

    // Use cache service to fetch user info efficiently (deduplicates and caches)
    userCache.getMultipleEnrichedUserInfo(mostCommentedUserIds)
      .then((enrichedUserInfo) => {
        if (!cancelled) {
          // enrichedUserInfo is already in the correct order and format
          setMostCommentedUserInfo(enrichedUserInfo);
        }
      })
      .catch(() => {
        // On error, set empty array to prevent UI breakage
        if (!cancelled) {
          setMostCommentedUserInfo([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [topCommentsForEnrichment]);

  // Memoize tooltip formatter separately - only updates when user info loads
  // This prevents full chart re-render, only tooltip content updates
  const tooltipFormatter = useMemo(() => {
    return createTooltipFormatter(baseChartData, mostCommentedUserInfo);
  }, [baseChartData, mostCommentedUserInfo]);

  // Build chart option - base data doesn't change when user info loads
  // Only tooltip formatter updates, preventing full chart re-render
  const chartOption = useMemo(() => {
    return createCommentRepliesChartOption(baseChartData, tooltipFormatter);
  }, [baseChartData, tooltipFormatter]);

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
  maxItems: undefined,
  onBarClick: null,
};
