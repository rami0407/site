import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { defaultBooks, defaultUniform, defaultLetter } from '../data/schoolGuideData';

const GRADES = [
  { id: '1', name: 'الصف الأول' },
  { id: '2', name: 'الصف الثاني' },
  { id: '3', name: 'الصف الثالث' },
  { id: '4', name: 'الصف الرابع' },
  { id: '5', name: 'الصف الخامس' },
  { id: '6', name: 'الصف السادس' }
];

const BooksGuide = () => {
  const [activeSubTab, setActiveSubTab] = useState('books'); // 'books' or 'uniform'
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states loaded from Firebase (with local fallbacks)
  const [books, setBooks] = useState([]);
  const [uniforms, setUniforms] = useState([]);
  const [letter, setLetter] = useState(defaultLetter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuideData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Books
        const booksRef = collection(db, 'books');
        const booksSnap = await getDocs(booksRef);
        if (!booksSnap.empty) {
          const booksList = booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort by grade and subject/title
          setBooks(booksList);
        } else {
          setBooks(defaultBooks);
        }

        // 2. Fetch Uniform
        const uniformRef = collection(db, 'uniform');
        const uniformSnap = await getDocs(uniformRef);
        if (!uniformSnap.empty) {
          const uniformList = uniformSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUniforms(uniformList);
        } else {
          setUniforms(defaultUniform);
        }

        // 3. Fetch Letter
        const letterRef = collection(db, 'schoolGuide');
        const letterSnap = await getDocs(letterRef);
        if (!letterSnap.empty) {
          // Find doc 'letter'
          const letterDoc = letterSnap.docs.find(doc => doc.id === 'letter');
          if (letterDoc) {
            setLetter(letterDoc.data());
          }
        }
      } catch (err) {
        console.warn('Firebase guide data loading skipped (using offline fallbacks):', err.message);
        setBooks(defaultBooks);
        setUniforms(defaultUniform);
        setLetter(defaultLetter);
      } finally {
        setLoading(false);
      }
    };

    fetchGuideData();
  }, []);

  // Filter books by selected grade and search query
  const filteredBooks = books.filter(book => {
    const matchesGrade = book.grade === selectedGrade;
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  // Check if current grade has a notice
  const gradeNotice = (selectedGrade === '2' || selectedGrade === '3' || selectedGrade === '1') 
    ? 'الرجاء شراء جميع أجزاء الكتب من بداية السنة الدراسية.' 
    : null;

  return (
    <section className="books-section" id="books">
      <div className="section-header container">
        <span className="section-subtitle">التحضير للسنة الدراسية الجديدة</span>
        <h2 className="section-title">دليل الكتب المدرسية واللباس الموحد</h2>
        <div className="underline"><span></span></div>
      </div>

      <div className="guide-container container">
        {/* Welcome Letter Block */}
        <div className="welcome-letter-card">
          <div className="letter-header">
            <i className="fas fa-envelope-open-text letter-icon"></i>
            <h3>{letter.title}</h3>
          </div>
          <div className="letter-body">
            <p className="salutation">{letter.salutation}</p>
            <p className="letter-content">{letter.content}</p>
            <p className="valediction">{letter.valediction}</p>
          </div>
        </div>

        {/* Tab Toggle buttons */}
        <div className="guide-tab-toggle">
          <button 
            className={`tab-btn ${activeSubTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('books')}
          >
            <i className="fas fa-book"></i>
            قائمة الكتب المدرسية
          </button>
          <button 
            className={`tab-btn ${activeSubTab === 'uniform' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('uniform')}
          >
            <i className="fas fa-tshirt"></i>
            اللباس المدرسي الموحد
          </button>
        </div>

        {/* Tab 1: Books Section */}
        {activeSubTab === 'books' && (
          <div className="guide-tab-content books-tab">
            {/* Grades Navigator */}
            <div className="grades-selector">
              {GRADES.map(grade => (
                <button
                  key={grade.id}
                  className={`grade-btn ${selectedGrade === grade.id ? 'active' : ''}`}
                  onClick={() => setSelectedGrade(grade.id)}
                >
                  {grade.name}
                </button>
              ))}
            </div>

            {/* Search and Alert Panel */}
            <div className="books-control-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div className="search-box">
                <i className="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                  placeholder="ابحث عن كتاب أو مادة..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <a 
                href="/site/books_list.pdf" 
                download="قائمة_الكتب_المدرسية.pdf"
                className="btn download-pdf-btn"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  background: 'var(--accent)', 
                  color: 'var(--text-dark)', 
                  fontWeight: 700, 
                  textDecoration: 'none',
                  padding: '0.8rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-file-pdf"></i>
                تحميل القائمة الكاملة (PDF)
              </a>
              
              {gradeNotice && (
                <div className="grade-alert">
                  <i className="fas fa-exclamation-circle alert-icon"></i>
                  <span>{gradeNotice}</span>
                </div>
              )}
            </div>

            {/* Books Table / Responsive Cards */}
            {loading ? (
              <div className="tab-loader">
                <i className="fas fa-spinner fa-spin"></i>
                <p>جاري تحميل قائمة الكتب...</p>
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="books-table-wrapper">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>المادة</th>
                      <th>اسم الكتاب</th>
                      <th>المؤلف</th>
                      <th>سنة الإصدار</th>
                      <th>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => (
                      <tr key={book.id || `${book.grade}_${book.subject}_${book.title}`}>
                        <td className="subject-cell">
                          <span className="subject-badge">{book.subject}</span>
                        </td>
                        <td className="title-cell">{book.title}</td>
                        <td className="author-cell">{book.author || '—'}</td>
                        <td className="year-cell">{book.year || '—'}</td>
                        <td className="notes-cell">{book.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-books-found">
                <i className="fas fa-info-circle"></i>
                <p>لا توجد كتب تطابق بحثك في هذا الصف.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Uniform Section */}
        {activeSubTab === 'uniform' && (
          <div className="guide-tab-content uniform-tab">
            <div className="uniform-grid">
              {uniforms.map((uni, idx) => (
                <div className="uniform-card" key={uni.id || idx}>
                  <div className="uniform-card-color-stripe" style={{ backgroundColor: uni.colorCode || '#ddd' }}></div>
                  <div className="uniform-card-body">
                    <span className="uniform-grade-label">الصفوف: {uni.grades}</span>
                    <p className="uniform-description">{uni.description}</p>
                    <div className="uniform-footer">
                      <div className="uniform-color-dot" style={{ backgroundColor: uni.colorCode || '#ddd' }}></div>
                      <span>اللون المعتمد</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="uniform-general-note">
              <i className="fas fa-info-circle"></i>
              <p>نرجو التقيّد باللباس الموحد لغرس قيمة النظام والانتماء في نفوس طلابنا. لأي استفسار يرجى التواصل مع مربي الصف.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BooksGuide;
