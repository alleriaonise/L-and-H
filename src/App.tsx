import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, LogOut, Plus, Heart } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';
import { UploadModal } from './components/UploadModal';
import { PostCard } from './components/PostCard';

interface Post {
  id: string;
  title: string;
  content: string;
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
  createdAt: any;
  authorId: string;
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Check if the logged-in user is the admin
      if (user && user.email === 'alleriaonise@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup was closed before completion.');
      } else {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white selection:bg-accent/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-serif text-lg font-medium tracking-wide">
            <Heart className="h-5 w-5 text-accent" />
            <span>L&H Homeschool</span>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Update</span>
              </button>
            )}
            
            {auth.currentUser ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition-all hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition-all hover:bg-white/10"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 pt-32 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
            </span>
            Documenting our journey
          </div>
          
          <h1 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Love & Happiness <br />
            <span className="text-gradient">Homeschooling</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted leading-relaxed max-w-2xl mx-auto">
            A beautiful, modern space to document our daily adventures, lessons learned, and the joy of growing together.
          </p>
        </motion.div>

        {/* Feed Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PostCard post={post} isAdmin={isAdmin} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center glass-panel rounded-3xl">
            <Heart className="h-12 w-12 text-white/20 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No updates yet</h3>
            <p className="text-muted max-w-sm">
              The journey is just beginning. Check back soon for our first homeschooling update!
            </p>
          </div>
        )}
      </main>

      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
