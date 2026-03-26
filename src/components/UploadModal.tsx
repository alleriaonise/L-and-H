import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { cn } from '../lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      setError('Image size must be less than 800KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
      setMediaType('image');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        content: content.trim(),
        mediaType,
        ...(mediaType !== 'none' && mediaUrl ? { mediaUrl } : {}),
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      
      setTitle('');
      setContent('');
      setMediaType('none');
      setMediaUrl('');
      onClose();
    } catch (err: any) {
      console.error('Error adding document: ', err);
      setError(err.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-panel p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="font-serif text-2xl font-semibold mb-6">Share a Moment</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white/5 px-4 py-2.5 text-white placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  placeholder="Today's adventure..."
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">Story</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-white/5 px-4 py-2.5 text-white placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none"
                  placeholder="What did we learn today?"
                  maxLength={5000}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted">Attach Media</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('image-upload')?.click();
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white/5 py-3 text-sm font-medium transition-all hover:bg-white/10",
                      mediaType === 'image' && "border-accent text-accent bg-accent/10"
                    )}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('video');
                      setMediaUrl('');
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white/5 py-3 text-sm font-medium transition-all hover:bg-white/10",
                      mediaType === 'video' && "border-accent text-accent bg-accent/10"
                    )}
                  >
                    <Video className="h-4 w-4" />
                    Video URL
                  </button>
                </div>

                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {mediaType === 'video' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-2"
                  >
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white/5 px-4 py-2.5 text-white placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                      placeholder="Paste YouTube or Vimeo URL..."
                    />
                  </motion.div>
                )}

                {mediaType === 'image' && mediaUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border"
                  >
                    <img src={mediaUrl} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('none');
                        setMediaUrl('');
                      }}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-md hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-white text-black py-3 font-semibold transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Publish Update'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
