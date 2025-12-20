/**
 * Forge Backend Resolver
 * Defines serverless functions invokable from the frontend via @forge/bridge.
 */

import Resolver from "@forge/resolver";
// import { getInlineComments } from "../static/hello-world/src/api/confluence";
// import {
//   rankParentsByReplies,
//   getCommentLabel,
// } from "../static/hello-world/src/utils/commentRanking";

const resolver = new Resolver();

// Add resolver functions here if needed in the future

export const handler = resolver.getDefinitions();

export function getConfluenceComments(message) {
  // const comments = getInlineComments("1900549");
  // console.log("Thao testing comments in getConfluenceComments:", comments);
  // return comments;
  console.log("Thao testing getConfluenceComments???");
  return [
    {
      commentId: "1",
      content: "Thao testing 1",
      replies: 2,
    },
    {
      commentId: "2",
      content: "Thao testing 2",
      replies: 0,
    },
  ];
}

export function countReplies(comments) {
  // const ranked = rankParentsByReplies(comments, {
  //   status: COMMENT_STATUS.OPEN,
  // });
  // const topComment = ranked.slice(0, 1)[0];
  // const text = getCommentLabel(topComment, 100);
  // return text;
  let topComment = comments[0];

  for (const comment of comments) {
    if (comment.replies > topComment.replies) {
      topComment = comment;
    }
  }

  return topComment.content;
}
