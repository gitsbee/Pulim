import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { readPost, type Post } from '../model';

type OriginalPost = { post: Post | null; status: 'loading' | 'ready' | 'error' };

export function useOriginalPost(id: string | null): OriginalPost {
  const [result, setResult] = useState<(OriginalPost & { id: string }) | null>(null);
  useEffect(() => {
    if (!db || !id || id.includes('/')) return;
    return onSnapshot(doc(db, 'posts', id), snapshot => {
      setResult({ id, post: readPost(snapshot), status: 'ready' });
    }, () => setResult({ id, post: null, status: 'error' }));
  }, [id]);
  if (result && result.id === id) return result;
  return { post: null, status: db && id && !id.includes('/') ? 'loading' : 'ready' };
}
