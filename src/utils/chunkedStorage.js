import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

const CHUNK_SIZE = 400000; // 400KB characters per chunk (safely under Firestore 1MB limit)

// Upload file Data URL in chunks to Firestore
export const uploadChunkedFile = async (wsId, dataUrl) => {
  const cleanWsId = wsId ? wsId.replace(/^(chunked:|local-file:)/, '') : `ws_${Date.now()}`;
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkStr = dataUrl.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkDocId = `${cleanWsId}_chunk_${i}`;
    await setDoc(doc(db, 'fileChunks', chunkDocId), {
      wsId: cleanWsId,
      chunkIndex: i,
      totalChunks,
      data: chunkStr,
      createdAt: new Date().toISOString()
    });
  }
  return `chunked:${cleanWsId}`;
};

// Reconstruct full Data URL from Firestore chunks
export const downloadChunkedFile = async (rawWsId) => {
  try {
    const cleanWsId = rawWsId ? rawWsId.replace(/^(chunked:|local-file:)/, '') : '';
    
    // Try clean ID query first
    let q = query(
      collection(db, 'fileChunks'),
      where('wsId', '==', cleanWsId)
    );
    let snap = await getDocs(q);

    // Fallback to raw ID query if empty
    if (snap.empty && rawWsId !== cleanWsId) {
      q = query(collection(db, 'fileChunks'), where('wsId', '==', rawWsId));
      snap = await getDocs(q);
    }

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
export const deleteChunkedFile = async (rawWsId) => {
  try {
    const cleanWsId = rawWsId ? rawWsId.replace(/^(chunked:|local-file:)/, '') : rawWsId;
    const q = query(collection(db, 'fileChunks'), where('wsId', '==', cleanWsId));
    const snap = await getDocs(q);
    const deletePromises = [];
    snap.forEach(docSnap => deletePromises.push(deleteDoc(doc(db, 'fileChunks', docSnap.id))));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn("Error deleting file chunks:", err);
  }
};
