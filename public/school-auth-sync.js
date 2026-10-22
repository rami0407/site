/**
 * Unified School Authentication & Player Sync (مدرسة مشيرفة الابتدائية)
 * Synchronizes student identity (Name, Grade, Passcode) across all games and pages.
 */
(function () {
  const SESSION_KEY = 'musheirifa_student_session';
  const NAME_KEY = 'school_unified_student_name';
  const CLASS_KEY = 'school_unified_student_class';
  const PIN_KEY = 'school_unified_student_pin';

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.isLoggedIn && parsed.fullName) {
          return parsed;
        }
      }
      const fallbackName = localStorage.getItem(NAME_KEY);
      if (fallbackName && fallbackName.trim()) {
        const fallbackClass = localStorage.getItem(CLASS_KEY) || 'الصف الثالث (أ)';
        const fallbackPin = localStorage.getItem(PIN_KEY) || '0000';
        return {
          fullName: fallbackName.trim(),
          studentClass: fallbackClass,
          idNumber: fallbackPin,
          role: 'student',
          roleIcon: '👨‍🎓',
          isLoggedIn: true
        };
      }
    } catch (e) {
      console.warn('Error reading school student session:', e);
    }
    return null;
  }

  function saveSession(data) {
    const isTeacher = (data.studentClass || '').includes('معلم');
    const isVisitor = (data.studentClass || '').includes('زائر');
    const role = isTeacher ? 'teacher' : isVisitor ? 'visitor' : 'student';
    const roleIcon = isTeacher ? '👨‍🏫' : isVisitor ? '👤' : '👨‍🎓';
    const roleLabel = isTeacher ? 'معلم' : isVisitor ? 'زائر' : 'طالب';

    const payload = {
      fullName: (data.fullName || '').trim(),
      idNumber: (data.idNumber || '0000').trim(),
      studentClass: data.studentClass || 'الصف الثالث (أ)',
      role: role,
      roleIcon: roleIcon,
      roleLabel: roleLabel,
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    localStorage.setItem(NAME_KEY, payload.fullName);
    localStorage.setItem(CLASS_KEY, payload.studentClass);
    localStorage.setItem(PIN_KEY, payload.idNumber);

    window.dispatchEvent(new Event('studentAuthChanged'));
    window.dispatchEvent(new CustomEvent('musheirifaStudentLoggedIn', { detail: payload }));
    updateBadgeUI();
    return payload;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(CLASS_KEY);
    localStorage.removeItem(PIN_KEY);
    window.dispatchEvent(new Event('studentAuthChanged'));
    updateBadgeUI();
    openModal();
  }

  // Inject Styles
  function injectStyles() {
    if (document.getElementById('school-auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'school-auth-styles';
    style.textContent = `
      #school-user-chip-wrap {
        position: fixed;
        bottom: 12px;
        left: 12px;
        z-index: 9999;
        font-family: 'Cairo', Tajawal, system-ui, sans-serif;
        pointer-events: auto;
      }
      .school-user-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(15, 23, 42, 0.92);
        border: 2px solid #facc15;
        border-radius: 99px;
        padding: 5px 12px 5px 8px;
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        transition: transform 0.2s, box-shadow 0.2s;
        direction: rtl;
      }
      .school-user-chip:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(250, 204, 21, 0.4);
      }
      .school-chip-switch-btn {
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fde047;
        border-radius: 99px;
        padding: 2px 8px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 800;
        transition: all 0.15s;
      }
      .school-chip-switch-btn:hover {
        background: #facc15;
        color: #0f172a;
      }
      /* Auth Modal */
      #school-auth-overlay {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.88);
        backdrop-filter: blur(10px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: 'Cairo', Tajawal, system-ui, sans-serif;
        direction: rtl;
        animation: schoolFadeIn 0.25s ease-out;
      }
      @keyframes schoolFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .school-auth-card {
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border: 3px solid #facc15;
        border-radius: 24px;
        padding: 24px;
        max-width: 440px;
        width: 100%;
        color: #ffffff;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(250, 204, 21, 0.3);
        position: relative;
        text-align: center;
        max-height: 94vh;
        overflow-y: auto;
      }
      .school-auth-card h3 {
        margin: 8px 0 4px;
        font-size: 21px;
        color: #facc15;
        font-weight: 900;
      }
      .school-auth-card p {
        margin: 0 0 16px;
        font-size: 12.5px;
        color: #cbd5e1;
        line-height: 1.5;
      }
      .school-auth-badge {
        font-size: 40px;
        margin-bottom: 2px;
      }
      .school-form-group {
        text-align: right;
        margin-bottom: 12px;
      }
      .school-form-group label {
        display: block;
        font-size: 12.5px;
        font-weight: 800;
        margin-bottom: 5px;
        color: #f8fafc;
      }
      .school-form-group input, .school-form-group select {
        width: 100%;
        padding: 10px 14px;
        background: #090e17;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: #ffffff;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
      }
      .school-form-group input:focus, .school-form-group select:focus {
        border-color: #facc15;
        box-shadow: 0 0 12px rgba(250, 204, 21, 0.4);
      }
      .school-submit-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: 2px solid #fef08a;
        color: #0f172a;
        font-weight: 900;
        font-size: 15px;
        border-radius: 14px;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
        transition: all 0.2s;
        margin-top: 6px;
        font-family: inherit;
      }
      .school-submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(245, 158, 11, 0.7);
        background: #fbbf24;
      }
      .school-visitor-btn {
        width: 100%;
        padding: 8px;
        background: transparent;
        border: 1px dashed rgba(255, 255, 255, 0.3);
        color: #94a3b8;
        font-weight: 700;
        font-size: 12px;
        border-radius: 10px;
        cursor: pointer;
        margin-top: 10px;
        font-family: inherit;
        transition: all 0.15s;
      }
      .school-visitor-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
      }
      .school-auth-error {
        background: rgba(239, 68, 68, 0.2);
        border: 1.5px solid #ef4444;
        color: #fca5a5;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 12px;
        margin-bottom: 12px;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
  }

  function updateBadgeUI() {
    injectStyles();
    let wrap = document.getElementById('school-user-chip-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'school-user-chip-wrap';
      document.body.appendChild(wrap);
    }

    const session = getSession();
    if (session && session.fullName) {
      wrap.innerHTML = `
        <div class="school-user-chip" title="المستخدم الموحد لمدرسة مشيرفة">
          <span>${session.roleIcon || '👨‍🎓'} <strong>${escapeHtml(session.fullName)}</strong> (${escapeHtml(session.studentClass)})</span>
          <button type="button" class="school-chip-switch-btn" id="btn-school-switch-user" title="تغيير المستخدم أو تسجيل الخروج">
            تبديل 🔁
          </button>
        </div>
      `;
      const btn = document.getElementById('btn-school-switch-user');
      if (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          openModal();
        };
      }
    } else {
      wrap.innerHTML = `
        <div class="school-user-chip" style="border-color:#38bdf8; cursor:pointer;" id="btn-school-login-chip">
          <span>🔑 <strong>تسجيل دخول الطالب</strong></span>
        </div>
      `;
      const loginChip = document.getElementById('btn-school-login-chip');
      if (loginChip) {
        loginChip.onclick = function (e) {
          e.stopPropagation();
          openModal();
        };
      }
    }
  }

  function openModal() {
    injectStyles();
    let overlay = document.getElementById('school-auth-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'school-auth-overlay';

    const current = getSession();
    const currName = current ? current.fullName : '';
    const currClass = current ? current.studentClass : 'الصف الثالث (أ)';
    const currPin = (current && current.idNumber && current.idNumber !== '0000') ? current.idNumber : '';

    overlay.innerHTML = `
      <div class="school-auth-card" onclick="event.stopPropagation()">
        <div class="school-auth-badge">🏫</div>
        <h3>تسجيل الدخول الموحد</h3>
        <p>مدرسة مشيرفة الابتدائية • سجّل بياناتك مرة واحدة لتلعب وتشارك في جميع ألعاب وفروع المدرسة بنفس الاسم!</p>
        
        <div id="school-auth-error-box" class="school-auth-error" style="display:none;"></div>

        <form id="school-auth-form">
          <div class="school-form-group">
            <label>👤 اسم الطالب / المستخدم (الاسم الثنائي أو الثلاثي):</label>
            <input type="text" id="school-input-name" placeholder="مثال: رامي أحمد ارفاعية" value="${escapeHtml(currName)}" required />
          </div>

          <div class="school-form-group">
            <label>🏫 اختر الصف الدراسي / الفئة:</label>
            <select id="school-input-class">
              <option value="الصف الأول (أ)">الصف الأول (أ)</option>
              <option value="الصف الأول (ب)">الصف الأول (ب)</option>
              <option value="الصف الثاني (أ)">الصف الثاني (أ)</option>
              <option value="الصف الثاني (ب)">الصف الثاني (ب)</option>
              <option value="الصف الثالث (أ)">الصف الثالث (أ)</option>
              <option value="الصف الثالث (ب)">الصف الثالث (ب)</option>
              <option value="الصف الرابع (أ)">الصف الرابع (أ)</option>
              <option value="الصف الرابع (ب)">الصف الرابع (ب)</option>
              <option value="الصف الخامس (أ)">الصف الخامس (أ)</option>
              <option value="الصف الخامس (ب)">الصف الخامس (ب)</option>
              <option value="الصف السادس (أ)">الصف السادس (أ)</option>
              <option value="الصف السادس (ب)">الصف السادس (ب)</option>
              <option value="معلم في المدرسة 👨‍🏫">👨‍🏫 معلم في المدرسة</option>
              <option value="زائر للموقع 👤">👤 زائر / ولي أمر</option>
            </select>
          </div>

          <div class="school-form-group">
            <label>🔑 رمز الدخول (4 إلى 9 أرقام أو رقم الهوية):</label>
            <input type="text" inputmode="numeric" id="school-input-pin" maxlength="9" placeholder="مثال: 1234 أو رقم الهوية" value="${escapeHtml(currPin)}" />
            <div style="font-size:11px; color:#94a3b8; margin-top:4px;">رمز الدخول: أي رمز سري خاص بك مكوّن من 4 إلى 9 أرقام لتأكيد هويتك.</div>
          </div>

          <button type="submit" class="school-submit-btn">
            انطلاق اللعبة وحفظ الهوية 🚀
          </button>

          <button type="button" class="school-visitor-btn" id="school-visitor-btn">
            متابعة كزائر سريع 👤
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const classSelect = document.getElementById('school-input-class');
    if (classSelect && currClass) {
      classSelect.value = currClass;
    }

    const form = document.getElementById('school-auth-form');
    const errBox = document.getElementById('school-auth-error-box');

    form.onsubmit = function (e) {
      e.preventDefault();
      const name = document.getElementById('school-input-name').value.trim();
      const sClass = document.getElementById('school-input-class').value;
      const pin = document.getElementById('school-input-pin').value.trim().replace(/\D/g, '');

      const isVisitor = sClass.includes('زائر');

      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length < 2) {
        showError('⚠️ يرجى كتابة الاسم كاملاً (الاسم الثنائي أو الثلاثي على الأقل).');
        return;
      }

      if (!isVisitor && (pin.length < 4 || pin.length > 9)) {
        showError('⚠️ رمز الدخول يجب أن يتكون من 4 إلى 9 أرقام (مثال: 1234 أو رقم الهوية).');
        return;
      }

      saveSession({
        fullName: name,
        studentClass: sClass,
        idNumber: pin || '0000'
      });

      overlay.remove();
    };

    document.getElementById('school-visitor-btn').onclick = function () {
      saveSession({
        fullName: 'زائر البوابة المدرسية',
        studentClass: 'زائر للموقع 👤',
        idNumber: '0000'
      });
      overlay.remove();
    };

    function showError(msg) {
      errBox.textContent = msg;
      errBox.style.display = 'block';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Public API
  window.MusheirifaAuth = {
    getSession: getSession,
    getStudentName: function () {
      const sess = getSession();
      return sess ? sess.fullName : '';
    },
    getStudentClass: function () {
      const sess = getSession();
      return sess ? sess.studentClass : '';
    },
    saveSession: saveSession,
    logout: logout,
    openModal: openModal
  };

  // Auto-init on page load
  window.addEventListener('DOMContentLoaded', function () {
    updateBadgeUI();
    // If no session exists, pop up modal automatically!
    if (!getSession()) {
      setTimeout(openModal, 400);
    }
  });

  // Also run immediately if DOM is already ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updateBadgeUI();
    if (!getSession()) {
      setTimeout(openModal, 400);
    }
  }
})();
