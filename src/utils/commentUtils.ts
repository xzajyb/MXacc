import { TreeComment } from '../components/CommentTree'

interface FlatComment {
  id: string
  content: string
  author: {
    id: string
    username: string
    nickname: string
    avatar: string
    role?: string
  }
  replyTo?: {
    id: string
    username: string
    nickname: string
  }
  likesCount: number
  isLiked: boolean
  canDelete: boolean
  createdAt: string
  parentId?: string
  repliesCount: number
}

/**
 * 将平展的评论数组转换为树状结构
 * @param flatComments 平展的评论数组
 * @returns 树状评论数组
 */
export function buildCommentTree(flatComments: FlatComment[]): TreeComment[] {
  // 创建评论映射表
  const commentMap = new Map<string, TreeComment>()
  const rootComments: TreeComment[] = []

  // 初始化所有评论并添加到映射表
  flatComments.forEach(comment => {
    const treeComment: TreeComment = {
      ...comment,
      children: [],
      level: 1,
      isExpanded: true
    }
    commentMap.set(comment.id, treeComment)
  })

  // 构建树状结构
  flatComments.forEach(comment => {
    const treeComment = commentMap.get(comment.id)!
    
    if (comment.parentId) {
      // 有父评论，添加到父评论的children中
      const parentComment = commentMap.get(comment.parentId)
      if (parentComment) {
        parentComment.children.push(treeComment)
        // 设置层级
        treeComment.level = parentComment.level + 1
      } else {
        // 父评论不存在，作为根评论处理
        rootComments.push(treeComment)
      }
    } else {
      // 根评论
      rootComments.push(treeComment)
    }
  })

  // 递归设置正确的层级和排序
  function setLevelsAndSort(comments: TreeComment[], level: number = 1) {
    comments.forEach(comment => {
      comment.level = level
      // 按时间排序子评论
      comment.children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      // 递归处理子评论
      if (comment.children.length > 0) {
        setLevelsAndSort(comment.children, level + 1)
      }
    })
  }

  // 根评论按时间倒序排列（最新的在上面）
  rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  setLevelsAndSort(rootComments)

  return rootComments
}

/**
 * 在树状评论中查找特定评论
 * @param comments 树状评论数组
 * @param commentId 要查找的评论ID
 * @returns 找到的评论或null
 */
export function findCommentInTree(comments: TreeComment[], commentId: string): TreeComment | null {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment
    }
    if (comment.children.length > 0) {
      const found = findCommentInTree(comment.children, commentId)
      if (found) return found
    }
  }
  return null
}

/**
 * 更新树状评论中的特定评论
 * @param comments 树状评论数组
 * @param commentId 要更新的评论ID
 * @param updater 更新函数
 * @returns 更新后的评论数组
 */
export function updateCommentInTree(
  comments: TreeComment[], 
  commentId: string, 
  updater: (comment: TreeComment) => TreeComment
): TreeComment[] {
  return comments.map(comment => {
    if (comment.id === commentId) {
      return updater(comment)
    }
    if (comment.children.length > 0) {
      return {
        ...comment,
        children: updateCommentInTree(comment.children, commentId, updater)
      }
    }
    return comment
  })
}

/**
 * 在树状评论中添加新的回复
 * @param comments 树状评论数组
 * @param parentId 父评论ID
 * @param newComment 新评论
 * @returns 更新后的评论数组
 */
export function addReplyToTree(
  comments: TreeComment[], 
  parentId: string, 
  newComment: FlatComment
): TreeComment[] {
  return comments.map(comment => {
    if (comment.id === parentId) {
      const treeComment: TreeComment = {
        ...newComment,
        children: [],
        level: comment.level + 1,
        isExpanded: true
      }
      return {
        ...comment,
        children: [...comment.children, treeComment],
        repliesCount: comment.repliesCount + 1
      }
    }
    if (comment.children.length > 0) {
      return {
        ...comment,
        children: addReplyToTree(comment.children, parentId, newComment)
      }
    }
    return comment
  })
}

/**
 * 从树状评论中删除评论
 * @param comments 树状评论数组
 * @param commentId 要删除的评论ID
 * @returns 更新后的评论数组
 */
export function removeCommentFromTree(comments: TreeComment[], commentId: string): TreeComment[] {
  return comments.filter(comment => comment.id !== commentId).map(comment => {
    if (comment.children.length > 0) {
      return {
        ...comment,
        children: removeCommentFromTree(comment.children, commentId)
      }
    }
    return comment
  })
}

/**
 * 计算评论树的统计信息
 * @param comments 树状评论数组
 * @returns 统计信息
 */
export function getCommentTreeStats(comments: TreeComment[]): {
  totalComments: number
  maxDepth: number
  rootComments: number
} {
  let totalComments = 0
  let maxDepth = 0

  function traverse(commentList: TreeComment[], currentDepth: number = 1) {
    commentList.forEach(comment => {
      totalComments++
      maxDepth = Math.max(maxDepth, currentDepth)
      if (comment.children.length > 0) {
        traverse(comment.children, currentDepth + 1)
      }
    })
  }

  traverse(comments)

  return {
    totalComments,
    maxDepth,
    rootComments: comments.length
  }
} 