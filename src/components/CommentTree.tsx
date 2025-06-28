import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Reply, Share, Trash2, ChevronDown, ChevronRight, Send, MoreHorizontal, Shield } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'

export interface TreeComment {
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
  children: TreeComment[]
  level: number
  isExpanded?: boolean
  repliesCount: number
}

interface CommentTreeProps {
  comments: TreeComment[]
  postId: string
  currentUserId: string
  currentUserAvatar?: string
  onCommentLike: (commentId: string) => Promise<void>
  onCommentDelete: (commentId: string) => Promise<void>
  onCommentReply: (parentId: string, content: string, replyTo?: { id: string; username: string; nickname: string }) => Promise<void>
  onViewProfile: (userId: string) => void
  maxDepth?: number
}

const CommentTree: React.FC<CommentTreeProps> = ({
  comments,
  postId,
  currentUserId,
  currentUserAvatar,
  onCommentLike,
  onCommentDelete,
  onCommentReply,
  onViewProfile,
  maxDepth = 5
}) => {
  const { formatDate } = useLanguage()
  const { showError, showSuccess } = useToast()
  
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; user?: { id: string; username: string; nickname: string } } | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loadingReply, setLoadingReply] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  // 自动展开有子评论的评论
  useEffect(() => {
    const autoExpand = new Set<string>()
    const processComments = (commentList: TreeComment[]) => {
      commentList.forEach(comment => {
        if (comment.children.length > 0) {
          autoExpand.add(comment.id)
          processComments(comment.children)
        }
      })
    }
    processComments(comments)
    setExpandedComments(autoExpand)
  }, [comments])

  // 切换评论展开/折叠
  const toggleExpanded = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  // 开始回复
  const startReply = (comment: TreeComment) => {
    setReplyingTo({ 
      commentId: comment.id,
      user: {
        id: comment.author.id,
        username: comment.author.username,
        nickname: comment.author.nickname
      }
    })
    setReplyContent(`@${comment.author.nickname} `)
    setTimeout(() => {
      replyInputRef.current?.focus()
      // 将光标移到末尾
      const len = replyContent.length
      replyInputRef.current?.setSelectionRange(len, len)
    }, 100)
  }

  // 取消回复
  const cancelReply = () => {
    setReplyingTo(null)
    setReplyContent('')
  }

  // 提交回复
  const submitReply = async () => {
    if (!replyingTo || !replyContent.trim()) {
      showError('请输入回复内容')
      return
    }

    try {
      setLoadingReply(true)
      await onCommentReply(replyingTo.commentId, replyContent.trim(), replyingTo.user)
      setReplyContent('')
      setReplyingTo(null)
      showSuccess('回复发布成功')
    } catch (error) {
      console.error('回复失败:', error)
      showError('回复失败')
    } finally {
      setLoadingReply(false)
    }
  }



  // 渲染单个评论
  const renderComment = (comment: TreeComment): React.ReactNode => {
    const isExpanded = expandedComments.has(comment.id)
    const hasChildren = comment.children.length > 0
    const shouldShowExpander = hasChildren || comment.repliesCount > comment.children.length

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative"
      >
        {/* 简化连接线 - 只有一条 */}
        {comment.level > 1 && (
          <div 
            className="absolute top-6 w-3 h-0.5 bg-gray-300 dark:bg-gray-500"
            style={{ left: `${Math.min(comment.level - 1, maxDepth - 1) * 24 + 17}px` }}
          />
        )}

        <div 
          className="flex space-x-3 py-2"
          style={{ marginLeft: `${Math.min(comment.level - 1, maxDepth - 1) * 24}px` }}
        >
          {/* 展开/折叠按钮 */}
          {shouldShowExpander && (
            <button
              onClick={() => toggleExpanded(comment.id)}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center mt-1 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}

          {/* 头像 */}
          <div 
            className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 cursor-pointer mt-1"
            onClick={() => onViewProfile(comment.author.id)}
          >
            {comment.author.avatar ? (
              <img 
                src={comment.author.avatar} 
                alt={comment.author.nickname} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {comment.author.nickname.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* 评论内容 */}
          <div className="flex-1 min-w-0">
            {/* 评论气泡 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              {/* 用户信息和操作 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span 
                    className="font-medium text-gray-900 dark:text-white cursor-pointer hover:underline"
                    onClick={() => onViewProfile(comment.author.id)}
                  >
                    {comment.author.nickname}
                  </span>
                  
                  {/* 管理员标签 */}
                  {comment.author.role === 'admin' && (
                    <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                      <Shield className="w-2.5 h-2.5 mr-1" />
                      管理员
                    </div>
                  )}

                  <span className="text-gray-500 dark:text-gray-400">·</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt, 'datetime')}
                  </span>
                  
                  {/* 层级指示器 */}
                  {comment.level > 1 && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">·</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        L{comment.level}
                      </span>
                    </>
                  )}
                </div>

                {/* 更多操作 */}
                <div className="flex items-center space-x-1">
                  {comment.canDelete && (
                    <button
                      onClick={() => onCommentDelete(comment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                      title="删除评论"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 评论文本 */}
              <div className="text-gray-900 dark:text-white text-sm">
                {comment.replyTo && (
                  <span className="text-blue-600 dark:text-blue-400 mr-1">
                    @{comment.replyTo.nickname}
                  </span>
                )}
                <span className="whitespace-pre-wrap">{comment.content}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <button
                onClick={() => onCommentLike(comment.id)}
                className={`flex items-center space-x-1 transition-colors hover:text-red-600 ${
                  comment.isLiked ? 'text-red-600' : ''
                }`}
              >
                <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
              </button>
              
              {comment.level < maxDepth && (
                <button
                  onClick={() => startReply(comment)}
                  className="flex items-center space-x-1 transition-colors hover:text-blue-600"
                >
                  <Reply className="w-3 h-3" />
                  <span>回复</span>
                </button>
              )}
              
              <button className="flex items-center space-x-1 transition-colors hover:text-green-600">
                <Share className="w-3 h-3" />
                <span>分享</span>
              </button>

              {/* 回复数量提示 */}
              {hasChildren && (
                <span className="text-gray-400">
                  {comment.repliesCount} 条回复
                </span>
              )}
            </div>

            {/* 回复输入框 */}
            <AnimatePresence>
              {replyingTo?.commentId === comment.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="flex space-x-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                      {currentUserAvatar ? (
                        <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">我</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        ref={replyInputRef}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="写回复..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault()
                            submitReply()
                          }
                          if (e.key === 'Escape') {
                            cancelReply()
                          }
                        }}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          Ctrl+Enter 发送，Esc 取消
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={cancelReply}
                            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            取消
                          </button>
                          <button
                            onClick={submitReply}
                            disabled={!replyContent.trim() || loadingReply}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            {loadingReply ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>发送</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 子评论 */}
            <AnimatePresence>
              {isExpanded && hasChildren && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 overflow-hidden"
                >
                  {comment.children.map(child => renderComment(child))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-2">
      {comments.map(comment => renderComment(comment))}
    </div>
  )
}

export default CommentTree 