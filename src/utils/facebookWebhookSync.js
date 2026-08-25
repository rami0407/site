import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * ⚡ Facebook Webhook Live Synchronizer
 * Automatically receives incoming posts from Zapier / Make.com / Meta Webhooks
 * and publishes them directly as native news cards into Firestore!
 */
export const syncIncomingFacebookWebhookPost = async (postData) => {
  try {
    const postDate = new Date().toLocaleDateString('ar-EG', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    const title = postData.title || (postData.content ? postData.content.substring(0, 70) + '...' : 'منشور جديد من الفيس بوك');

    const newsItem = {
      title: title.startsWith('📱') ? title : `📱 ${title}`,
      content: postData.content || '',
      category: 'facebook',
      categoryLabel: 'منشور فيس بوك أوتوماتيكي',
      isFacebookPost: true,
      icon: 'fa-facebook-f',
      date: `تزامن أوتوماتيكي • ${postDate}`,
      fbLink: postData.link || postData.fbLink || 'https://www.facebook.com/MusheirifaElementarySchool',
      createdAt: new Date().toISOString(),
      source: 'Zapier/Make Automated Webhook'
    };

    // Save directly to Firestore
    const docRef = await addDoc(collection(db, 'news'), newsItem);
    console.log("✅ Facebook post automatically synced to Firestore news with ID:", docRef.id);
    return { success: true, id: docRef.id, newsItem };
  } catch (error) {
    console.error("❌ Error syncing Facebook webhook post to Firestore:", error);
    
    // Offline local fallback
    const localNews = localStorage.getItem('db_news');
    const existing = localNews ? JSON.parse(localNews) : [];
    const fallbackItem = {
      id: `webhook_${Date.now()}`,
      title: postData.title ? `📱 ${postData.title}` : '📱 منشور فيس بوك أوتوماتيكي',
      content: postData.content || '',
      category: 'facebook',
      isFacebookPost: true,
      icon: 'fa-facebook-f',
      date: 'تزامن أوتوماتيكي مباشر',
      fbLink: postData.link || 'https://www.facebook.com/MusheirifaElementarySchool',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('db_news', JSON.stringify([fallbackItem, ...existing]));
    return { success: true, id: fallbackItem.id, newsItem: fallbackItem };
  }
};
