import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";
import { rankParentsByReplies } from "../static/hello-world/src/utils/commentRanking";
import { COMMENT_STATUS } from "../static/hello-world/src/constants";
import { getCommentBody } from "../static/hello-world/src/utils/commentRanking";

async function getInlineComments(pageId) {
  const res = await api
    .asApp()
    .requestConfluence(
      route`/wiki/api/v2/inline-comments?body-format=atlas_doc_format&resolution-status=open&status=current&limit=250`
    );

  const data = await res.json();

  if (!data || !Array.isArray(data.results)) {
    return [];
  }
  return data.results.filter((comment) => comment?.pageId === pageId);
}

const resolver = new Resolver();

export const handler = resolver.getDefinitions();

export async function getConfluenceComments(message) {
  const comments = await getInlineComments("1900549");

  const ranked = rankParentsByReplies(comments, {
    status: COMMENT_STATUS.OPEN,
  });
  const topComment = ranked.slice(0, 1)[0];
  const inlineRef = topComment.inlineMarkerRef; // IMPORTANT
  const title = topComment.inlineOriginalSelection;
  const parentCommentText = getCommentBody(topComment);
  const children = topComment.children;
  const childrenCommentTexts = [title, parentCommentText];

  for (const child of children) {
    childrenCommentTexts.push(getCommentBody(child));
  }

  return JSON.stringify(childrenCommentTexts);
}
