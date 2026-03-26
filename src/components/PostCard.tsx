import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Post {
  id: string;
  title: string;
  content: string;
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
  createdAt: any;
  authorId: string;
}

interface PostCardProps {
  post: Post;
  isAdmin: boolean;
}

export function PostCard({ post, isAdmin }: PostCardProps) {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', post.id));
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post.');
      }
    }
  };

  const renderVideo = (url: string) => {
    // Simple YouTube/Vimeo embed logic
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      embedUrl = url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
      embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
    } else if (url.includes('vimeo.com/')) {
      embedUrl = url.replace('vimeo.com/', 'player.vimeo.com/video/');
    }

    return (
      <div className="aspect-video w-full overflow-hidden rounded-t-2xl bg-black/50">
        <iframe
          src={embedUrl}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl glass-panel transition-all hover:border-white/20 hover:shadow-2xl hover:shadow-white/5"
    >
      {post.mediaType === 'image' && post.mediaUrl && (
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-black/50">
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {post.mediaType === 'video' && post.mediaUrl && renderVideo(post.mediaUrl)}

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between">
          <time className="text-xs font-medium uppercase tracking-wider text-muted">
            {post.createdAt?.toDate ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : 'Just now'}
          </time>
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted hover:text-red-400 rounded-full hover:bg-red-400/10"
              title="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <h3 className="font-serif text-2xl font-semibold leading-tight text-white mb-3">
          {post.title}
        </h3>
        
        <p className="text-muted leading-relaxed whitespace-pre-wrap flex-1">
          {post.content}
        </p>
      </div>
    </motion.article>
  );
}
