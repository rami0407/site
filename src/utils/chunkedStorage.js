import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

const CHUNK_SIZE = 350000; // 350KB characters per chunk (safely under Firestore 1MB limit)

// Upload file Data URL in chunks to sub-collection 'worksheets/{wsId}/chunks'
export const uploadChunkedFile = async (wsId, dataUrl) => {
  const cleanWsId = wsId ? wsId.replace(/^(chunked:|local-file:)/, '') : `ws_${Date.now()}`;
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkStr = dataUrl.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkDocRef = doc(db, 'worksheets', cleanWsId, 'chunks', `chunk_${i}`);
    await setDoc(chunkDocRef, {
      chunkIndex: i,
      totalChunks,
      data: chunkStr,
      createdAt: new Date().toISOString()
    });
  }
  return `chunked:${cleanWsId}`;
};

// Reconstruct full Data URL from sub-collection 'worksheets/{wsId}/chunks'
export const downloadChunkedFile = async (rawWsId) => {
  try {
    const cleanWsId = rawWsId ? rawWsId.replace(/^(chunked:|local-file:)/, '') : '';
    if (!cleanWsId) return null;

    const chunksRef = collection(db, 'worksheets', cleanWsId, 'chunks');
    const snap = await getDocs(chunksRef);
    
    if (snap.empty) {
      console.warn("No chunks found in sub-collection for wsId:", cleanWsId);
      return null;
    }

    const chunks = [];
    snap.forEach(docSnap => chunks.push(docSnap.data()));
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const fullDataUrl = chunks.map(c => c.data).join('');
    return fullDataUrl;
  } catch (err) {
    console.error("Error downloading chunked file from Firestore subcollection:", err);
    return null;
  }
};

// Delete sub-collection chunks when a worksheet is deleted
export const deleteChunkedFile = async (rawWsId) => {
  try {
    const cleanWsId = rawWsId ? rawWsId.replace(/^(chunked:|local-file:)/, '') : rawWsId;
    if (!cleanWsId) return;

    const chunksRef = collection(db, 'worksheets', cleanWsId, 'chunks');
    const snap = await getDocs(chunksRef);
    const deletePromises = [];
    snap.forEach(docSnap => deletePromises.push(deleteDoc(doc(db, 'worksheets', cleanWsId, 'chunks', docSnap.id))));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn("Error deleting file chunks:", err);
  }
};

// Convert Data URL / Base64 to Blob URL for 100% universal browser download
export const downloadBase64OrBlob = (dataUrl, filename) => {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 500);
  } catch (err) {
    console.error("Error creating Blob URL for download:", err);
    window.open(dataUrl, '_blank');
  }
};
