import React from 'react';
import PropTypes from 'prop-types';
import Heading from "@atlaskit/heading";
import CommentRepliesChart from "./CommentRepliesChart";
import { COMMENT_STATUS } from "../constants";

/**
 * Sidebar component displaying comment thread activity chart.
 * Includes a toggle button to show/hide the sidebar on larger screens.
 * The sidebar is responsive and will automatically resize on smaller screens.
 * 
 * @param {Array} comments - Array of comment objects to display in the chart
 * @param {Function} onBarClick - Callback function when a chart bar is clicked
 */
export default function CommentActivitySidebar({ comments, onBarClick }) {
  return (
    <>
      {/* Hidden checkbox for controlling sidebar visibility via CSS */}
      <input
        type="checkbox"
        id="conf-sidebar-toggle"
        className="conf-sidebar-checkbox"
        aria-label="Toggle sidebar"
      />
      
      {/* Toggle button - shown on larger screens, allows users to collapse sidebar */}
      <label className="conf-sidebar-toggle" htmlFor="conf-sidebar-toggle">
        <span className="conf-chevron-left">‹</span> 
        <span className="conf-chevron-right">›</span>
      </label>

      {/* Sidebar container - fixed position on the left side */}
      <aside className="conf-sidebar">
        {/* Spacer to account for page header/other UI elements */}
        <div className="conf-sidebar-spacer"></div>
        
        {/* Chart section containing the heading and bar chart */}
        <div className="conf-chart-section">
          <Heading as="h2">Comment Thread Activity</Heading>
          <CommentRepliesChart
            comments={comments}
            status={COMMENT_STATUS.OPEN}
            maxItems={20}
            onBarClick={onBarClick}
          />
        </div>
      </aside>
    </>
  );
}

CommentActivitySidebar.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    body: PropTypes.object,
    parentCommentId: PropTypes.string,
    resolutionStatus: PropTypes.string,
    properties: PropTypes.object,
  })),
  onBarClick: PropTypes.func,
};

CommentActivitySidebar.defaultProps = {
  comments: [],
  onBarClick: null,
};

