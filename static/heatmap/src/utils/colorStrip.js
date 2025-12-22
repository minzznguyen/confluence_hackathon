/**
 * Color Scoring Module
 * Maps inline comments to colors based on their reply count ranking.
 */

import { rankParentsByReplies } from './commentRanking';
import { COMMENT_STATUS } from '../constants';

/**
 * Assigns scores (0-3) to nodes based on their position in the sorted array.
 * Top 25% get score 3 (darkest), bottom 25% get score 0 (lightest).
 * 
 * @param {Array} nodes - Sorted array of comment nodes
 * @returns {Array} Same nodes with added 'score' property
 */
export function calculateScore(nodes) {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  const totalNodes = nodes.length;
  
  return nodes.map((node, index) => {
    let score;
    const percentile = index / totalNodes;
    
    if (percentile < 0.25) {
      score = 3; // Top 25% - darkest red
    } else if (percentile < 0.5) {
      score = 2; // Next 25%
    } else if (percentile < 0.75) {
      score = 1; // Next 25%
    } else {
      score = 0; // Bottom 25% - lightest red
    }
    
    return {
      ...node,
      score
    };
  });
}

/**
 * Creates a map of inlineMarkerRef to score based on reply count ranking.
 * 
 * @param {Array} comments - Flat array of comments from API
 * @returns {Map} Map of inlineMarkerRef -> score (0-3)
 */
export function getInlineMarkerRefToScore(comments) {
  if (!comments || comments.length === 0) {
    return new Map();
  }

  // Get ranked parent comments (sorted by reply count descending)
  const rankedParents = rankParentsByReplies(comments, { status: COMMENT_STATUS.OPEN });
  
  // Calculate scores based on ranking
  const nodesWithScores = calculateScore(rankedParents);
  
  // Build map of inlineMarkerRef to score
  const scoreMap = new Map();
  nodesWithScores.forEach(node => {
    if (node.inlineMarkerRef) {
      scoreMap.set(node.inlineMarkerRef, node.score);
    }
  });
  
  return scoreMap;
}

/**
 * Creates a map of inlineMarkerRef to CSS color class based on reply count ranking.
 * 
 * @param {Array} comments - Flat array of comments from API
 * @returns {Map} Map of inlineMarkerRef -> CSS class name
 */
export function getInlineMarkerRefToColor(comments) {
  if (!comments || comments.length === 0) {
    return new Map();
  }

  const scoreMap = getInlineMarkerRefToScore(comments);
  const colorMap = new Map();
  
  // Map scores to CSS classes
  const scoreToClass = {
    0: 'comment-rank-0', // Lightest red
    1: 'comment-rank-1',
    2: 'comment-rank-2',
    3: 'comment-rank-3'  // Darkest red
  };
  
  scoreMap.forEach((score, inlineMarkerRef) => {
    const cssClass = scoreToClass[score] || 'comment-rank-0'; // Default to lightest
    colorMap.set(inlineMarkerRef, cssClass);
  });
  
  return colorMap;
}
