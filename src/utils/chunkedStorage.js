import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

const CHUNK_SIZE = 400000; // 400KB characters per chunk (safely under Firestore 1MB limit)

// Upload file Data URL in chunks to Firestore
export const uploadChunkedFile = async (wsId, dataUrl) => {
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkStr = dataUrl.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkDocId = `${wsId}_chunk_${i}`;
    await setDoc(doc(db, 'fileChunks', chunkDocId), {
      wsId,
      chunkIndex: i,
      totalChunks,
      data: chunkStr,
      createdAt: new Date().toISOString()
    });
  }
  return `chunked:${wsId}`;
};

// Reconstruct full Data URL from Firestore chunks
export const downloadChunkedFile = async (wsId) => {
  try {
    const q = query(
      collection(db, 'fileChunks'),
      where('wsId', '==', wsId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const chunks = [];
    snap.forEach(docSnap => chunks.push(docSnap.data()));
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const fullDataUrl = chunks.map(c => c.data).join('');
    return fullDataUrl;
  } catch (err) {
    console.error("Error downloading chunked file from Firestore:", err);
    return null;
  }
};

// Delete chunks when a worksheet is deleted
export const deleteChunkedFile = async (wsId) => {
  try {
    const q = query(collection(db, 'fileChunks'), where('wsId', '==', wsId));
    const snap = await getDocs(q);
    const deletePromises = [];
    snap.forEach(docSnap => deletePromises.push(deleteDoc(doc(db, 'fileChunks', docSnap.id))));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn("Error deleting file chunks:", err);
  }
};
