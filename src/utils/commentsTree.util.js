export const MAX_DEPTH = 5;

//decide donde se guarda la respuesta
export function resolveReplyTarget(parent, maxDepth = MAX_DEPTH) {
  if (parent.depth >= maxDepth) {
    return { parentId: parent.parentId, depth: parent.depth };
  }
  return { parentId: parent.id, depth: parent.depth + 1 };
}

function toNode(c) {
  const deleted = c.deletedAt !== null && c.deletedAt !== undefined;

  return {
    id: c.id,
    parentId: c.parentId,
    depth: c.depth,
    deleted,
    content: deleted ? null : c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    author: deleted
      ? null
      : {
          id: c.user.id,
          nickname: c.user.nickname,
          profilePicture: c.user.profilePicture ?? null,
        },
    replies: [],
  };
}

//ordena las respuestas en una lsita plana
export function buildTree(flat) {
  const nodes = new Map(flat.map((c) => [c.id, toNode(c)]));
  const roots = [];

  for (const node of nodes.values()) {
    const parent =
      node.parentId !== null ? nodes.get(node.parentId) : undefined;

    if (parent) parent.replies.push(node);
    else roots.push(node);
  }

  return roots.reverse();
}
