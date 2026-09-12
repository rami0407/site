import React, { useState, useEffect } from 'react';
import { 
  subscribeToSecurityAudit, 
  generateGuardPairingCode, 
  decryptSensitiveField,
  logSecurityEvent 
} from '../utils/securityAudit';

const SecurityHubAdminTab = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Guard Pairing Code State
  const [guardName, setGuardName] = useState('حارس البوابة الرئيسي');
  const [generatedPairingCode, setGeneratedPairingCode] = useState(null);
  const [isGeneratingPairing, setIsGeneratingPairing] = useState(false);

  // Field Decryptor Tool State
  const [cipherInput, setCipherInput] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');

  useEffect(() => {
    const unsub = subscribeToSecurityAudit((logs) => {
      setAuditLogs(logs);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleGeneratePairing = async () => {
    setIsGeneratingPairing(true);
    try {
      const code = await generateGuardPairingCode(guardName);
      setGeneratedPairingCode(code);
    } catch (err) {
      alert('حدث خطأ أثناء توليد كود الاقتران: ' + err.message);
    } finally {
      setIsGeneratingPairing(false);
    }
  };

  const handleDecryptField = () => {
    if (!cipherInput.trim()) {
      setDecryptedResult('');
      return;
    }
    const clean = cipherInput.trim();
    const plain = decryptSensitiveField(clean);
    setDecryptedResult(plain);
    logSecurityEvent({
      type: 'MANUAL_DECRYPTION_INSPECT',
      severity: 'INFO',
      actor: 'إدارة المدرسة',
      details: 'قام المدير بفك تشفير حقل يدوي عبر أداة التحقق في لوحة التحكم.'
    });
  };

  const filteredLogs = auditLogs.filter(item => {
    const matchesSev = filterSeverity === 'all' || item.severity === filterSeverity;
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      !searchQuery ||
      (item.type && item.type.toLowerCase().includes(query)) ||
      (item.actor && item.actor.toLowerCase().includes(query)) ||
      (item.details && item.details.toLowerCase().includes(query)) ||
      (item.browser && item.browser.toLowerCase().includes(query)) ||
      (item.platform && item.platform.toLowerCase().includes(query));
    return matchesSev && matchesQuery;
  });

  // Calculate statistics
  const totalEvents = auditLogs.length;
  const criticalEvents = auditLogs.filter(l => l.severity === 'CRITICAL').length;
  const warningEvents = auditLogs.filter(l => l.severity === 'WARNING').length;
  const lockoutsCount = auditLogs.filter(l => l.type === 'BRUTE_FORCE_LOCKOUT').length;
  const honeypotTraps = auditLogs.filter(l => l.type === 'BOT_TRAP_TRIGGERED').length;

  return (
    <div style={{ direction: 'rtl', fontFamily: 'inherit' }}>
      
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '24px',
        marginBottom: '2rem',
        boxShadow: '0 15px 35px rgba(15, 23, 42, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ background: '#10b981', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 900 }}>
                🛡️ الدرع الأمني الشامل نشط
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#e0e7ff', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>
                سجل التدقيق اللحظي (Audit Trail)
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 0.4rem 0' }}>
              مركز الأمان والإنذار المبكر ومراقبة التهديدات
            </h2>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', maxWidth: '700px', lineHeight: 1.6 }}>
              مراقبة عمليات الدخول، محاولات التخمين والقوة الغاشمة (Rate Limiting)، مصائد البوتات (Honeypots)، توثيق أجهزة الحراس الميدانية، وفك تشفير الحقول الحبيبية.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGeneratePairing}
              disabled={isGeneratingPairing}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '0.85rem 1.4rem',
                borderRadius: '14px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)'
              }}
            >
              <i className="fas fa-qrcode"></i> 🔑 توليد رمز اقتران جهاز الحارس
            </button>
          </div>
        </div>

        {/* Pairing Code Banner (if active) */}
        {generatedPairingCode && (
          <div style={{
            marginTop: '1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            border: '2px dashed #60a5fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 900, color: '#93c5fd' }}>
                🎉 تم توليد رمز اقتران مؤقت لجهاز الحارس ({guardName}):
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>
                أعطِ هذا الرمز لحارس البوابة لإدخاله في شاشة التحقق لاعتماد التابلت/الهاتف (صالح لمدة ساعة واحدة).
              </p>
            </div>
            <div style={{
              background: '#ffffff',
              color: '#1e3a8a',
              fontSize: '1.8rem',
              fontWeight: 900,
              padding: '0.5rem 1.5rem',
              borderRadius: '12px',
              letterSpacing: '4px',
              fontFamily: 'monospace'
            }}>
              {generatedPairingCode}
            </div>
          </div>
        )}
      </div>

      {/* Security Health Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: 'white', padding: '1.4rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>حماية التخمين (Rate Limiter)</span>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900 }}>نشط 5/15m</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
            {lockoutsCount > 0 ? `${lockoutsCount} إغلاق` : '0 اختراق'}
          </div>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
            قفل تلقائي 15 دقيقة بعد 5 محاولات خاطئة
          </p>
        </div>

        <div style={{ background: 'white', padding: '1.4rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>مصائد الروبوتات (Honeypots)</span>
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900 }}>حماية خفية</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: honeypotTraps > 0 ? '#b45309' : '#0f172a' }}>
            {honeypotTraps} روبوت ملتقط
          </div>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem', color: '#d97706', fontWeight: 700 }}>
            إسقاط هجمات السبام في استمارات التواصل والمواعيد
          </p>
        </div>

        <div style={{ background: 'white', padding: '1.4rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>التشفير الحبيبي (AES-256)</span>
            <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900 }}>ENC_V1</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#5b21b6' }}>
            مشفر بالكامل
          </div>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700 }}>
            تشفير الهواتف والرسائل في المتصفح قبل الحفظ
          </p>
        </div>

        <div style={{ background: 'white', padding: '1.4rem', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>إجمالي الأحداث الموثقة</span>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900 }}>سحابي</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0369a1' }}>
            {totalEvents} حدث
          </div>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
            {criticalEvents > 0 ? `⚠️ ${criticalEvents} حدث حرج بحاجة لمعاينة` : '✅ جميع العمليات طبيعية وآمنة'}
          </p>
        </div>
      </div>

      {/* Field Decryptor Tool Widget */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '1.75rem',
        border: '1px solid #e2e8f0',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🔓</span>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1e293b' }}>
            أداة فك التشفير الحبيبي الفوري للمدير (Instant Field Decryptor)
          </h3>
        </div>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#64748b' }}>
          إذا صادفت أي قيمة مشفرة في قاعدة البيانات (تبدأ بـ <code>ENC_V1:...</code>)، الصقها هنا لفك تشفيرها ومعاينة النص الأصلي فوراً:
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="الصق النص المشفر هنا (ENC_V1:...)"
            value={cipherInput}
            onChange={(e) => setCipherInput(e.target.value)}
            style={{ flex: 1, minWidth: '280px', fontFamily: 'monospace', fontSize: '0.9rem' }}
          />
          <button
            type="button"
            className="btn"
            onClick={handleDecryptField}
            style={{ background: '#7c3aed', color: 'white', padding: '0.75rem 1.4rem', borderRadius: '12px', fontWeight: 800 }}
          >
            🔓 فك الشفرة الآن
          </button>
        </div>

        {decryptedResult && (
          <div style={{
            background: '#f8fafc',
            border: '2px solid #ddd6fe',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            color: '#1e1b4b',
            fontSize: '0.95rem'
          }}>
            <span style={{ fontWeight: 800, color: '#6d28d9' }}>النص الأصلي المفكوك: </span>
            <strong style={{ wordBreak: 'break-all' }}>{decryptedResult}</strong>
          </div>
        )}
      </div>

      {/* Audit Log Table Section */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '1.75rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        
        {/* Table Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📋</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
              سجل التدقيق والأنشطة الأمنية اللحظي ({filteredLogs.length})
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Box */}
            <input
              type="text"
              className="form-input"
              placeholder="🔍 بحث بالاسم، العملية، المتصفح..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '230px', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            />

            {/* Severity Filter Chips */}
            <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'CRITICAL', label: '🚨 حرجة' },
                { id: 'WARNING', label: '⚠️ تحذيرات' },
                { id: 'INFO', label: 'ℹ️ معلومات' }
              ].map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilterSeverity(chip.id)}
                  style={{
                    background: filterSeverity === chip.id ? 'white' : 'transparent',
                    color: filterSeverity === chip.id ? '#0f172a' : '#64748b',
                    border: 'none',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: filterSeverity === chip.id ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Table */}
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛡️</div>
            <h4 style={{ margin: 0, fontWeight: 800, color: '#64748b' }}>لا توجد أحداث أمنية مسجلة مطابقة</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>كافة الأنظمة تعمل بأمان وسلامة تامة.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '110px' }}>مستوى الخطورة</th>
                  <th style={{ padding: '0.85rem 1rem' }}>نوع العملية</th>
                  <th style={{ padding: '0.85rem 1rem' }}>الفاعل / المستخدم</th>
                  <th style={{ padding: '0.85rem 1rem' }}>التفاصيل والملاحظات</th>
                  <th style={{ padding: '0.85rem 1rem', width: '130px' }}>الجهاز والمتصفح</th>
                  <th style={{ padding: '0.85rem 1rem', width: '150px' }}>التوقيت</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  let badgeBg = '#e0f2fe';
                  let badgeColor = '#0369a1';
                  let badgeText = 'ℹ️ عادي';

                  if (log.severity === 'CRITICAL') {
                    badgeBg = '#fee2e2';
                    badgeColor = '#dc2626';
                    badgeText = '🚨 حرج';
                  } else if (log.severity === 'WARNING') {
                    badgeBg = '#fef3c7';
                    badgeColor = '#b45309';
                    badgeText = '⚠️ تحذير';
                  }

                  return (
                    <tr key={log.id || `${log.timestamp}_${Math.random()}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: badgeBg,
                          color: badgeColor,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          display: 'inline-block'
                        }}>
                          {badgeText}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#1e293b' }}>
                        <code>{log.type}</code>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: 700 }}>
                        {log.actor || 'مجهول'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', maxWidth: '300px' }}>
                        {log.details || '-'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                        {log.platform || 'حاسوب'} / {log.browser || 'متصفح'}
                        {log.isMobile && <span style={{ marginLeft: '4px' }}>📱</span>}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('ar-EG', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default SecurityHubAdminTab;
