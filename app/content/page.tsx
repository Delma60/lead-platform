'use client';

import { useState, useEffect } from 'react';

/**
 * /app/content
 * Social media & blog post management
 * TODO: Content calendar view (list or calendar grid)
 * TODO: Post drafts (LinkedIn/X) generation
 * TODO: Platform connections (LinkedIn API, X/Twitter API)
 * TODO: Scheduling queue for future posts
 * TODO: Performance tracking (likes/comments/reposts)
 * TODO: Content ideas backlog
 */
export default function ContentPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      // TODO: Create /api/content endpoint
      setPosts([]);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading content...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Content Calendar</h1>

      <div className="mb-4">
        {/* TODO: View toggle (list/calendar), filter by status/platform */}
      </div>

      {/* TODO: Content calendar/list with filters for draft/scheduled/posted */}
      {/* TODO: Post preview, scheduling modal, performance metrics */}

      {posts.length === 0 ? (
        <p className="text-gray-500">No content yet. Start drafting!</p>
      ) : (
        <div>{/* Content list goes here */}</div>
      )}
    </div>
  );
}
