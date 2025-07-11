'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface User {
  id: string;
  username: string;
  name: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  replies: Comment[];
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  isSticky: boolean;
  isLocked: boolean;
  createdAt: string;
  user: User;
  comments: Comment[];
}

export default function DiscussionPage() {
  const params = useParams();
  const contestId = params.id as string;
  
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [showNewForm, setShowNewForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Mock current user - in real app, get from auth context
  const currentUser = { id: '1', username: 'testuser', name: 'Test User' };

  const fetchDiscussions = useCallback(async () => {
    try {
      const response = await fetch(`/api/discussions?contestId=${contestId}`);
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data.discussions);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    if (contestId) {
      fetchDiscussions();
    }
  }, [contestId, fetchDiscussions]);

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) return;

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId,
          userId: currentUser.id,
          title: newDiscussion.title,
          content: newDiscussion.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiscussions(prev => [data.discussion, ...prev]);
        setNewDiscussion({ title: '', content: '' });
        setShowNewForm(false);
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const handleCreateComment = async (discussionId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discussionId,
          userId: currentUser.id,
          content: replyContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiscussions(prev => 
          prev.map(discussion => 
            discussion.id === discussionId 
              ? { ...discussion, comments: [...discussion.comments, data.comment] }
              : discussion
          )
        );
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contest Discussion</h1>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Discussion
          </button>
        </div>

        {showNewForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Discussion</h2>
            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <input
                type="text"
                placeholder="Discussion title"
                value={newDiscussion.title}
                onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <textarea
                placeholder="What would you like to discuss?"
                value={newDiscussion.content}
                onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Discussion
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {discussions.map((discussion) => (
            <div key={discussion.id} className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {discussion.isSticky && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Pinned
                        </span>
                      )}
                      {discussion.isLocked && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {discussion.title}
                    </h3>
                    <p className="text-gray-700 mb-4">{discussion.content}</p>
                    <div className="text-sm text-gray-500">
                      By {discussion.user.name} ({discussion.user.username}) • {formatDate(discussion.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {discussion.comments.map((comment) => (
                    <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="text-sm text-gray-500 mb-1">
                        {comment.user.name} ({comment.user.username}) • {formatDate(comment.createdAt)}
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>

                {!discussion.isLocked && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    {replyingTo === discussion.id ? (
                      <form onSubmit={(e) => handleCreateComment(discussion.id, e)} className="space-y-3">
                        <textarea
                          placeholder="Write your comment..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Post Comment
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(discussion.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Reply to this discussion
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {discussions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No discussions yet</div>
              <div className="text-gray-400 text-sm mt-2">Be the first to start a discussion!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
