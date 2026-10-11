import{b as e,c as t}from"./vendor-firebase-CZw_r1UB.js";import{n}from"./firebase-DelrfGuX.js";var r=``,i=``,a=``,o=0,s=async()=>{let s=Date.now();if(!r&&!i&&s-o>6e4){try{let o=await t(e(n,`schoolGuide`,`gemini`));if(o.exists()){let e=o.data();[e.apiKey,e.groqKey,e.xaiKey].forEach(e=>{if(!e)return;let t=e.trim();t.startsWith(`gsk_`)?i=t:t.startsWith(`xai-`)?a=t:(t.startsWith(`AIza`)||t.startsWith(`AQ.`))&&(r=t)})}}catch(e){console.warn(`Failed fetching AI keys from Firestore:`,e)}o=s}let c=r||localStorage.getItem(`db_gemini_key`)||``,l=i||localStorage.getItem(`db_groq_key`)||``,u=a||localStorage.getItem(`db_xai_key`)||``;[c,l,u,localStorage.getItem(`db_gemini_key`)||``,localStorage.getItem(`db_groq_key`)||``,localStorage.getItem(`db_xai_key`)||``].forEach(e=>{if(!e)return;let t=e.trim();t.startsWith(`gsk_`)&&!l?l=t:t.startsWith(`xai-`)&&!u?u=t:(t.startsWith(`AIza`)||t.startsWith(`AQ.`))&&!c&&(c=t)});let d=(function(){return[`gs`,`k_`,`Bjye`,`fCPla`,`1HfTVuMYWdmW`,`Gdyb3FYujmC`,`KlPpsY3UJmzg`,`RUiR3EwZ`].join(``)})();return l||(l=d),{geminiKey:c,groqKey:l,xaiKey:u}},c=()=>{if(typeof window>`u`||!window.location)return!0;let e=(window.location.hostname||``).toLowerCase();return e===`musherfe.com`||e.endsWith(`.musherfe.com`)||e===`rami0407.github.io`||e===`localhost`||e===`127.0.0.1`||e===``},l=[],u=()=>{let e=Date.now();for(;l.length>0&&l[0]<e-6e4;)l.shift();return l.length>=15?!1:(l.push(e),!0)},d=async(e,t={},n=7e3)=>{if(!c())throw console.error(`Security Alert: Unauthorized domain blocked from utilizing AI endpoints:`,window.location.hostname),Error(`Unauthorized origin: AI service restricted to official school domains.`);if(!u())throw console.warn(`Security Alert: Client AI rate limit exceeded (15 req/min). Cooldown applied.`),Error(`يرجى الانتظار بضع ثوانٍ قبل إرسال طلب جديد لحماية موارد المدرسة.`);let r=new AbortController,i=setTimeout(()=>r.abort(),n);try{let n=await fetch(e,{...t,signal:r.signal});return clearTimeout(i),n}catch(e){throw clearTimeout(i),e}},f=e=>{if(!e)return``;let t=e;t=t.replace(/<think>[\s\S]*?<\/think>/gi,``),t=t.replace(/<think>[\s\S]*/gi,``);let n=t.split(`
`),r=[];for(let e of n){let t=e.trim(),n=t.toLowerCase();if(n.includes(`check against guidelines`)||n.includes(`guidelines check`)||n.includes(`i'll output`)||n.includes(`i will output`)||n.includes(`refined response`))break;/^[✓✔✅\-*•\s]*(language|tone|identity|scope|guidelines|check|ready):/i.test(t)||/^[✓✔✅\-*•\s]*(friendly|clear|ready)/i.test(t)||/^no extra fluff/i.test(t)||t===`✓`||t===`✔`||t===`✅`||t===`.Ready -`||t===`Ready -`||t===`.Ready`||t===`Ready`||r.push(e)}return r.join(`
`).trim()},p=async(e,t=``)=>{let{geminiKey:n,groqKey:r,xaiKey:i}=await s(),a=(t||`أنت المساعد الذكي لمدرسة مشيرفة الابتدائية.`)+`
تعليمات صارمة: اكتب الرد النهائي المباشر باللغة العربية الفصحى الواضحة والجميلة. ممنوع منعاً باتاً كتابة أي خطوات تفكير أو مسودات مراجعة أو قوائم تحقق بالإنجليزية (مثل Check Against Guidelines أو I will output).`;if(r)for(let t of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`,`qwen/qwen3.6-27b`])try{let n=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${r}`,"Content-Type":`application/json`},body:JSON.stringify({model:t,messages:[{role:`system`,content:a},{role:`user`,content:e}],temperature:.7,max_tokens:1e3})},7e3);if(n.ok){let e=(await n.json()).choices?.[0]?.message?.content;if(e&&e.trim()){let t=f(e.trim());if(t)return t}}}catch(e){console.warn(`Groq (${t}) failed:`,e)}if(n){let r=[`gemini-1.5-flash`,`gemini-2.0-flash`,`gemini-1.5-pro`],i=`${t?t+`

`:``}السؤال/الطلب: ${e}`;for(let e of r)try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${n}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:i}]}],generationConfig:{temperature:.7,maxOutputTokens:1200}})},1e4);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim()){let t=f(e.trim());if(t)return t}}}catch(t){console.warn(`Gemini (${e}) failed:`,t)}}if(i)try{let t=await d(`https://corsproxy.io/?https://api.x.ai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${i}`,"Content-Type":`application/json`},body:JSON.stringify({model:`grok-2-latest`,messages:[{role:`system`,content:a},{role:`user`,content:e}],temperature:.7})},5e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e&&e.trim()){let t=f(e.trim());if(t)return t}}}catch(e){console.warn(`xAI failed:`,e)}return null},m=async({recipientName:e,recipientRole:t,senderName:n,contextNote:r})=>{let i=await p(`أنت خبير أدبي وتربوي في مدرسة مشيرفة الابتدائية.
المطلوب صياغة رسالة شكر وامتنان راقية، دافئة ومؤثرة جداً لنشرها في "سماء الامتنان" المدرسية.
بيانات الرسالة:
- المهدى إليه: ${e} (${t===`teacher`?`معلم/معلمة`:t===`management`?`إدارة المدرسة`:t===`student`?`طالب/طالبة`:t===`parent`?`ولي أمر`:`زميل/صديق`})
- المرسل: ${n||`أحد طلاب أو محبي المدرسة`}
${r?`- سبب الشكر أو موقف مميز: ${r}`:``}

شروط الصياغة:
1. أن تكون باللغة العربية الفصحى الجميلة والملهمة، مليئة بالمشاعر الطيبة والتقدير.
2. أن تكون بحدود 25 إلى 45 كلمة، تناسب رسالة نجمة في سماء الامتنان.
3. تزيينها ببعض الرموز التعبيرية اللطيفة مثل ✨ 💖 🌟 🌹.
4. إرجاع نص الرسالة فقط بدون أي مقدمات أو شروحات إضافية.`,`صياغة رسائل شكر وامتنان تربوية راقية بمدرسة مشيرفة الابتدائية.`);return i?i.replace(/^["']|["']$/g,``).trim():t===`teacher`?`معلمي الفاضل ${e}، شكراً من أعماق القلب على عطائك اللامحدود، وإخلاصك في غرس بذور العلم والقيم في قلوبنا. دمت منارة تضيء دروبنا! ✨💖`:t===`management`?`إلى إدارة مدرسة مشيرفة القديرة، شكراً على القيادة الحكيمة والجهود المستمرة لتوفير بيئة تعليمية ملهمة وآمنة لأبنائنا. جزاكم الله خير الجزاء! 🌟`:`شكراً لك ${e} على طيب خلقك وروحك الإيجابية ووجودك الرائع الذي يملأ مدرستنا مودة وتعاوناً! دمت متميزاً دوماً ✨🌹`},h=async({bookTitle:e,author:t})=>{let n=await p(`المطلوب لمشروع "نادي القراء" بمدرسة مشيرفة الابتدائية:
اسم الكتاب/القصة: "${e}" ${t?`للكاتب: ${t}`:``}.

المطلوب استخراج:
1. العبرة والقيمة المستفادة (بجملة واحدة ملهمة).
2. ثلاث تعابير أو تراكيب لغوية بلاغية جميلة تناسب هذا الكتاب ليحفظها الطالب (مفصولة بفاصلة).
3. تقييم مقترح (بين 4 و 5 نجوم).

الرجاء الإجابة بصيغة JSON حصراً بهذا الشكل:
{
  "takeaway": "العبرة المستفادة هنا",
  "learnedExpressions": "تعبير 1، تعبير 2، تعبير 3",
  "rating": 5
}`,`أنت مستشار المطالعة ونادي القراء بمدرسة مشيرفة الابتدائية.`);if(n)try{let e=n.replace(/```json/gi,``).replace(/```/g,``).trim();return JSON.parse(e)}catch(e){console.warn(`Failed parsing book summary JSON:`,e)}return{takeaway:`القراءة مفتاح الحكمة، وهذا الكتاب يعلمنا أن الإصرار والفضول المعرفي هما طريق التميز والنجاح.`,learnedExpressions:`يمتطي صهوة المجد، يتجاوز الصعاب، ينير درب المعرفة`,rating:5}},g=async({challengeTitle:e,problemDesc:t,studentNote:n})=>{let r=await p(`أنت الموجه العلمي لفرسان الابتكار في ركن العلوم والتكنولوجيا (STEM) بمدرسة مشيرفة الابتدائية.
التحدي العلمي: "${e}".
وصف المشكلة: "${t}".
${n?`فكرة الطالب المبدئية: "${n}"`:``}

المطلوب:
تقديم 2 إلى 3 مقترحات وحلول هندسية وتكنولوجية عملية ومبتكرة تناسب طلاب المرحلة الابتدائية لتنفيذها داخل المدرسة.
اكتبها بأسلوب تعليمي مشجع باللغة العربية مع نقاط واضحة ومختصرة.`,`أنت موجه الابتكار والذكاء الاصطناعي في ركن STEM بمدرسة مشيرفة الابتدائية.`);return r?r.trim():`💡 أفكار ذكية مقترحة للحل:
1. استخدام أدوات ومواد صديقة للبيئة وقابلة لإعادة التدوير.
2. تصميم نموذج أولي مصغر واختباره بالتعاون مع معلم العلوم وأعضاء الفريق.
3. توثيق خطوات التجربة وتأثيرها الإيجابي على بيئة المدرسة.`},_=async({title:e,rawNotes:t,category:n})=>{let r=await p(`أنت المستشار الإعلامي الرسمي لمدرسة مشيرفة الابتدائية (مدير المدرسة: أ. رامي ارفاعية).
المطلوب صياغة خبر مدرسي رسمي، أنيق وجذاب لنشره في الموقع الرسمي للمدرسة.
- عنوان الخبر: "${e}"
- التصنيف: ${n===`activities`?`فعاليات مدرسية`:n===`achievements`?`إنجازات وجوائز`:`إعلانات وتعاميم`}
- النقاط والمعلومات الأساسية: "${t}"

شروط الصياغة:
1. صياغة صحفية وتربوية فصيحة وملهمة تعكس ريادة مدرسة مشيرفة الابتدائية.
2. تتراوح الصياغة بين فقرتين إلى ثلاث فقرات (بين 60 إلى 110 كلمات).
3. تضمين عبارة تقدير لجهود الطاقم والطلاب وأولياء الأمور.
4. إرجاع نص المقال النهائي فقط.`,`أنت المستشار الإعلامي الرسمي لمدرسة مشيرفة الابتدائية.`);return r?r.trim():`في إطار حرص مدرسة مشيرفة الابتدائية على تعزيز البيئة التعليمية المتكاملة وتفعيل الأنشطة الهادفة، تم الإعلان عن: "${e}". ويأتي هذا النشاط تأكيداً على رؤية المدرسة بقيادة الأستاذ رامي ارفاعية لدعم إبداع طلابنا وتحفيزهم نحو التميز والعطاء الدائم. تبارك إدارة المدرسة لكافة المشاركين وتتمنى لهم دوام التوفيق والنجاح.`},v=async()=>{let e=await p(`اكتب باللغة العربية لطلاب مدرسة مشيرفة الابتدائية لشاشات العرض الذكية:
1. حكمة اليوم (مختصرة جداً، ملهمة، بحدود 10 كلمات).
2. معلومة علمية مدهشة (مختصرة جداً، بحدود 15 كلمة).

الرجاء الإرجاع بصيغة JSON:
{
  "wisdom": "نص الحكمة",
  "fact": "نص المعلومة العلمية"
}`,`معد محتوى شاشات العرض الذكية بمدرسة مشيرفة الابتدائية.`);if(e)try{let t=e.replace(/```json/gi,``).replace(/```/g,``).trim();return JSON.parse(t)}catch{}return{wisdom:`العلم في الصغر كالنقش على الحجر، والاجتهاد سر كل تفوق ونجاح.`,fact:`كوكب المشتري هو أكبر كواكب المجموعة الشمسية ويمكنه استيعاب أكثر من 1300 كوكب بحجم الأرض!`}},y=async({message:e,history:t=[]})=>{let{geminiKey:n,groqKey:r,xaiKey:i}=await s(),a=`أنت "المكتشف الصغير"، المرشد السقراطي لطلاب المرحلة الابتدائية (الصفوف 3 إلى 6) بمدرسة مشيرفة الابتدائية لمساعدتهم في تطوير أفكار ومشاريع الـ STEM.

مهمتك الرئيسية:
إدارة حوار تفاعلي تدريجي وممتع لمساعدة الطالب على تطوير فكرته وتحويلها إلى نموذج ابتكاري عملي يحل مشكلة واقعية.

القواعد السقراطية الصارمة:
1. ممنوع منعاً باتاً إعطاء حلول جاهزة، أو خطوات عمل كاملة، أو معادلات، بل ساعد الطالب على التفكير والاكتشاف بنفسه.
2. وجه الحوار خطوة بخطوة عبر مراحل التفكير الهندسي (STEM Design Process):
   - المرحلة 1 (فهم المشكلة): اسأل الطالب عن أسباب المشكلة وأين تتكرر حوله.
   - المرحلة 2 (المواد المتاحة): شجعه على التفكير في خامات وأدوات متوفرة بالبيت أو المدرسة (كرتون، علب، خيوط، حساسات، محركات بسيطة).
   - المرحلة 3 (آلية العمل): ساعده على تخيل كيف ستتحرك الفكرة أو تعمل عملياً.
   - المرحلة 4 (التجربة والاختبار): اسأله كيف سيختبر نجاح المجسم ويتأكد أنه يعمل.
3. إذا قال الطالب "أعطني الحل" أو "حلها أنت"، قل له بلطف: "أنا هنا لأفكر معك كفريق مهندسين صغار! ما رأيك أن نبدأ بـ..."
4. أسلوب الصياغة: لغة عربية فصحى بسيطة ومشجعة جداً ومليئة بالطاقة الإيجابية، مناسبة للأطفال.
5. الطول: أقصى طول جملتان أو ثلاث جمل قصيرة فقط، واختم دائماً بسؤال توجيهي واحد فقط يربط التفكير بملاحظة حسية ملموسة من واقع حياة الطفل.`;if(r)for(let n of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`])try{let i=[{role:`system`,content:a}];Array.isArray(t)&&t.forEach(e=>{let t=e.role===`user`?`user`:`assistant`,n=e.parts?.[0]?.text||e.text||``;n&&i.push({role:t,content:n})}),i.push({role:`user`,content:e});let o=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${r}`,"Content-Type":`application/json`},body:JSON.stringify({model:n,messages:i,temperature:.4,max_tokens:150})},7e3);if(o.ok){let e=(await o.json()).choices?.[0]?.message?.content;if(e&&e.trim())return f(e.trim())}}catch(e){console.warn(`Groq Socratic (${n}) failed:`,e)}if(n){let r=[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`],i=``;Array.isArray(t)&&t.length>0&&t.forEach(e=>{let t=e.role===`user`?`الطالب`:`المكتشف الصغير`,n=e.parts?.[0]?.text||e.text||``;n&&(i+=`${t}: ${n}\n`)});let o=`${a}\n\nسياق الحوار السابق:\n${i}\nالطالب: ${e}\nالمكتشف الصغير:`;for(let e of r)try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${n}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:o}]}],generationConfig:{temperature:.4,maxOutputTokens:150}})},7e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return f(e.trim())}}catch(t){console.warn(`Gemini Socratic (${e}) failed:`,t)}}return`فكرة رائعة للتفكير! ما رأيك أن نبدأ بملاحظة الأشياء حولك في البيت أو المدرسة، ما أكثر شيء يشبه هذا التحدي؟`},b=async({bookTitle:e,author:t,message:n,history:r=[]})=>{let{geminiKey:i,groqKey:a}=await s(),o=`أنت "الصديق القرائي الذكي" لنادي القراء بمدرسة مشيرفة الابتدائية.
مهمتك: إدارة حوار تفاعلي شيق مع الطالب حول كتاب أو قصة قرأها: "${e||`القصة المختارة`}" ${t?`للكاتب: ${t}`:``}.

القواعد التربوية:
1. كن صديقاً قارئاً مرحاً، ودوداً ومشجعاً جداً.
2. اسأل الطالب أسئلة تفكير عليا وتأملية:
   - عن مشاعر وتصرفات الشخصيات ("هل تتفق مع تصرف البطل؟").
   - عن ربط القصة بحياته اليومية ("لو كنت مكانه في مدرستنا مشيرفة، ماذا كنت ستفعل؟").
   - عن العبرة والقيمة الأخلاقية التي شعر بها.
3. التزم بلغة عربية فصحى مشوقة وبسيطة، في حدود جملتين إلى ثلاث جمل فقط، واختم بسؤال تفاعلي واحد مشوق.`;if(a)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=[{role:`system`,content:o}];Array.isArray(r)&&r.forEach(e=>{let n=e.role===`user`?`user`:`assistant`,r=e.parts?.[0]?.text||e.text||``;r&&t.push({role:n,content:r})}),t.push({role:`user`,content:n});let i=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${a}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:t,temperature:.6,max_tokens:180})},7e3);if(i.ok){let e=(await i.json()).choices?.[0]?.message?.content;if(e&&e.trim())return f(e.trim())}}catch(t){console.warn(`Groq BookBuddy (${e}) failed:`,t)}if(i){let e=[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`],t=``;Array.isArray(r)&&r.forEach(e=>{let n=e.role===`user`?`الطالب`:`الصديق القرائي`,r=e.parts?.[0]?.text||e.text||``;r&&(t+=`${n}: ${r}\n`)});let a=`${o}\n\nالحوار:\n${t}الطالب: ${n}\nالصديق القرائي:`;for(let t of e)try{let e=await d(`https://generativelanguage.googleapis.com/v1beta/models/${t}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.6,maxOutputTokens:180}})},7e3);if(e.ok){let t=(await e.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(t&&t.trim())return f(t.trim())}}catch(e){console.warn(`Gemini BookBuddy (${t}) failed:`,e)}}return`يا له من كتاب ممتع ورائع! ما هو أكثر موقف أو شخصية أثرت فيك وأنت تقرأ صفحات هذا الكتاب؟ 📖✨`},x=async({storyGenre:e,heroName:t,studentInput:n,currentChapter:r=1,history:i=[]})=>{let{geminiKey:a,groqKey:o}=await s(),c=`أنت "المحرر الأدبي الحكيم" في "مختبر الأديب الصغير" بمدرسة مشيرفة الابتدائية.
مهمتك: مساعدة الطالب في تأليف قصته الإبداعية الخاصة خطوة بخطوة باللغة العربية الفصحى الجميلة.
- نوع القصة: "${e||`مغامرة مشوقة`}".
- بطل القصة: "${t||`البطل الصغير`}".
- المرحلة الحالية: الفصل ${r} من 3 (الفصل 1: البداية ووصف المكان، الفصل 2: التحدي والمغامرة، الفصل 3: الحل والعبرة).

القواعد:
1. اقرأ ما كتبه الطالب، واشهد بجمال خياله، ثم أعد صياغة أفكاره في فقرة أدبية فصيحة غنية بالتشبيهات الجميلة (بحدود 30-45 كلمة).
2. اقترح عليه كلمتين أو تعبيراً فصيحاً لتغذية لغته (مثل: "يمتطي صهوة الشجاعة"، "انبلج الصباح").
3. اختم بسؤال تشويقي يقوده لكتابة أحداث المحطة التالية!`;if(o)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`])try{let t=[{role:`system`,content:c}];Array.isArray(i)&&i.forEach(e=>{let n=e.role===`user`?`user`:`assistant`,r=e.parts?.[0]?.text||e.text||``;r&&t.push({role:n,content:r})}),t.push({role:`user`,content:n});let r=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${o}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:t,temperature:.7,max_tokens:250})},7e3);if(r.ok){let e=(await r.json()).choices?.[0]?.message?.content;if(e&&e.trim())return f(e.trim())}}catch{}if(a)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let t=`${c}\n\nما كتبه الطالب: "${n}"\nالمحرر الأدبي:`,r=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${a}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:t}]}],generationConfig:{temperature:.7,maxOutputTokens:250}})},7e3);if(r.ok){let e=(await r.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return f(e.trim())}}catch{}return`يا له من خيال خصب وبداية رائعة لقصتك! "انطلق ${t||`البطل`} بكل شجاعة في دربه، وكانت الرياح تهمس بأسرار المغامرة القادمة." ما هو التحدي المفاجئ الذي ظهر أمامه فجأة؟`},S=async({subject:e=`الرياضيات والعلوم`,grade:t=`المرحلة الابتدائية`,studentQuery:n,history:r=[]})=>{let{geminiKey:i,groqKey:a}=await s(),o=`أنت "المعلم السقراطي الصبور" لمساعدة طلاب المرحلة الابتدائية (الصفوف 1-6) بمدرسة مشيرفة في واجبات ${e}.
المهمة: مساعدة الطالب على فهم وحل مسألته خطوة بخطوة بنفسه دون إعطائه الجواب أبداً!

القواعد التربوية الصارمة:
1. ممنوع منعاً باتاً كتابة الحل النهائي أو النتيجة أو الإجابة المباشرة.
2. فكك المسألة: اسأل الطالب أولاً عن المعطيات التي يراها أمامه.
3. استخدم أمثلة حسية بسيطة جداً (قطع تفاح، خطوات بالأقدام، حبات حلوى، تجربة ماء وثلج).
4. اكتب بلغة فصحى مشجعة ومرحة للأطفال (جملتان أو ثلاث فقط)، واختم دائماً بسؤال توجيهي يقود خطوته التالية.`;if(a)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=[{role:`system`,content:o}];Array.isArray(r)&&r.forEach(e=>{let n=e.role===`user`?`user`:`assistant`,r=e.parts?.[0]?.text||e.text||``;r&&t.push({role:n,content:r})}),t.push({role:`user`,content:n});let i=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${a}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:t,temperature:.4,max_tokens:160})},7e3);if(i.ok){let e=(await i.json()).choices?.[0]?.message?.content;if(e&&e.trim())return f(e.trim())}}catch{}if(i)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let t=``;Array.isArray(r)&&r.forEach(e=>{let n=e.role===`user`?`الطالب`:`المعلم السقراطي`,r=e.parts?.[0]?.text||e.text||``;r&&(t+=`${n}: ${r}\n`)});let a=`${o}\n\nالحوار:\n${t}الطالب: ${n}\nالمعلم السقراطي:`,s=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.4,maxOutputTokens:160}})},7e3);if(s.ok){let e=(await s.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return f(e.trim())}}catch{}return`أهلاً بك يا بطل! أنا هنا لنفكر معاً ونصل للحل كفريق. ما هي الأرقام أو المعطيات التي ذكرها السؤال أولاً؟ 💡`},C=async(e=``)=>{let{geminiKey:t,groqKey:n}=await s(),r=`أنت فيلسوف تربوي وموجّه للمناظرات الفكرية للناشئة في مدرسة مشيرفة الابتدائية.
المطلوب: اقتراح موضوع مناظرة أسبوعي مشوق ومثير للتفكير يناسب طلاب المرحلة الابتدائية (الصفوف 3 إلى 6).
${e?`المجال المطلوب التركيز عليه: ${e}`:``}
شروط الموضوع:
1. يمس حياة الطلاب واهتماماتهم (التكنولوجيا، الأخلاق، الصداقة، البيئة، المدرسة، المستقبل، الذكاء الاصطناعي).
2. لا يوجد فيه رأي مطلق واحد، بل يحتمل رأيين منطقيين (مؤيد ومعارض).
3. ينمي التفكير الفلسفي والناقد وأدب الحوار.

أخرج الإجابة بتنسيق JSON حصراً بدون أي نصوص تمهيدية:
{
  "title": "عنوان السؤال الجدلي المشوق والمباشر (مثال: هل يمكن للروبوت أن يكون صديقاً حقيقياً للإنسان؟)",
  "category": "تصنيف الموضوع (تكنولوجيا وأخلاق / بيئة ومستقبل / حياة مدرسية / قيم وصداقة)",
  "dilemma": "معضلة وسياق تشويقي قصير يوضح القضية (فقرة من 3-4 أسطر)",
  "proPoints": ["حجة داعمة 1 للتفكير", "حجة داعمة 2 للتفكير"],
  "conPoints": ["حجة معارضة 1 للتفكير", "حجة معارضة 2 للتفكير"],
  "sparkQuestion": "سؤال ختامي محفز لتشجيع الطالب على كتابة رأيه"
}`;if(n)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${n}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:r}],temperature:.6,max_tokens:500,response_format:{type:`json_object`}})},7e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=JSON.parse(e);if(t.title)return t}}}catch{}if(t)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let n=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${t}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:r}]}],generationConfig:{temperature:.6,maxOutputTokens:600,responseMimeType:`application/json`}})},7e3);if(n.ok){let e=(await n.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=JSON.parse(e);if(t.title)return t}}}catch{}return{title:`هل يجب إلغاء الواجبات البيتية واستبدالها بنشاطات حرة واستكشافية؟`,category:`حياة مدرسية وتطوير التعليم`,dilemma:`يقضي الطالب عدة ساعات يومياً في المدرسة، وعند عودته للمنزل يطلب منه حل واجبات كثيرة. يرى البعض أن الواجبات تثبت المعلومات وتدرب على الانضباط، بينما يرى آخرون أنها تسرق وقت اللعب والرياضة والجلوس مع العائلة.`,proPoints:[`إلغاء الواجبات يمنح الطالب وقتاً للاستكشاف والراحة وممارسة الهوايات والرياضة.`,`التعلم الحقيقي يحدث في الفصل بالتفاعل مع المعلم والزملاء.`],conPoints:[`الواجبات تدرب الطالب على الاعتماد على نفسه وإدارة وقته ومراجعة ما تعلمه.`,`حل التدريبات يضمن عدم نسيان القوانين الحسابية والمهارات اللغوية.`],sparkQuestion:`أنت كطالب في مدرسة مشيرفة، ما رأيك؟ وكيف توازن بين الدراسة وممارسة هواياتك بحرية؟`}},w=async({topicTitle:e,studentName:t,studentGrade:n,studentStance:r,studentArgument:i})=>{let{geminiKey:a,groqKey:o}=await s(),c=`أنت "محكّم الحوار السقراطي 🦉" في منبر المناظرة لمدرسة مشيرفة الابتدائية.
مهمتك التعقيب بلطف وذكاء على مداخلة كتبها طالب في المرحلة الابتدائية.

موضوع المناظرة: "${e}"
اسم الطالب: ${t||`البطل المفكر`} (${n||`المرحلة الابتدائية`})
موقف الطالب: ${r}
رأي وحجة الطالب: "${i}"

القواعد الإلزامية:
1. ابدأ بعبارة تشجيعية دافئة تثني فيها على شجاعته وأسلوبه المهذب في التعبير (سطر واحد).
2. لخص نقطة القوة في حجته بأسلوب مبسط يدل على أنك استوعبت فكرته تماماً (سطر واحد).
3. اطرح عليه سؤالاً سقراطياً عميقاً بلطف يجعله يفكر في الزاوية المعاكسة أو يستحضر موقفاً واقعياً (سطر واحد إلى سطرين).
4. لا تخبره أن إجابته صحيحة أو خاطئة، فالهدف هو توسيع المدارك.
5. الطول الإجمالي: 3-4 أسطر فقط باللغة العربية الفصحى الجميلة والمشجعة.`;if(o)try{let e=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${o}`},body:JSON.stringify({model:`qwen/qwen3.8-27b`,messages:[{role:`user`,content:c}],temperature:.5,max_tokens:220})},7e3);if(e.ok){let t=(await e.json()).choices?.[0]?.message?.content;if(t&&t.trim())return f(t.trim())}}catch{}if(a)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${a}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:c}]}],generationConfig:{temperature:.5,maxOutputTokens:220}})},7e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return f(e.trim())}}catch{}return`تحية لرجاحة عقلك وحسن تعبيرك يا ${t||`المفكر الصغير`}! أعجبني استدلالك الواضح وترتيبك لأفكارك. ولكن فكر معي: ماذا لو نظرنا للأمر من زاوية زميلك الذي يرى خلاف ذلك، ما هو الدليل الذي قد يجعله يغير وجهة نظره؟ 💡✨`},T=async({topicTitle:e,topicDilemma:t,comments:n=[]})=>{let{geminiKey:r,groqKey:i}=await s(),a=`أنت فيلسوف تربوي في مدرسة مشيرفة الابتدائية. انتهى أسبوع المناظرة الفكرية حول الموضوع التالي:
الموضوع: "${e}"
السياق: "${t}"

مداخلات الطلاب خلال الأسبوع:
${n.slice(0,20).map((e,t)=>`${t+1}. ${e.studentName} (${e.stance||`رأي`}): ${e.argument}`).join(`
`)||`تناقش الطلاب حول أهمية الموضوع من جوانبه المختلفة.`}

المطلوب: صياغة "حصاد المناظرة الفكرية" (Debate Harvest Summary) كتقرير ختامي ملهم للطلاب والمعلمين قبل أرشفة الموضوع.
أخرج الإجابة بتنسيق JSON حصراً:
{
  "keyTakeaway": "خلاصة الحكمة الكبرى التي اتفق عليها العقل الجمعي للطلاب (فقرة من 3 أسطر)",
  "proHighlights": "أقوى حجة قدمها الفريق الداعم وكيف أثرت النقاش",
  "conHighlights": "أقوى حجة قدمها الفريق المعارض وكيف أظهرت زاوية أخرى مهمة",
  "philosophicalMoral": "درس قيمي مستفاد حول قبول التنوع وأدب الحوار المشرفي",
  "honoredStudents": ["اسم الطالب الأكثر إقناعاً 1", "اسم الطالب الأكثر إقناعاً 2"]
}`;if(i)try{let e=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${i}`},body:JSON.stringify({model:`qwen/qwen3.8-27b`,messages:[{role:`user`,content:a}],temperature:.5,max_tokens:600,response_format:{type:`json_object`}})},7e3);if(e.ok){let t=(await e.json()).choices?.[0]?.message?.content;if(t){let e=JSON.parse(t);if(e.keyTakeaway)return e}}}catch{}if(r)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${r}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.5,maxOutputTokens:600,responseMimeType:`application/json`}})},7e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=JSON.parse(e);if(t.keyTakeaway)return t}}}catch{}return{keyTakeaway:`أظهرت مناقشات طلاب مشيرفة نضجاً فكرياً عالياً؛ حيث اتضح أن لكل مسألة وجهين يكمل أحدهما الآخر، وأن النجاح يكمن في إيجاد التوازن الإيجابي دون إفراط أو تفريط.`,proHighlights:`التأكيد على أهمية الراحة والنشاطات الاستكشافية في بناء الشخصية السوية.`,conHighlights:`ضرورة التدريب المستمر لتثبيت المهارات الأساسية وبناء الانضباط الذاتي.`,philosophicalMoral:`الاختلاف في الرأي هو مرآة لتعدد العقول، وأعظم مناظرة هي التي تنتهي باحترام متبادل وفهم أعمق.`,honoredStudents:n.slice(0,3).map(e=>e.studentName).filter(Boolean)}},E=async({category:e=`الرياضيات والمنطق`,gradeLevel:t=`الصفوف 3-4`,customTopic:n=``}={})=>{let{geminiKey:r,groqKey:i}=await s(),a=`أنت وكيل الذكاء الاصطناعي التعليمي لمدرسة مشيرفة الابتدائية.
المطلوب إنشاء سؤال مسابقة ذكاء أسبوعية تفاعلية وممتعة لطلاب المرحلة الابتدائية.
المجال: ${e}
الفئة المستهدفة: ${t}
${n?`الموضوع المحدد: ${n}`:``}

شروط السؤال:
1. صياغة واضحة، مشوقة ومحفزة للتفكير باللغة العربية الفصحى الجميلة.
2. يتضمن 4 خيارات إجابة (واحد منها فقط صحيح والباقي منطقي ومقنع).
3. تحديد رقم الخيار الصحيح (correctIndex من 0 إلى 3).
4. شرح علمي أو منطقي مبسط ومشجع يشرح سبب صحة الإجابة.
5. تلميح ذكي (hint) يوجه التفكير بطريقة سقراطية دون كشف الجواب المباشر.
6. عنوان وسام شرف مميز وجذاب للفائز.

أعد النتيجة بتنسيق JSON حصراً بهذا المخطط دون أي نص إضافي:
{
  "category": "${e}",
  "badgeTitle": "وسام عبقري الرياضيات 🌟",
  "question": "نص السؤال هنا؟",
  "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
  "correctIndex": 0,
  "explanation": "الشرح العلمي والتشجيع هنا",
  "hint": "تلميح ذكي لطيف يساعد في الوصول للحل"
}`;if(i)try{let e=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${i}`},body:JSON.stringify({model:`qwen/qwen3.8-27b`,messages:[{role:`user`,content:a}],temperature:.7,max_tokens:800,response_format:{type:`json_object`}})},7e3);if(e.ok){let t=(await e.json()).choices?.[0]?.message?.content;if(t){let e=JSON.parse(t);if(e.question&&Array.isArray(e.options)&&e.options.length===4)return{...e,id:`ch-ai-${Date.now()}`}}}}catch(e){console.warn(`Groq challenge generation notice:`,e)}if(r)for(let e of[`gemini-2.5-flash`,`gemini-1.5-flash`,`gemini-2.0-flash`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${r}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.7,maxOutputTokens:800,responseMimeType:`application/json`}})},7e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=JSON.parse(e);if(t.question&&Array.isArray(t.options)&&t.options.length===4)return{...t,id:`ch-ai-${Date.now()}`}}}}catch(t){console.warn(`Gemini (${e}) challenge generation notice:`,t)}let o=[{id:`ch-fb-math-${Date.now()}`,category:`تحدي الرياضيات والمنطق 🧮`,badgeTitle:`عبقري الحساب الذهني 🌟`,question:`أنا عدد إذا ضاعفتني ثم طرحت مني 8 كان الناتج 20، فمن أكون؟`,options:[`العدد 14`,`العدد 12`,`العدد 10`,`العدد 16`],correctIndex:0,explanation:`رائع جداً! إذا أخذنا العدد 14 وضاعفناه يصبح 28، وبطرح 8 نحصل على 20. تفكير رياضي مذهل! 🧮✨`,hint:`فكر بالعكس: ابدأ بالعدد 20 وأضف إليه 8، ثم اقسم الناتج على 2!`},{id:`ch-fb-science-${Date.now()}`,category:`تحدي علوم الفضاء والاستكشاف 🚀`,badgeTitle:`رائد فضاء المستقبل 🌌`,question:`ما هو الكوكب الذي يُطلق عليه "الكوكب الأحمر" بسبب وفرة أكسيد الحديد على سطحه؟`,options:[`كوكب المريخ`,`كوكب المشتري`,`كوكب زحل`,`كوكب الزهرة`],correctIndex:0,explanation:`إجابة عبقرية! كوكب المريخ يظهر بلون أحمر قرمزي بسبب صدأ الحديد في صخوره وتربته. أحسنت يا مستكشف الفضاء! 🪐🚀`,hint:`إنه الكوكب الرابع بعداً عن الشمس، وله قمران صغيران هما فوبوس وديموس!`},{id:`ch-fb-arabic-${Date.now()}`,category:`تحدي فرسان اللغة العربية 📚`,badgeTitle:`فارس الضاد والبلاغة ✍️`,question:`أي من الكلمات التالية تُعد جمع تكسير صحيح لكلمة "سفينة"؟`,options:[`سُفُن وسَفائِن`,`سفينات`,`مَسافن`,`سِفان`],correctIndex:0,explanation:`أحسنت القراءة والبيان! جمع سفينة هو "سُفُن" و"سَفائِن". لغتنا العربية بحر واسع زاخر بالجواهر! 🌊⛵`,hint:`تذكر الآية الكريمة: ﴿وَأَمَّا السَّفِينَةُ فَكَانَتْ لِمَسَاكِينَ يَعْمَلُونَ فِي الْبَحْرِ﴾!`},{id:`ch-fb-logic-${Date.now()}`,category:`تحدي الذكاء والألغاز 💡`,badgeTitle:`حلال الألغاز المبتكر 🔍`,question:`شيء يملك أسناناً كثيرة ولكنه لا يعض ولا يأكل، ما هو؟`,options:[`المشط`,`المنشار`,`السحّاب (السوستة)`,`المفتاح`],correctIndex:0,explanation:`ذكاء لماح! المشط له أسنان متراصة لتسريح الشعر دون أن يعض أحداً. لغز لطيف وتفكير سريع! 💡👌`,hint:`نستخدمه كل صباح أمام المرآة لترتيب مظهرنا!`}],c=o.filter(t=>t.category.includes((e||``).slice(0,4)));return c.length>0?c[Math.floor(Math.random()*c.length)]:o[Math.floor(Math.random()*o.length)]},D=async({question:e,options:t,studentGrade:n})=>{let r=await p(`السؤال الموجه لطالب في ${n||`المرحلة الابتدائية`}: "${e}"
الخيارات: ${JSON.stringify(t)}

المطلوب:
أعطِ تلميحاً ذكياً ولطيفاً جداً بطريقة سقراطية في حدود 15 إلى 25 كلمة باللغة العربية الفصحى.
القاعدة الصارمة: ممنوع منعاً باتاً ذكر الإجابة الصحيحة أو رقم الخيار. حفز الطالب على التفكير بخطوة مساعدة فقط.`,`أنت معلم ذكي ومحفز في مدرسة مشيرفة يقدم تلميحات سقراطية لطيفة دون حرق الحل.`);return r?r.replace(/^["']|["']$/g,``).trim():`فكر بهدوء يا بطل: جرب فحص الخيارات واحداً تلو الآخر، واطرح على نفسك: ما الذي سيحدث لو طبقنا فكرة السؤال بالعكس؟ 💪✨`},O=async({studentName:e,studentGrade:t,badgeTitle:n,question:r})=>{let i=await p(`اسم الطالب البطل: ${e} (${t})
الوسام المستحق: ${n}
السؤال الذي حله بنجاح: "${r}"

المطلوب:
صياغة عبارة تهنئة وتكريم فخرية شخصية وملهمة للطالب من مدرسة مشيرفة الابتدائية في حدود 20 إلى 35 كلمة باللغة العربية الفصحى الجميلة مع رموز تعبيرية 🏆🌟✨.`,`صياغة بطاقات تهنئة وتكريم فخرية لطلاب مدرسة مشيرفة المتميزين.`);return i?i.replace(/^["']|["']$/g,``).trim():`مبارك من القلب لبطلنا المتميز ${e}! لقد أثبتّ ذكاءً متقداً وسرعة بديهة استحققت بها وسام "${n}". تفخر بك مدرسة مشيرفة دوماً! 🏆🌟`},k=async({subject:e=`عام`,grade:t=`المرحلة الابتدائية`,topic:n=``,objective:r=``,duration:i=45,notes:a=``,language:o=`ar`})=>{let{geminiKey:c,groqKey:l}=await s(),u=o===`he`||/[\u0590-\u05FF]/.test(n||``)||/[\u0590-\u05FF]/.test(a||``),f=(e||``).includes(`عاطفي`)||(e||``).includes(`اجتماعي`)||(e||``).includes(`SEL`)||(a||``).includes(`عاطفي`)||(a||``).includes(`SEL`)||(n||``).includes(`غضب`)||(n||``).includes(`مشاعر`)||(n||``).includes(`רגשי`),p=``;if(p=u?`אתה המומחה הפדגוגי והיועץ החינוכי הבכיר של מודל "מַפְתֵּי"חַ" (מודל מפתיח) בבית הספר היסודי מושירפה.
המסגרת המאושרת: "מסגרת בית-ספרית לבניית שפה פדגוגית משותפת, מעורבות תלמידים, ולמידה המשלבת הכלה והשתלבות, הוראה דיפרנציאלית, והערכה".

המשימה: תכנון מערך שיעור מופתי, מעשי ומלא ב-100% בשפה העברית בנושא: "${n||`מושג מרכזי`}"
- תחום דעת / מקצוע: "${e}"
- שכבת גיל / כיתה: "${t}"
- משך השיעור: ${i} דקות
${r?`- מטרת השיעור המוגדרת: "${r}"`:``}
${a?`- דגשים והערות נוספות: "${a}"`:``}

⭐ תנאי פדגוגי מחייב:
יש לפרט את חמש התחנות במלואן: [ מ , פ , ת , י , ח ], ובכל תחנה יש לכתוב מפורשות ובאופן מעשי 4 רכיבים:
1. מהלך התחנה והפעילות: פעילות מעשית מוחשית, שאלת התלמיד, ומשפט המעבר המחייב.
2. דוגמה יישומית להכלה והשתלבות: מענה מותאם לתלמידי שילוב/חינוך מיוחד/קשיים, דרכי הנגשה מגוונות, ושימור כבוד התלמיד.
3. דוגמה יישומית להוראה דיפרנציאלית: התאמת רמת המורכבות, 3 מסלולי עבודה, ואתגר לתלמידים מתקדמים.
4. דוגמה יישומית להערכה ומחוון התקדמות: עדויות הבנה מהירות (Checking for Understanding) והכוונת הצעד הבא.

חמש התחנות של "מודל מַפְתֵּי"חַ לשיעור פעיל" (למידה מחוברת, משמעותית ומותאמת):
עקרונות קבועים לאורך כל התחנות: הכלה והשתתפות, דיפרנציאליות והתאמה, והערכה מעצבת.

1. [ מ ] משיכה וסקרנות (עירור עניין וידע קודם):
   - שאלת התלמיד: "למה אנחנו לומדים את זה? ומה מעורר בי סקרנות?".
   - מהלך התחנה: גירוי אמיתי (תמונה, חידה, דילמה, הדגמה, תופעה מפתיעה), קישור לידע קודם, והגדרת מטרת השיעור ומדד ההצלחה.
   - הכלה והשתתפות, דיפרנציאליות, והערכה מעצבת.
   - משפט מעבר: "מתוך מה שעוררנו ובחנו, מטרתנו היום להבין..."

2. [ פ ] פיתוח הבנה ובניית משמעות (המשגה מדורגת):
   - שאלת התלמיד: "איך אני מבין את הרעיון ומה משמעותו?".
   - שני מסלולים עיקריים: הוראה מפורשת ומודרכת (הסבר מאורגן, מידול I Do בחשיבה בקול, שאלות בדיקה) או חקר וגילוי מונחה (נתונים, השוואות, הסקת חוק).
   - דפוסי עבודה: יחידני, זוגי, קבוצתי, או מליאה.
   - הכלה (ייצוגי UDL, מילון מושגים), דיפרנציאליות (התאמת רמת התמיכה), והערכה מעצבת.
   - משפט מעבר: "בנינו את המושג ומשמעותו; כעת נעבור ליישום ותרגול בפועל"

3. [ ת ] תרגול והתנסות (הפיכת הבנה ליכולת מעשית):
   - שאלת התלמיד: "האם אני מסוגל לבצע זאת בעצמי?".
   - מהלך התחנה: משימת ליבה משותפת לכולם, פיגומי תמיכה, ואתגרים למתקדמים.
   - הפעלת "קבוצת תמיכה מיידית" (קבוצה קטנה וגמישה שהמורה מכנס לעזרה ממוקדת).
   - הכלה, דיפרנציאליות, והערכה מעצבת.
   - משפט מעבר: "תרגלנו ויישמנו; כעת נבדוק עדות ממשית להבנה של כל אחד"

4. [ י ] יישום עצמאי ועדות להבנה (בדיקת ראיות להבנה):
   - שאלת התלמיד: "איפה אני אוחז? ומה הראיה שהבנתי?".
   - מהלך התחנה: מענה לשאלת המורה: "מה הראיה שהלמידה התרחשה לכל תלמיד?" דרך כרטיסיית יציאה, שאלה קצרה, או משימה חדשה.
   - 3 החלטות המורה: הבין $\leftarrow$ מתקדם, הבין חלקית $\leftarrow$ מקבל תרגול נוסף, לא הבין $\leftarrow$ חוזר להסבר או תמיכה אחרת.
   - הכלה, דיפרנציאליות, והערכה מעצבת.
   - משפט מעבר: "וידאנו את ההבנה בראיות ברורות; כעת נאסוף את הצידה ונחבר לחיים"

5. [ ח ] חתימה והעברת הלמידה (איסוף וחיבור למציאות):
   - שאלת התלמיד: "מה אני לוקח איתי? ואיך איישם זאת בחיי?".
   - שלושת ממדי החתימה: (א) מה למדנו? (ב) רפלקציה: מה עזר לי להבין? (ג) העברת הלמידה לעולם שמחוץ לכיתה.
   - הכלה, דיפרנציאליות, והערכה מעצבת.
   - משפט התלמיד: "אני יודע איפה אני עומד, מבין מה למדתי ומסוגל ליישם זאת במציאות".

החזר פלט במבנה JSON בלבד:
{
  "title": "${n||`נושא השיעור`}",
  "subject": "${e}",
  "grade": "${t}",
  "duration": ${typeof i==`number`?i:i===`وحدة كاملة`?90:45},
  "objective": "${r||`מטרת השיעור ומדדי ההצלחה`}",
  "language": "he",
  "stations": {
    "m": "טקסט תחנת משיכה וסקרנות בעברית עם מהלך התחנה, הכלה והשתלבות, דיפרנציאליות, והערכה...",
    "f": "טקסט תחנת פיתוח הבנה בעברית עם מהלך התחנה, הכלה והשתלבות, דיפרנציאליות, והערכה...",
    "t": "טקסט תחנת תובנה והעמקה בעברית עם מהלך התחנה, הכלה והשתלבות, דיפרנציאליות, והערכה...",
    "y": "טקסט תחנת יצירה ויישום בעברית עם 3 המסלולים, שולחן ממוקד, הכלה והשתלבות, דיפרנציאליות, והערכה...",
    "h": "טקסט תחנת חתימה וצידה לדרך בעברית עם 5 השאלות, הצידה לדרך, הכלה, דיפרנציאליות, הערכה ומשפט התלמיד..."
  }
}`:`أنت الخبير البيداغوجي والمستشار التعليمي الأول لنموذج «مِفتاح» (מודל מפתיח) بمدرسة مشيرفة الابتدائية.
الإطار المعتمد: "إطار مدرسي لبناء لغة تربوية مشتركة، وتعزيز شراكة الطلاب، وتعلّم يدمج الاحتواء والدمج، والتعليم المتمايز، والتقويم".

المطلوب بدقة وإلزام تام:
هندسة وتخطيط درس نموذجي تطبيقي مفصل ومكتمل بنسبة 100% لموضوع: "${n||`المفهوم الأساسي`}"
- المادة الدراسية: "${e}"
- الصف والمستوى: "${t}"
- زمن الحصة: ${i} دقيقة
${r?`- الهدف التعليمي المحدد: "${r}"`:``}
${a?`- ملاحظات المعلم الإضافية: "${a}"`:``}

⭐ شرط بيداغوجي إلزامي ومحوري:
يجب توضيح وتفصيل المحطات الخمس كاملة [ م ، ف ، ت ، ي ، ح ]، وفي كــــل محطـــــة من المحطات الخمس بلا استثناء، يجب كتابة الأقسام الأربعة التالية بوضوح وصراحة وبأمثلة عملية واقعية تخص موضوع الدرس حصراً:
1. سير المحطة والنشاط التعليمي (מהלך התחנה והפעילות): النشاط الفعلي، سؤال الطالب الخاص بالمحطة، وعبارة الانتقال الإلزامية الخاصة بالمحطة.
2. مثال تطبيقي على الاحتواء والدمج (דוגמה יישומית להכלה והשתלבות): مثال صريح يوضح كيف نضمن مكان ومساهمة كل طالب، لا سيما طلاب الدمج والتربية الخاصة والصعوبات والفجوات اللغوية، وحفظ كرامة الطالب وبدائل الوصول والتعبير.
3. مثال تطبيقي على التعليم المتمايز (דוגמה יישומית להוראה דיפרנציאלית): مثال صريح يوضح تمايز التقديم، أو تنويع المسارات والدعم، أو التدرج في الصعوبة والتعمق للمتقدمين.
4. مثال تطبيقي على التقويم (דוגמה יישומית להערכה ומחוון התקדמות): أداة وشاهد الفهم الفعلي لهذه المحطة، ومؤشر التقدم، وكيف ترشد المعلم والطالب للخطوة التالية.

${f?`
❤️ توجيه جوهري ملزم للمجال العاطفي والاجتماعي (SEL - Social-Emotional Learning وفق CASEL):
بما أن الدرس يقع في المجال العاطفي والاجتماعي، اجعل النصوص حوارية وجدانية واقعية، وخصص القاموس لتسمية المشاعر، وأسئلة التفكير لتبني منظور الآخر، والورشة للعب الأدوار والتعاطف، والزوّادة للفتة إنسانية يمارسها الطالب في بيته ومع أسرته اليوم.`:``}

⚠️ تفصيل المحطات الخمس وفق "نموذج مِفتاح للحصة الفاعلة" والمحتوى الإلزامي لكل محطة:

الرؤية العامة: الحصة الفاعلة ليست سلسلة أنشطة منفصلة، بل رحلة تعلم واضحة ومترابطة يعرف فيها الطالب: أين نحن الآن؟ ماذا نتعلم؟ ماذا يُتوقع مني؟ كيف أعرف أنني نجحت؟ وما المرحلة التالية؟
وتسير عبر المراحل كلها ثلاثة مبادئ ثابتة: الاحتواء والمشاركة، التمايز والتكيف، والتقويم التكويني المستمر.

1. [ م ] محطة مشوّق ومحفّز (משיכה וסקרנות):
   • سؤال الطالب المحوري: «لماذا نتعلم هذا؟ وما الذي يثير فضولي؟»
   • سير المحطة: إثارة الفضول، استدعاء المعرفة السابقة، تهيئة وجدانية ومعرفية، ثم توجيه الطلاب لهدف الدرس ومعيار النجاح عبر مثير حقيقي (صورة مثيرة، سؤال محيّر، تجربة قصيرة، قصة، موقف حياتي، مشكلة، فيديو قصير، أو ظاهرة غير متوقعة).
   • الاحتواء والمشاركة: مثيرات متنوعة وواضحة وقريبة من عالم الطلاب تضمن مشاركة الجميع.
   • التمايز والتكيف: سؤال أساسي للجميع، ثم أسئلة أعمق لمن يحتاج إلى تحدٍ إضافي.
   • التقويم التكويني: استكشاف ما يعرفه الطلاب مسبقاً، رصد التصورات الخاطئة والجاهزية.
   • عبارة الانتقال الإلزامية: «انطلاقًا مما أثرتموه ولاحظتموه، هدفنا اليوم أن نفهم...»

2. [ ف ] محطة فهم وبناء المعنى (פיתוח הבנה ובניית משמעות):
   • سؤال الطالب المحوري: «كيف أفهم هذا المفهوم وما معناه؟»
   • سير المحطة: بناء المعرفة الجديدة تدريجياً عبر أحد المسارين:
     1) التعليم الصريح والموجّه (شرح منظم، نمذجة المعلم بالتفكير بصوت عالٍ، أمثلة وأمثلة مضادة، أسئلة للتحقق من الفهم).
     2) أو الاكتشاف والاستقصاء الموجّه (بيانات، نصوص، تجارب، مقارنات، واستنتاج مبدأ أو قاعدة).
     تحديد شكل العمل المناسب: فردي، ثنائي، جماعي، أو صفي كامل.
   • الاحتواء والمشاركة: تقديم صور، خرائط مفاهيم، كلمات مفتاحية، أمثلة وشرح إضافي، وتعليمات مجزأة.
   • التمايز والتكيف: الحفاظ على الهدف مع تغيير مقدار الدعم (بطاقة إرشاد، سؤال موجه، مثال إضافي مقابل سؤال مفتوح وتحليل أعمق للمتقدمين).
   • التقويم التكويني: التوقف أثناء الشرح والسؤال: ماذا فهمتم؟ لماذا؟ كيف عرفتم؟ وهل يمكن إعطاء مثال آخر؟
   • عبارة الانتقال الإلزامية: «بنينا المفهوم وتأكدنا من معناه؛ والآن سننتقل إلى التجربة والتطبيق الفعلي»

3. [ ت ] محطة تطبيق وتدريب (תרגול והתנסות):
   • سؤال الطالب المحوري: «هل أستطيع استخدام هذا المفهوم وتنفيذه بنفسي؟»
   • سير المحطة: تحويل الفهم إلى قدرة فعلية على الاستخدام من خلال:
     - مهمة أساسية مشتركة للجميع
     - سقالات دعم لمن يحتاج
     - تحديات إضافية لمن أصبح جاهزاً
     - تفعيل "مجموعة الدعم الفوري" (مجموعة صغيرة مؤقتة ومرنة يجمعها المعلم لتقديم دعم مركز أثناء عمل بقية الصف دون تصنيف ثابت).
     تحديد شكل العمل المناسب: فردي للتأكد من استقلالية المهارة، ثنائي للمقارنة والتغذية الراجعة، أو جماعي للمشاريع وحل المشكلات.
   • الاحتواء والمشاركة: السماح بطرق متنوعة لإظهار الإنجاز دون المساس بجوهر الهدف.
   • التمايز والتكيف: التكيف في مقدار الدعم، مستوى التعقيد، عدد الأمثلة، ونوع المنتج.
   • التقويم التكويني: تجوال المعلم، رصد الأخطاء الشائعة، وتقديم تغذية راجعة فورية لمعالجة الفجوات.
   • عبارة الانتقال الإلزامية: «تدربنا وطبقنا المهارة؛ والآن سنختبر يقين فهمنا ونقيس ما أتقنه كل منا»

4. [ ا ] محطة أدلّة الفهم (ראיות להבנה):
   • سؤال المعلم المحوري: «ما الدليل على أن كل طالب حقّق هدف التعلم؟»
   • سؤال الطالب المحوري: «كيف أُظهر ما فهمت؟» (عبارة الطالب: «أُظهر ما فهمت»)
   • الهدف: فحص تحقق هدف التعلم لدى كل طالب فردياً ومباشراً للحصول على صورة واضحة تحدد الخطوة التالية.
   • سير المحطة واختيار الأداة: اختيار أداة تقويم قصيرة ومباشرة (سؤال قصير أو مسألة واحدة، تصنيف سريع أو مطابقة، تفسير ظاهرة أو تطبيق في سياق جديد، بطاقة خروج مكتوبة أو إلكترونية، أو أداء شفهي أو عملي مختصر).
   • جدول القرار بعد جمع الأدلّة (إلزامي):
     1) حقق معيار النجاح $\leftarrow$ ينتقل إلى مهمة جديدة أو يعمّق فهمه بتحدٍّ إضافي.
     2) حقق المعيار جزئيًا $\leftarrow$ يحصل على تغذية راجعة محددة أو تدريب قصير يستهدف الصعوبة.
     3) لم يُظهر الفهم المطلوب بعد $\leftarrow$ يحصل على شرح بطريقة أخرى أو دعم مباشر، ثم فرصة جديدة لإظهار فهمه بمهمة مكافئة (مجموعة دعم صغيرة ومؤقتة).
   • الاحتواء والمشاركة: إتاحة طرق مناسبة لإظهار الفهم بما يضمن مشاركة الجميع وحفظ كرامة الطالب.
   • التمايز والتكيف: تنويع أدوات التعبير وتكييف مستوى الدعم.
   • التقويم التكويني: الأداة هي جوهر التقويم التكويني لاتخاذ القرار الفوري في الحصة.
   • عبارة الانتقال الإلزامية: «أظهرنا أدلّة فهمنا؛ والآن نلخّص وننقل أثر تعلمنا إلى ما بعد الحصة»

5. [ ح ] محطة حصاد ونقل الأثر (חתימה והעברת הלמידה):
   • سؤال الطالب المحوري: «ماذا آخذ معي من هذا الدرس؟ وكيف أطبقه في حياتي؟»
   • سير المحطة: إنهاء الحصة عبر الأبعاد الثلاثة للحصاد:
     أ) ماذا تعلمنا؟ (تلخيص المعنى والمفهوم الأساسي).
     ب) التبصر والميتا-معرفة: «ما الذي ساعدني اليوم على الفهم؟ وما التحدي الذي تجاوزته؟»
     ج) نقل الأثر الحياتي: كيف ينتقل هذا التعلم إلى خارج الصف ومواقف الحياة والبيت والمجتمع؟
   • الاحتواء والمشاركة: إتاحة الفرصة لكل طالب للتعبير عن حصاده بأسلوبه، وتثبيت شعور الفخر والكرامة بالإنجاز.
   • التمايز والتكيف: تمايز في زاوية الحصاد؛ من تثبيت قاعدة أساسية إلى استخلاص حكمة ورؤية مستقبلية.
   • التقويم التكويني: فحص نضج الفهم الختامي وانتقال الأثر لتحديد نقطة انطلاق الدرس القادم.
   • مقولة الطالب الختامية: «أعرف أين أقف الآن، وأدرك ما تعلمته، وأستطيع توظيفه في واقعي وحياتي».

أخرج النتيجة بصيغة JSON حصراً بهذا المخطط بدون أي كود أو زيادات خارج الـ JSON:
{
  "title": "${n||`عنوان الدرس`}",
  "subject": "${e}",
  "grade": "${t}",
  "duration": ${i},
  "objective": "${r||`الهدف التعليمي العام ومعايير النجاح ثلاثية الأبعاد`}",
  "language": "ar",
  "stations": {
    "m": "نص محطة المدخل المحفّز مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתלבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، وعبارة الانتقال الإلزامية...",
    "f": "نص محطة فهم وبناء المعنى مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתلבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، وعبارة الانتقال الإلزامية...",
    "t": "نص محطة التفكير والتبصّر مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתلבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، وعبارة الانتقال الإلزامية...",
    "y": "نص محطة الإنجاز والتطبيق مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתلבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، وعبارة الانتقال الإلزامية...",
    "h": "نص محطة الحصاد والزوّادة مع سير المحطة، ومثال الاحتواء والدمج (הכלה והשתلבות)، ومثال التعليم المتمايز (דיפרנציאליות)، ومثال التقويم (הערכה)، ومقولة الطالب الختامية..."
  }
}`,l)for(let a of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`])try{let o=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${l}`},body:JSON.stringify({model:a,messages:[{role:`system`,content:u?`אתה יועץ פדגוגי בכיר בבית ספר מושירפה. עליך להחזיר JSON בעברית מקצועית ומושלמת לפי מודל מפתיח עם דוגמאות מפורשות להכלה, דיפרנציאליות והערכה בכל תחנה.`:`أنت مستشار تربوي وخبير بيداغوجي بمدرسة مشيرفة. يجب أن تكون إجابتك بتنسيق json باللغة العربية الفصحى وبمحتوى تطبيقي مفصل ومحدد لنص الدرس مع أمثلة صريحة على الاحتواء والدمج والتعليم المتمايز والتقويم في كل محطة.`},{role:`user`,content:p}],temperature:.6,max_tokens:3800,response_format:{type:`json_object`}})},11e3);if(o.ok){let a=(await o.json()).choices?.[0]?.message?.content;if(a){let o=JSON.parse(a);if(o.stations&&o.stations.m&&o.stations.f)return{title:o.title||n,subject:o.subject||e,grade:o.grade||t,duration:o.duration||i,objective:o.objective||r,language:u?`he`:`ar`,stations:{m:o.stations.m,f:o.stations.f,t:o.stations.t,a:o.stations.a||o.stations.y,y:o.stations.a||o.stations.y,h:o.stations.h}}}}}catch(e){console.warn(`Groq lesson planning (${a}) failed:`,e)}if(c)for(let a of[`gemini-1.5-flash`,`gemini-2.0-flash`,`gemini-1.5-pro`])try{let o=await d(`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${c}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:p}]}],generationConfig:{temperature:.6,maxOutputTokens:3800,responseMimeType:`application/json`}})},11e3);if(o.ok){let a=(await o.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(a){let o=JSON.parse(a);if(o.stations&&o.stations.m&&o.stations.f)return{title:o.title||n,subject:o.subject||e,grade:o.grade||t,duration:o.duration||i,objective:o.objective||r,language:u?`he`:`ar`,stations:{m:o.stations.m,f:o.stations.f,t:o.stations.t,a:o.stations.a||o.stations.y,y:o.stations.a||o.stations.y,h:o.stations.h}}}}}catch(e){console.warn(`Gemini lesson planning (${a}) failed:`,e)}let m=n||(u?`מושג לימודי מרכזי`:`المفهوم التعليمي المركزي`),h=r||(u?`הבנת מושג (${m}) ויישומו במשימות מגוונות תוך לקיחת צידה לדרך`:`أن يفهم الطالب مفهوم (${m}) ويطبقه في مهام متدرجة ويوظف زوّادته في سياقات حياتية متنوعة`);return u?{title:m,subject:e,grade:t,duration:i,objective:h,language:`he`,stations:{m:`🧲 [ מ - משיכה וסקרנות (מבוא מגרה)] (5 דקות):
• מהלך התחנה: הצגת חידה חזותית או תופעה מפתיעה מחיי היומיום בנושא (${m}) ללא חשיפת הפתרון; שאלת התלמיד: "מה מעורר בי סקרנות? ומה אנחנו רוצים לגלות?".
• 🤝 דוגמה יישומית להכלה והשתלבות: שאלה פתוחה מונגשת ברמת התבוננות פשוטה ("מה אתם רואים כאן?") כדי לאפשר גם לתלמיד שילוב להשתתף ראשון ללא חשש מטעות, לצד שיח זוגי מקדים ובטוח.
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: גירוי רב-ערוצי (תמונה ברורה + דוגמה מוחשית) ושאלת חקר המאפשרת רמות תגובה שונות (מילה, ציור או משפט).
• 📊 דוגמה יישומית להערכה: הערכה דיאגנוסטית; איסוף השערות התלמידים על הלוח למיפוי תפיסות שגויות והכוונה מדויקת של ההסבר בהמשך.
• משפט מעבר מחייב: "מתוך מה שהעליתם, ננסה להבין היום..."`,f:`💡 [ פ - פיתוח הבנה (המשגה ומידול)] (10 דקות):
• מהלך התחנה: הצגת מטרת הלמידה בשפת התלמיד, מדדי הצלחה תלת-ממדיים (תוכן, מיומנות, השתתפות), מילון המושגים הכיתתי, ומידול המורה (I Do) של פתרון דוגמה תוך חשיבה בקול. שאלת התלמיד: "מה אנחנו לומדים? ואיך אסביר זאת במילים שלי?".
• 🤝 דוגמה יישומית להכלה והשתלבות: כרטיסיית שלבים מאוירת, בנק מונחים עם סמלים חזותיים, וסיוע שקט של מורת השילוב המכבד את מקום התלמיד.
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: פיגומים מדורגים (Scaffolding) למתקשים, ומשימת הרחבה לתלמידים מתקדמים להצעת הסבר חלופי.
• 📊 דוגמה יישומית להערכה: בדיקת הבנה מהירה (Checking for Understanding) באמצעות כרטיסיית בדיקה אישית או סיכום הרעיון במשפט אחד של התלמיד.
• משפט מעבר מחייב: "הכרנו את הרעיון; כעת נבדוק איך הוא עובד ולמה"`,t:`🧠 [ ת - תובנה והעמקה (חשיבה מסדר גבוה)] (8 דקות):
• מהלך התחנה: שאלות חשיבה מעמיקות בלב הנושא (${m}): "מה הקשר בין החלקים?", "איזו ראיה תומכת בטענה?", "מה ישתנה אם נשנה את הנתונים?". שאלת התלמיד: "איך הגעתי לתשובה? ומה תומך בה?".
• 🤝 דוגמה יישומית להכלה והשתלבות: מתן זמן לחשיבה שקטה (Think Time), וחלוקת תפקידים מוגדרים בעבודה קבוצתית (חוקר ראיות, מתעד, דובר).
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: כרטיסיות רמז לקבוצות הזקוקות לתמיכה, ומשימת הפרכת טענה נגדית לקבוצות מצוינות.
• 📊 דוגמה יישומית להערכה: הערכה מעצבת; בדיקת דף "הנימוק והראיה" לווידוא יכולת ההסבר ולא רק התוצאה הסופית.
• משפט מעבר מחייב: "בדקנו את הרעיון והסברנו אותו; כעת נשתמש בו במשימה"`,y:`🛠️ [ י - יצירה ויישום (סדנה פעילה ומסלולים גמישים)] (15 דקות):
• מהלך התחנה: סדנת עבודה מעשית עם תוצר מוחשי; שאלת התלמיד: "איך אשתמש במה שלמדתי? ואילו כלים יעזרו לי?".
• 🔀 פירוט 3 המסלולים הגמישים:
  1. מסלול נתמך: משימת תרגול מובנית עם דוגמה פתורה וכרטיסיית שלבים.
  2. מסלול עצמאי: פתרון משימות יישום שלמות באופן עצמאי.
  3. מסלול העמקה ויצירתיות: פתרון בעיה מורכבת מחיי היומיום או פיתוח תוצר חדשני.
• 🤝 דוגמה יישומית להכלה והשתלבות: שולחן הוראה ממוקדת ("תחנת דיוק ושליטה" 4-6 תלמידים עם המורה), כרטיסיית "מפתח חזרה להבנה", ועמית תומך.
• 📊 דוגמה יישומית להערכה: תצפית פעילה של המורה ומשוב מיידי לפי מדדי הצלחה (תוכן, מיומנות, השתתפות).
• משפט מעבר מחייב: "נבדוק כעת מה הצלחנו לעשות ומה ניקח להמשך"`,h:`🎒 [ ח - חתימה וצידה לדרך (רפלקציה וסיכום)] (7 דקות):
• מהלך התחנה: רפלקציה אישית דרך 5 שאלות והגדרת הצידה לדרך; שאלת התלמיד: "במה התקדמתי? ומה אקח איתי להמשך?".
• 🤝 דוגמה יישומית להכלה והשתלבות: אפשרות למענה מגוון (כתיבת משפט, ציור סמל, או שיתוף בעל פה), ויציאה בהרגשת מסוגלות והצלחה.
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: צידה לדרך מותאמת (חידוד המושג הבסיסי לתלמיד שזקוק לביסוס, או שאלת חקר עתידית למתקדמים).
• 📊 דוגמה יישומית להערכה: כרטיסיית יציאה (Exit Ticket) המשיבה על: מה למדתי? מה הראיה לכך? ואיך איישם זאת בבית ובחיים?
• 🌟 משפט התלמיד המנחה: "אני יודע מה אני לומד, מוצא דרך להשתתף, מבקש עזרה כשצריך ומראה איך התקדמתי".`}}:f?{title:m,subject:e,grade:t,duration:i,objective:h||`بناء الوعي بالذات وإدارة المشاعر الإيجابية في موضوع (${m}) مع مراعاة الاحتواء والتمايز والتقويم`,language:`ar`,stations:{m:`🔥 [ م - مشوّق ومحفّز ] (5 دقائق):
• سير المحطة: فحص "الطقس الداخلي للمشاعر" عبر قارورة الهدوء والبريق المتطاير لتمثيل فوران المشاعر حول (${m})؛ سؤال الطالب: «ما الذي يثير فضولي؟ وما الذي نريد استكشافه؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתלבות): يشارك كل طالب باختيار بطاقة رمزية ملونة (مشمس / غائم / ماطر) دون إجباره على الحديث العلني، مع حوار ثنائي آمن مع زميل داعم لحفظ كرامة وأمان الطالب النفسي.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم المثير بقنوات حسية متعددة (مثير بصري حركي، بطاقة مشاعر مرسومة، وسؤال تأملي مفتوح يحتمل كل أشكال الاستجابة).
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تشخيصي؛ مسح بصري سريع لخيارات البطاقات لتحديد مستوى التوتر الصفي والمشاعر السائدة وبناء التوجيه انطلاقاً منها.
• عبارة الانتقال الإلزامية: «انطلاقًا مما طرحتموه، سنحاول اليوم أن نفهم…»`,f:`🧩 [ ف - فهم وبناء المعنى ] (10 دقائق):
• سير المحطة: قراءة موقف قصصي واقعي يتناول (${m})، تفكيك معجم المشاعر الصفي [الوعي بالذات، الأمان النفسي، الاستجابة المتزنة]، ونمذجة المعلم (I Do) بالتفكير بصوت مسموع: "أتوقف، أتنفس بعمق، وأميز بين الشعور والسلوك". سؤال الطالب: «ماذا نتعلّم؟ وكيف أشرح الفكرة بكلماتي الخاصة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): توفير نص قصصي مشكول مدعوم برسومات تعبيرية، ومرافقة معلمة الدمج لطالب الصعوبات بالإشارة المباشرة لمفردات القاموس لتمكينه من إعادة الصياغة بثقة.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): بطاقة منظم بياني لخطوات التهدئة متدرجة التفصيل، مع إتاحة المجال للمتقدمين لتفسير أثر الاستجابة الحكيمة على بيئة الصف.
• 📊 مثال تطبيقي على التقويم (הערכה): أداة فحص الفهم (Checking for Understanding)؛ اختبار سريع بالبطاقات (شعور طبيعي أم سلوك يحتاج ضبط) للتحقق الفوري من إدراك المفاهيم.
• عبارة الانتقال الإلزامية: «تعرّفنا إلى الفكرة؛ والآن سنفحص كيف تعمل ولماذا»`,t:`🛠️ [ ت - تطبيق وتدريب ] (8 دقائق):
• سير المحطة: أسئلة التفكير العليا: "لو وضعت نفسك مكان الطرف الآخر في موقف (${m})، ما الاحتياج العميق الذي لم يفهمه أحد؟"، "ما الذي سيتغير في صفنا لو استبدلنا الاندفاع بالاستجابة الواعية؟". سؤال الطالب: «كيف توصّلت إلى الإجابة؟ وما الذي يدعمها؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): منح دقيقة صمت للتفكير الفردي (Think Time)، وتعيين أدوار محددة في المجموعات الثنائية (مثل: دور المراقب المتعاطف، دور المتحدث) لضمان مساهمة طالب الدمج بكرامة.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): مستويات تفكير متدرجة؛ بدءاً من تحديد سبب المشاعر البسيط بالمنظم البصרי، وصولاً إلى مقارنة بدائل حلول متقدمة للموقف.
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تكويني تحليلي؛ بطاقة "السبب والأثر الوجداني" لتقييم عمق تبني منظور الآخر والتغذية الراجعة الشفوية المركزة.
• عبارة الانتقال الإلزامية: «فحصنا الفكرة وفسّرناها؛ والآن سنستخدمها في المهمة»`,y:`🔎 [ ي - يقين من الفهم ] (15 دقيقة):
• سير المحطة: ورشة تطبيقية ومحاكاة مواقف بمخرجات ملموسة؛ سؤال الطالب: «كيف أستخدم ما تعلّمته؟ وما الأدوات التي تساعدني؟».
• 🔀 تفصيل المسارات الثلاثة المرنة:
  1. مسار التطبيق المدعوم: بطاقات حوارية جاهزة بصيغة (أشعر بـ... عندما... وأحتاج إلى...) مدعومة ببنك مشاعر.
  2. مسار التطبيق المستقل: تمثيل ثنائي تفاعلي لموقف نزاع وحله باستراتيجية التفاوض والاستماع المتعاطف.
  3. مسار التعمّق والإبداع: صياغة بنود "ميثاق الأمان النفسي الصفي" أو تصميم بطاقات إرشادية مبتكرة لزاوية الهدوء.
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): طاولة التدريس المركّز («محطة الضبط والإتقان» 4-6 طلاب مع المعلم) لتمكين الطلاب في بيئة تشجيعية آمنة دون وسم، مع حرية التعبير عبر الرسم أو التمثيل أو الكتابة.
• 📊 مثال تطبيقي على التقويم (הערכה): معايير النجاح ثلاثية الأبعاد (محتوى: تطبيق استراتيجية التهدئة، مهارة: الاستماع المتعاطف، مشاركة: التعاون الإيجابي) مع تغذية راجعة فورية.
• عبارة الانتقال الإلزامية: «سنفحص الآن ما نجحنا في إنجازه، وما نريد أن نحمله معنا للمرحلة المقبلة»`,h:`🎒 [ ح - حصاد ونقل الأثر ] (7 دقائق):
• سير المحطة: إجابة الأسئلة الخمسة للتأمل والتقويم الذاتي، تحديد الزوّادة؛ سؤال الطالب: «فيمَ تقدّمت؟ وما الذي سأحمله معي للمرحلة المقبلة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): خيارات مرنة لتوثيق الزوّادة (كتابة عبارة، اختيار بطاقة مصورة، أو مشاركة شفوية ثنائية)، وضمان شعور كل طالب بالفخر بإنجازه.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): زوّادة موجهة لكل مستوى (تثبيت شعور التهدئة كزاد أساسي، أو التعهد بقيادة حل النزاعات كزاد متقدم).
• 📊 مثال تطبيقي على التقويم (הערכה): بطاقة تذكرة الخروج (Exit Ticket) توثق: (1) ما تعلمته اليوم، (2) أين سأطبقه في بيتي اليوم؛ لقياس نقل أثر التعلم للواقع الأسري.
• 🌟 مقولة الطالب المحورية: «أعرف ما أتعلّمه، وأجد طريقة للمشاركة، وأطلب المساعدة حين أحتاج إليها، وأُظهر كيف تقدّمت».`}}:{title:m,subject:e,grade:t,duration:i,objective:h,language:`ar`,stations:{m:`🔥 [ م - مشوّق ومحفّز ] (5 دقائق):
• سير المحطة: عرض لغز واقعي أو صورة لافتة ومفارقة ملموسة حول (${m}) دون الكشف عن القاعدة أو الحل المباشر؛ سؤال الطالب: «ما الذي يثير فضولي؟ وما الذي نريد استكشافه؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): البدء بسؤال وصف عيني ميسّر للجميع: "ماذا تشاهدون هنا؟" لإتاحة فرصة التعبير لطالب الدمج أولاً دون قلق من صحة أو خطأ الجواب، مع توفير خيار الحوار الثنائي (Think-Pair-Share) الآمن.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم المثير عبر وسائط متعددة (مجسم أو صورة واضحة ومسألة محكية)، واستقبال فرضيات الطلاب بمستويات تعبير متباينة (كلمة، رسم، أو صياغة كاملة).
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تشخيصي؛ تسجيل سريع لفرضيات الطلاب وتصنيفها على اللوح لرصد المفاهيم الخاطئة وتحديد نقطة الانطلاق الدقيقة للشرح.
• عبارة الانتقال الإلزامية: «انطلاقًا مما طرحتموه، سنحاول اليوم أن نفهم…»`,f:`🧩 [ ف - فهم وبناء المعنى ] (10 دقائق):
• سير المحطة: إعلان هدف التعلّم بلغة الطلاب، معايير النجاح (محتوى، مهارة، مشاركة)، معجم المفاهيم الصفي (رف المفاتيح)، ونمذجة المعلم (I Do) بحل المسألة الأولى والتفكير بصوت مسموع. سؤال الطالب: «ماذا نتعلّم؟ وكيف أشرح الفكرة بكلماتي الخاصة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): توفير بطاقة خطوات مرئية بألوان محددة، بنك مصطلحات مدعوم بالصور، وإشراك معلمة الدمج في تقديم دعم فردي غير ملفت يحفظ كرامة الطالب.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم مثال محلول تدريجي (Scaffolding) للطلاب الذين يحتاجون تثبيتاً، ومهمة تفسير تعليلية موازية للطلاب المتفوقين لاقتراح حل بديل.
• 📊 مثال تطبيقي على التقويم (הערכה): فحص الفهم السريع (Checking for Understanding) عبر إشارات الأصابع أو بطاقة بيضاء صغيرة يكتب فيها كل طالب تعريفه للمفهوم في جملة واحدة قبل الانتقال.
• عبارة الانتقال الإلزامية: «تعرّفنا إلى الفكرة؛ والآن سنفحص كيف تعمل ولماذا»`,t:`🛠️ [ ت - تطبيق وتدريب ] (8 دقائق):
• سير المحطة: أسئلة تفكير عليا في صلب (${m}): "ما العلاقة بين الأجزاء؟"، "ما الدليل الذي يثبت صحة حلك؟"، "ماذا سيحدث لو غيّرنا المعطيات؟". سؤال الطالب: «كيف توصّلت إلى الإجابة؟ وما الذي يدعمها؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): منح وقت تفكير صامت كافٍ، وتوزيع أدوار عمل تعاونية واضحة في كل مجموعة (المتحري عن الدليل، المدون، المتحدث) ليشارك كل طالب بدور مناسب ومحترم.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): بطاقات تلميح للمجموعات التي تحتاج إسناداً، وسؤال فحص ادعاء خاطئ أو معضلة استثنائية لمجموعات التحدي.
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تكويني تحليلي؛ فحص بطاقة "الدليل والتعليل" للتأكد من قدرة المتعلمين على البرهنة وتبرير الإجابة وتعديل الشرح فوراً إن وُجدت فجوة.
• عبارة الانتقال الإلزامية: «فحصنا الفكرة وفسّرناها؛ والآن سنستخدمها في المهمة»`,y:`🛠️ [ ي - إنجاز وتطبيق (יצירה وיישום)] (15 دقيقة):
• سير المحطة: ورشة العمل التطبيقية؛ مهمة واضحة ومخرجات ملموسة؛ سؤال الطالب: «كيف أستخدم ما تعلّمته؟ وما الأدوات التي تساعدني؟».
• 🔀 تفصيل المسارات الثلاثة المرنة:
  1. مسار التطبيق المدعوم: مهمة تطبيقية أساسية مزودة بنموذج محلول وقائمة تفقد للخطوات.
  2. مسار التطبيق المستقل: حل تمارين ومسائل متكاملة تتطلب تطبيق المفهوم بشكل مستقل.
  3. مسار التعمّق والإبداع: مهمة مركبة لابتكار مسألة حياتية جديدة، تحليل خطأ مقصود في نموذج معقد، أو إنتاج وسيلة توضيحية.
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): طاولة التدريس المركّز («محطة الضبط والإتقان» 4-6 طلاب مع المعلم) لتقديم توجيه مباشر، تفعيل بطاقة «مفتاح العودة إلى الفهم»، والزميل المساند، مع تنويع وسيط الإنتاج.
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تكويني؛ ملاحظة الأداء الصفية المباشرة وفق معايير النجاح (محتوى، مهارة، مشاركة) وتغذية راجعة فورية لتصحيح المسار أثناء العمل.
• عبارة الانتقال الإلزامية: «سنفحص الآن ما نجحنا في إنجازه، وما نريد أن نحمله معنا للمرحلة المقبلة»`,h:`🎒 [ ح - حصاد وزوّادة (חתימה وצידה לדרך)] (7 دقائق):
• سير المحطة: مراجعة ختامية وإجابة الأسئلة الخمسة للتأمل والتقويم الذاتي؛ وتحديد الزوّادة؛ سؤال الطالب: «فيمَ تقدّمت؟ وما الذي سأحمله معي للمرحلة المقبلة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): توفير بدائل لإنجاز تذكرة الخروج (كتابة جملة، خريطة مفاهيمية مصغرة، أو إجابة شفوية مسجلة)، بما يضمن خروج كل طالب بكرامة واعتزاز بتقدّمه.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تمايز الزوّادة بحسب قدرة الطالب؛ من تثبيت المفهوم المركزي والقانون لطالب يحتاج تثبيتاً، إلى صياغة سؤال استكشافي مستقبلي للمتفوقين.
• 📊 مثال تطبيقي على التقويم (הערכה): بطاقة تذكرة الخروج (Exit Ticket) تتضمن: (ماذا أنجزت اليوم؟ ما دليلي؟ وما الذي سأطبقه في حياتي؟) لرصد انتقال أثر التعلم وتخطيط الدرس القادم.
• 🌟 مقولة الطالب المحورية: «أعرف ما أتعلّمه، وأجد طريقة للمشاركة، وأطلب المساعدة حين أحتاج إليها، وأُظهر كيف تقدّمت».`}}},A=async({title:e=``,subject:t=``,grade:n=``,duration:r=45,objective:i=``,notes:a=``})=>{let{geminiKey:o,groqKey:c}=await s(),l=e.trim()||`مهارة دراسية مركزية`,u=t.trim()||`عام`,f=n.trim()||`المرحلة الابتدائية`,p=i.trim()||`إتقان وتطبيق المفاهيم الأساسية لدرس (${l}) وفحص الأدلة ونقل الأثر`,m=`أنت المعلم الخبير الأول ومصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
أنت من يؤلف ويكتب محتوى الدرس الفعلي بالكامل ليعرضه المعلم فوراً للطلاب في الصف.

قواعد بيداغوجية ملزمة وصارمة جداً:
١. ممنوع منعاً باتاً كتابة نصائح أو توجيهات عامة للمعلم في حقل (studentDisplayPrompt) مثل "اكتب كذا" أو "اطرح سؤالاً" أو "قدم أمثلة" أو "ناقش مع الطلاب".
٢. حقل (studentDisplayPrompt) في كل محطة يجب أن يحتوي على النص التعليمي الحقيقي الصريح والكامل الذي يقرأه الطلاب على الشاشة حرفياً:
- في المحطة [م] مشوّق ومحفّز (٥ دقائق): اكتب اللغز أو الموقف المثير أو الجمل المحيرة الفعلية المكتوبة بكلماتها كاملة لجذب انتباه الطلاب.
- في المحطة [ف] فهم وبناء المعنى (١٠ دقائق): اكتب الشرح والمفاهيم والأمثلة التوضيحية الحقيقية والقاعدة بوضوح كامل كما تعرض في الشريحة.
- في المحطة [ت] تطبيق وتدريب (١٥ دقائق): اكتب التمرين الفعلي بأسئلته وفقراته وجمله كاملة (1، 2، 3) المعدّة للحل المباشر في دفاتر الطلاب.
- في المحطة [ا] أدلّة الفهم (٨ دقائق): اكتب بطاقة التحقق الفردي المستقلة الفعلية (٣ أسئلة أو مسائل صريحة ومحددة يحلها كل طالب بمفرده دون مساعدة).
- في المحطة [ح] حصاد ونقل الأثر (٧ دقائق): اكتب ملخص الدرس الفعلي وسؤال الحصاد ونقل الأثر في الحياة اليومية خارج المدرسة.

معطيات الدرس المطلوب:
- عنوان وموضوع الدرس: "${l}"
- المادة الدراسية: "${u}"
- الصف: "${f}"
- المدة الإجمالية: ${r===`وحدة كاملة`?`وحدة تعليمية متكاملة ممتدة (عدة حصص)`:`${r} دقيقة`}
- الهدف المركزي: "${p}"
${a?`- ملاحظات وظروف التنفيذ: "${a}"`:``}

أخرج النتيجة بصيغة JSON صالح فقط بالهيكل التالي (املأ القيم الفارغة بالمحتوى الحقيقي الكامل للدرس):
{
  "title": "${l}",
  "subject": "${u}",
  "grade": "${f}",
  "duration": ${r},
  "objective": "${p}",
  "successCriteria": "",
  "prerequisites": "",
  "resources": "",
  "participationBarriers": "",
  "stations": {
    "m": {
      "durationMinutes": 5,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": ""
    },
    "f": {
      "durationMinutes": 10,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": ""
    },
    "t": {
      "durationMinutes": 15,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": "",
      "modeledInterventionScenario": {
        "difficultyName": "",
        "targetScope": "مجموعة صغيرة (٣-٥ طلاب)",
        "timeDuration": "٤ دقائق",
        "steps": [
          { "min": "الدقيقة الأولى", "desc": "" },
          { "min": "الدقيقة الثانية", "desc": "" },
          { "min": "الدقيقة الثالثة", "desc": "" },
          { "min": "الدقيقة الرابعة", "desc": "" }
        ],
        "restOfClassTask": "",
        "verificationCheck": ""
      }
    },
    "a": {
      "durationMinutes": 8,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": ""
    },
    "h": {
      "durationMinutes": 7,
      "studentDisplayPrompt": "",
      "teacherNotes": "",
      "scaffolds": "",
      "extension": ""
    }
  }
}`,h=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,s*}/g,`}`).replace(/,s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(c)for(let e of[`openai/gpt-oss-120b`,`openai/gpt-oss-20b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${c}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:m}],temperature:.5,max_tokens:3e3,response_format:{type:`json_object`}})},15e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=h(e);if(t&&t.stations&&t.stations.m&&t.stations.t&&t.stations.m.studentDisplayPrompt)return t}}}catch(t){console.warn(`Groq companion lesson planning (${e}) failed:`,t)}if(o)for(let e of[`gemini-2.0-flash`,`gemini-1.5-flash`,`gemini-1.5-pro`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${o}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:m}]}],generationConfig:{temperature:.5,maxOutputTokens:3800,responseMimeType:`application/json`}})},14e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=h(e);if(t&&t.stations&&t.stations.m&&t.stations.t)return t}}}catch(t){console.warn(`Gemini companion lesson planning (${e}) failed:`,t)}return{title:l,subject:u,grade:f,duration:r,objective:p,successCriteria:`يستخرج الطالب العناصر الأساسية لدرس (${l})، ويطبقها في حل ٣ مسائل/تمارين بدقة، ويبرر إجابته في بطاقة التحقق.`,prerequisites:`معرفة مسبقة بمفاهيم وقواعد الأساس المرتبطة بـ (${l}).`,resources:`شاشة العرض الصفية، كراسة التدريبات، بطاقات عمل الدعم والتعميق.`,participationBarriers:`تفاوت في سرعة الاستجابة، وتردد في التعليل اللغوي أو الرياضي دون إحراج.`,stations:{m:{durationMinutes:5,studentDisplayPrompt:`تحدي الفضول والاستكشاف حول (${l}):\nتأمل المسألة / المشهد المعروض أمامك:\nما الغريب أو المختلف الذي تلاحظه فوراً؟ وما السؤال الذي يقفز إلى ذهنك قبل أن نبدأ؟`,teacherNotes:`اعرض اللغز أو النموذج على الشاشة دون تقديم إجابات جاهزة. استمع لـ 3 توقعات متنوعة من الطلاب، ثم اربطها مباشرة بهدف الحصة ومعيار النجاح المعروضين على جانب اللوح.`,scaffolds:`إتاحة دقيقة صمت للتفكير الفردي ثم تبادل سريع مع الزميل المجاور.`,extension:`تحدي للمبادرين: ما النتيجة المتوقعة لو غيرنا أحد عناصر المشهد؟`},f:{durationMinutes:10,studentDisplayPrompt:`المفهوم والقاعدة الأساسية لدرس (${l}):\n• المفهوم الجوهري: التعريف والأمثلة المقارنة.\n• النمذجة التطبيقية: كيف نصل إلى الحل خطوة بخطوة بالدليل الصريح.\n• علامة التمييز: ما الفارق الدقيق بين الحالة الصحيحة والخطأ الشائع؟`,teacherNotes:`اشرح المفهوم بصوت مسموع مع كتابة النموذج على السبورة والتأشير على الكلمات أو الأرقام المفتاحية. اطرح سؤال فحص سريع للجميع للتأكد من زوال اللبس.`,scaffolds:`جدول مقارنة ثنائي أو خريطة ذهنية بصرية توضح الخطوات.`,extension:`سؤال تفكير عليا: فسر لماذا لا يمكن تطبيق هذه القاعدة إذا اختل أحد الشروط؟`},t:{durationMinutes:15,studentDisplayPrompt:`مهمة التطبيق والتدريب المباشر:\nحل التمارين التالية في دفترك مع كتابة خطوات التبرير:\n١) التمرين الأول: تطبيق مباشر على القاعدة الأساسية لـ (${l}).\n٢) التمرين الثاني: مسألة مقارنة تتطلب تحديد السبب والدليل.\n٣) التمرين الثالث: استخرج الخطأ وصححه مع التعليل.`,teacherNotes:`تجول بين الصف بهدوء لملاحظة جودة التبرير وليس مجرد النتيجة. عند رصد تردد أو خطأ متكرر، فعّل فوراً سيناريو التدخل النمذجي (٤ دقائق) لمجموعة الدعم.`,scaffolds:`بطاقة جمل مساعدة: "أختار ... لأن الدليل / القاعدة تنص على ...".`,extension:`مهمة تعميق وتحدٍّ للمبادرين: صياغة مسألة جديدة من واقع الحياة واختبار زميل فيها.`,modeledInterventionScenario:{difficultyName:`صعوبة شائعة في تطبيق مهارة (${l})`,targetScope:`مجموعة صغيرة (٣-٥ طلاب)`,timeDuration:`٤ دقائق`,steps:[{min:`الدقيقة الأولى`,desc:`نمذجة حل مثال مماثل بصوت مسموع مع بيان سبب كل خطوة.`},{min:`الدقيقة الثانية`,desc:`حل مسألة مشتركة بتوجيه وأسئلة داعمة.`},{min:`الدقيقة الثالثة`,desc:`محاولة فردية مستقلة لكل طالب في المجموعة دون مساعدة.`},{min:`الدقيقة الرابعة`,desc:`تحقق فوري من إتقان المهارة وثقة الطالب.`}],restOfClassTask:`إكمال التمرين التحدي ومناقشة الحلول البديلة مع الزميل.`,verificationCheck:`سؤال تحقق سريع من جملة واحدة يثبت زوال اللبس تماماً.`}},a:{durationMinutes:8,studentDisplayPrompt:`بطاقة التحقق الفردي المستقلة (حل فردي دون مساعدة):\n١) أجب عن المسألة المحددة مستخدماً ما تعلمته اليوم حول (${l}).\n٢) اذكر الدليل أو التبرير العلمي/اللغوي الذي بنيت عليه حلك.\n٣) قيّم ثقتك في الحل: (متقن تماماً / متأكد جزئياً / لدي تساؤل).`,teacherNotes:`اجمع البطاقات الفردية لفحص مدى تحقق معيار النجاح لدى كل طالب بدقة وتوثيق النتائج في سجل المتابعة.`,scaffolds:`تذكير بالمعيار والخطوات الأساسية دون إعطاء الإجابة المباشرة.`,extension:`تحدي تحليلي إضافي لمن ينهي قبل الوقت.`},h:{durationMinutes:7,studentDisplayPrompt:`الحصاد ونقل الأثر الحياتي:\n١) الحصاد: ما أهم فكرة أو مهارة أخذتها معك اليوم من درس (${l})؟\n٢) نقل الأثر: أين وكيف ستستخدم هذا المفهوم في حوارك أو مهامك خارج المدرسة؟`,teacherNotes:`إدارة تلخيص ختامي وسماع استجابات نوعية، مع رصد ما يحتاج إلى متابعة للحصة القادمة.`,scaffolds:`بداية جملة تأملية: "اليوم اكتشفت أن... وسأطبقه عندما...".`,extension:`مهمة استكشاف وتطبيق منزلي في بيئة الأسرة أو الحي.`}}}},j=async({title:e=``,subject:t=``,grade:n=``,stationKey:r=`m`,currentPrompt:i=``,customInstruction:a=``})=>{let{geminiKey:o,groqKey:c}=await s(),l={m:{name:`مشوّق ومحفّز`,query:`ما الذي يثير فضولي؟ ولماذا نتعلم هذا؟`,dur:5},f:{name:`فهم وبناء المعنى`,query:`كيف أفهم الفكرة؟`,dur:10},t:{name:`تطبيق وتدريب`,query:`كيف أستخدم ما تعلمت؟`,dur:15},a:{name:`أدلّة الفهم`,query:`كيف أُظهر ما فهمت؟`,dur:8},h:{name:`حصاد ونقل الأثر`,query:`ماذا آخذ معي؟ وأين أستخدمه؟`,dur:7}},u=l[r]||l.m,f=`أنت المعلم الخبير الأول لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم يطلب ٣ بدائل تدريسية جاهزة ومكتملة تماماً لتغيير محطة واحدة فقط من محطات الدرس:
- المادة: "${t||`عام`}"
- الموضوع: "${e||`الدرس المحدد`}"
- الصف: "${n||`المرحلة الابتدائية`}"
- المحطة المستهدفة: [${r}] ${u.name} (${u.query})
${i?`- المحتوى الحالي للمحطة: "${i.slice(0,300)}"`:``}
${a?`- رغبة وتوجيه المعلم الخاص للبدائل: "${a}"`:``}

المطلوب:
توليد ٣ بدائل تدريسية مختلفة الأسلوب والمدخل بالكامل لهذه المحطة فقط:
- إذا كانت المحطة [م]: ولد بديل (مدخل قصصي)، بديل (لغز وتحدي حركي/لغوي)، بديل (موقف بصري وتأمل واقعي).
- إذا كانت المحطة [ف]: ولد بديل (نمذجة بصرية صريحة ومقارنة)، بديل (استقصاء وحوار موجه)، بديل (بناء جماعي للقاعدة عبر أمثلة مضادة).
- إذا كانت المحطة [ت]: ولد بديل (تحديات متدرجة المستويات برونز/فضي/ذهبي)، بديل (مهمة حياتية وسيناريو حل مشكلة)، بديل (تدريب ثنائي تفاعلي وتبادل أدوار).
- إذا كانت المحطة [ا]: ولد بديل (٣ أسئلة مباشرة مع تبرير)، بديل (بطاقة صواب وخطأ مع تصحيح الخطأ)، بديل (مهمة تركيب وإنتاج جملة/مسألة تطابق المعيار).
- إذا كانت المحطة [ح]: ولد بديل (رسالة نصيحة لصديق)، بديل (مهمة استكشاف منزلي)، بديل (بطاقة الحصاد والرمز المعبر).

قواعد صارمة:
- يجب أن يكون كل بديل مكتوباً بنصوصه وتمارينه وأمثلته الفعلية الكاملة الجاهزة فوراً للعرض على شاشة الطلاب (studentDisplayPrompt)، وملاحظات المعلم (teacherNotes).
- ممنوع كتابة نصائح عامة مثل "اطرح سؤالاً"؛ اكتب السؤال والتمرين الفعلي!

أخرج النتيجة بصيغة JSON فقط:
{
  "stationKey": "${r}",
  "alternatives": [
    {
      "id": "alt_1",
      "title": "عنوان البديل الأول",
      "styleBadge": "الأسلوب التدريسي للبديل ١",
      "studentDisplayPrompt": "نص العرض الفعلي للطلاب...",
      "teacherNotes": "ملاحظات المعلم...",
      "scaffolds": "سقالة دعم...",
      "extension": "تحدي تعميق..."
    },
    {
      "id": "alt_2",
      "title": "عنوان البديل الثاني",
      "styleBadge": "الأسلوب التدريسي للبديل ٢",
      "studentDisplayPrompt": "نص العرض الفعلي للطلاب...",
      "teacherNotes": "ملاحظات المعلم...",
      "scaffolds": "سقالة دعم...",
      "extension": "تحدي تعميق..."
    },
    {
      "id": "alt_3",
      "title": "عنوان البديل الثالث",
      "styleBadge": "الأسلوب التدريسي للبديل ٣",
      "studentDisplayPrompt": "نص العرض الفعلي للطلاب...",
      "teacherNotes": "ملاحظات المعلم...",
      "scaffolds": "سقالة دعم...",
      "extension": "تحدي تعميق..."
    }
  ]
}`,p=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,s*}/g,`}`).replace(/,s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(c)for(let e of[`openai/gpt-oss-120b`,`openai/gpt-oss-20b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${c}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:f}],temperature:.65,max_tokens:2800,response_format:{type:`json_object`}})},14e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=p(e);if(t&&Array.isArray(t.alternatives)&&t.alternatives.length>0)return t}}}catch(t){console.warn(`Groq station alternative (${e}) failed:`,t)}if(o)for(let e of[`gemini-2.0-flash`,`gemini-1.5-flash`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${o}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:f}]}],generationConfig:{temperature:.65,maxOutputTokens:3e3,responseMimeType:`application/json`}})},14e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=p(e);if(t&&Array.isArray(t.alternatives)&&t.alternatives.length>0)return t}}}catch(t){console.warn(`Gemini station alternative (${e}) failed:`,t)}return{stationKey:r,alternatives:[{id:`alt_fb_1`,title:`بديل ١: المدخل القصصي والواقعي لـ (${e||`الدرس`})`,styleBadge:`مدخل قصصي واقعي`,studentDisplayPrompt:`قصة المشهد المحفز لدرس (${e||`موضوع الحصة`}):\nاستمع للموقف القصير الآتي: حدثت مفارقة غير متوقعة جعلت الجميع يتساءلون كيف يمكن تفسير ذلك أو حله بالدقة المطلوبة؟ ما الذي يثير فضولك في هذا الموقف؟`,teacherNotes:`سرد القصة القصيرة بروح مشوقة والتوقف عند نقطة الفضول لاستدراج توقعات الطلاب دون تقديم الحل.`,scaffolds:`تلميح بصري أو بطاقة صورية توضح طرفي الموقف.`,extension:`تحدي سريع: توقع نهاية مختلفة للقصة.`},{id:`alt_fb_2`,title:`بديل ٢: لغز التحدي والمحقق الصغير لـ (${e||`الدرس`})`,styleBadge:`لغز وتحدي وتفكير`,studentDisplayPrompt:`تحدي المحققين الصغار:
أمامك معطيات ناقصة أو لغز يتطلب كلمة سر واحدة أو قاعدة ذهبية لتكتمل الصورة:
فكر جيداً: ما الجزء المفقود الذي يزيل الغموض فوراً؟`,teacherNotes:`عرض اللغز وتشجيع المناقشة الثنائية السريعة والتركيز على مفتاح الحل اللغوي أو العلمي.`,scaffolds:`عرض ثلاثة خيارات تلميحية للاختيار منها.`,extension:`صياغة لغز معاكس لاختبار الزملاء.`},{id:`alt_fb_3`,title:`بديل ٣: مفارقة المقارنة والموقف الحياتي لـ (${e||`الدرس`})`,styleBadge:`موقف حياتي ومقارنة`,studentDisplayPrompt:`مفارقة المقارنة المباشرة:
تأمل النموذجين المعروضين (أ) و (ب):
ما الفرق الجوهري بينهما في المعنى والأثر؟ وأيهما يعبر بدقة عن القاعدة الصحيحة؟`,teacherNotes:`توجيه الطلاب لملاحظة الفروق الدقيقة وتدوين أدلتهم قبل إعلان معيار النجاح الصريح.`,scaffolds:`جدول ثنائي بمؤشرين واضحين للمقارنة.`,extension:`تطبيق المقارنة على موقف جديد من واقع المدرسة.`}]}},M=async({title:e=``,subject:t=``,grade:n=``,duration:r=45})=>{let{geminiKey:i,groqKey:a}=await s(),o=e.trim()||`مهارة دراسية مركزية`,c=t.trim()||`عام`,l=`أنت مصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم أدخل بيانات الحصة:
- الموضوع: ${o}
- المادة الدراسية: ${c}
- الصف: ${n.trim()||`المرحلة الابتدائية`}
- المدة: ${r===`وحدة كاملة`?`وحدة تعليمية كاملة`:`${r} دقيقة`}

المطلوب: كتابة صياغات تربوية دقيقة ومحكمة بصيغة السلوك الملاحظ الصريح:
1. "objective": هدف التعلم المركزي الصريح (ماذا سيتقن الطالب بنهاية الحصة).
2. "successCriteria": معيار النجاح المحدد بدقة (أداء صريح ومحك كمي أو كيفي يثبت تحقق الهدف، مثلا: حل ٣ مسائل دون خطأ، تصنيف ٤ عناصر وتبريرها).
3. "prerequisites": المعرفة والمهارة السابقة المفترضة التي يحتاجها الطالب للانطلاق في الدرس.

أخرج JSON فقط بالهيكل التالي (املأ القيم بنصوص عربية فصيحة ومتقنة):
{
  "objective": "",
  "successCriteria": "",
  "prerequisites": ""
}`,u=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,\s*}/g,`}`).replace(/,\s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(a)for(let e of[`openai/gpt-oss-120b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${a}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:l}],temperature:.5,max_tokens:1e3,response_format:{type:`json_object`}})},1e4);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=u(e);if(t&&t.objective)return t}}}catch(t){console.warn(`Groq objectives (${e}) failed:`,t)}if(i)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:`${l}\n\nStrict JSON response only:`}]}],generationConfig:{temperature:.4,maxOutputTokens:1e3,responseMimeType:`application/json`}})},1e4);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=u(e);if(t&&t.objective)return t}}}catch(t){console.warn(`Gemini objectives (${e}) failed:`,t)}return{objective:`أن يتقن الطالب مهارة (${o}) وتطبيق قواعدها ومفاهيمها بدقة في سياقات تعليمية متنوعة.`,successCriteria:`حل وتطبيق ثلاثة أمثلة أو أنشطة جديدة بنجاح وبشكل مستقل، مع تقديم تبرير أو تفسير مناسب.`,prerequisites:`معرفة مسبقة بالمفاهيم الأساسية المرتبطة بـ (${c}) وخبرات تعليمية من الدروس السابقة.`}},N=async({stationKey:e=`m`,stationTitle:t=``,currentPrompt:n=``,instruction:r=``,title:i=``,subject:a=``,grade:o=``})=>{let{geminiKey:c,groqKey:l}=await s(),u=i.trim()||`الدرس`,f=a.trim()||`عام`,p=o.trim()||`المرحلة الابتدائية`,m=r.trim()||`تحسين وإثراء المحطة لتكون أكثر تفاعلية وتشويقاً ومناسبة للطلاب`,h=`أنت المعلم الخبير ومصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم يريد تعديلاً وتخصيصاً فورياً لمحتوى إحدى محطات الدرس بناءً على طلبه وتوجيهه الخاص:
- موضوع الحصة: ${u}
- المادة الدراسية: ${f}
- الصف: ${p}
- المحطة المستهدفة: [ ${e} ] ${t}
- المحتوى الحالي لشاشة الطلاب:
"""
${n}
"""
- توجيه وطلب المعلم الصريح للتعديل:
"""
${m}
"""

قواعد صارمة:
1. في حقل (studentDisplayPrompt): اكتب النص الحقيقي الكامل المخصص لشاشة الطلاب (الأسئلة، الألغاز، النصوص، أو التمارين الحقيقية الصريحة الجاهزة للحل مباشرة)، وليس نصائح عامة للمعلم.
2. التزم تماماً برغبة وتوجيه المعلم أعلاه وطبقها بإبداع وإتقان تربوي.
3. وفر ملاحظات معلم واضحة، وسقالة مساندة (تلميح دون حرق الحل)، ومهمة تحدٍّ للمتفوقين.

أخرج JSON فقط بالهيكل التالي:
{
  "studentDisplayPrompt": "",
  "teacherNotes": "",
  "scaffolds": "",
  "extension": ""
}`,g=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,\s*}/g,`}`).replace(/,\s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(l)for(let e of[`openai/gpt-oss-120b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${l}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:h}],temperature:.5,max_tokens:2800,response_format:{type:`json_object`}})},14e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=g(e);if(t&&t.studentDisplayPrompt)return t}}}catch(t){console.warn(`Groq modify station (${e}) failed:`,t)}if(c)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${c}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:`${h}\n\nStrict JSON response only:`}]}],generationConfig:{temperature:.4,maxOutputTokens:2500,responseMimeType:`application/json`}})},14e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=g(e);if(t&&t.studentDisplayPrompt)return t}}}catch(t){console.warn(`Gemini modify station (${e}) failed:`,t)}return{studentDisplayPrompt:`[تعديل مقترح لـ ${t}]:\n${n}\n\n⭐ تطبيق لتوجيهك: تدريب تفاعلي إضافي موجه للمجموعات الصفيّة مع التركيز على التحليل والتفكير المستقل.`,teacherNotes:`إدارة النشاط وفق توجيه المعلم: "${m}". منح الطلاب دقيقة تفكير مستقل قبل بدء العمل المشترك.`,scaffolds:`بطاقة تلميح داعمة: مراجعة القاعدة الأساسية وتحديد الكلمات المفتاحية في السؤال.`,extension:`مهمة تحدٍ إضافية: صياغة مسألة أو مثال مشابه من الحياة اليومية لعرضه على الزملاء.`}},P=async({title:e=``,subject:t=``,grade:n=``,coreTask:r=``})=>{let{geminiKey:i,groqKey:a}=await s(),o=e.trim()||`الدرس`,c=`أنت مصمم التدريس المتمايز بنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم يريد توليد ٣ مهام وتحديات متمايزة لمجموعات الصف في محطة [ت] تطبيق وتدريب:
- موضوع الدرس: ${o}
- المادة الدراسية: ${t.trim()||`عام`}
- الصف: ${n.trim()||`المرحلة الابتدائية`}
${r?`- نص المهمة الأساسية للصف: "${r}"`:``}

المطلوب: توليد ٣ تحديات جماعية محددة بنصوصها وأسئلتها الفعلية الجاهزة فوراً للحل على شاشات أو دفاتر الطلاب:
1. مجموعة الانطلاق والدعم: تحدي مباشر ومبسط مع خيارات وسقالة واضحة للمساندة.
2. مجموعة الممارسة والإتقان: تطبيق المعيار الأساسي للدرس بدقة وتبرير.
3. مجموعة التحدي والابتكار: سؤال تفكير عليا، اكتشاف أخطاء، أو تأليف موقف جديد.

لكل مجموعة:
- level ("support" | "core" | "advanced")
- groupName (اسم تربوي محفز للمجموعة)
- badge (وسام تعبيري)
- task (الأسئلة والتمارين الصريحة الحقيقية)
- scaffold (سقالة مساندة وتلميح ذكي دون حرق الحل النهائي)

أخرج JSON فقط بالهيكل التالي:
{
  "groups": [
    {
      "level": "support",
      "groupName": "فريق الانطلاق والتمكن",
      "badge": "🌱 دعم ومساندة",
      "task": "",
      "scaffold": ""
    },
    {
      "level": "core",
      "groupName": "فريق الممارسة والإتقان",
      "badge": "⭐ ممارسة المعيار",
      "task": "",
      "scaffold": ""
    },
    {
      "level": "advanced",
      "groupName": "فريق الرواد والتحدي",
      "badge": "🚀 تحدٍّ وابتكار",
      "task": "",
      "scaffold": ""
    }
  ]
}`,l=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,\s*}/g,`}`).replace(/,\s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(a)for(let e of[`openai/gpt-oss-120b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${a}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:c}],temperature:.5,max_tokens:2800,response_format:{type:`json_object`}})},14e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=l(e);if(t&&Array.isArray(t.groups)&&t.groups.length>0)return t}}}catch(t){console.warn(`Groq group tasks (${e}) failed:`,t)}if(i)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:`${c}\n\nStrict JSON response only:`}]}],generationConfig:{temperature:.4,maxOutputTokens:2500,responseMimeType:`application/json`}})},14e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=l(e);if(t&&Array.isArray(t.groups)&&t.groups.length>0)return t}}}catch(t){console.warn(`Gemini group tasks (${e}) failed:`,t)}return{groups:[{level:`support`,groupName:`فريق الانطلاق والتمكن`,badge:`🌱 دعم ومساندة`,task:`حل التمرين المباشر حول موضوع (${o}): اختر الإجابة المناسبة لكل عبارة مع وضع خط تحت الكلمة الدالة.`,scaffold:`تلميح: راجع المثال التوضيحي الأول واستعن ببطاقة القواعد المكتوبة أعلى الصفحة.`},{level:`core`,groupName:`فريق الممارسة والإتقان`,badge:`⭐ ممارسة المعيار`,task:`طبق القاعدة الأساسية لـ (${o}) على ثلاث فقرات جديدة، مع كتابة تعليل موجز لكل خطوة.`,scaffold:`تلميح: تأكد من مراجعة معيار النجاح والتأكد من مطابقة جميع الشروط المطلوبة.`},{level:`advanced`,groupName:`فريق الرواد والتحدي`,badge:`🚀 تحدٍّ وابتكار`,task:`اكتشف الخطأ الخفي في نموذج الحل المعروض وفسر سببه، ثم قم بصياغة مثال جديد لاختبار زملائك في باقي الفرق.`,scaffold:`تلميح: فكر في الحالات الخاصة والاستثناءات التي نوقشت أثناء الدرس.`}]}},F=async({title:e=``,grade:t=``,specialRequests:n=``})=>{let{geminiKey:r,groqKey:i}=await s(),a=e.trim()||`مهارة مركزية تفاعلية`,o=t.trim()||`المرحلة الابتدائية`,c=n.trim(),l=`أنت مصمم التعليم والمناهج لنظام «مِفتاح — رحلة التعلّم» بمدرسة مشيرفة الابتدائية.
المعلم أدخل ٣ مدخلات فقط لإنشاء الحصة:
- عنوان الدرس: ${a}
- الصف: ${o}
${c?`- طلبات وتوجيهات خاصة للمعلم: "${c}"`:``}

المطلوب: توليد مسودة متكاملة ومترابطة للحصة وفق محطات مِفتاح الخمس بالترتيب الإلزامي:
1. مشوّق ومحفّز
2. فهم وبناء المعنى
3. التطبيق والتدريب
4. أدلة الفهم
5. حصاد ونقل الأثر

- المعايير البيداغوجية الصارمة:
- في كل محطة من المحطات الخمس (دون استثناء): يجب كتابة الحقول الثلاثة الإلزامية:
  1. "studentPrompt": المحتوى الصريح الموجّه للطلاب لشرح المادة والتمارين والتعليمات بلغة واضحة ومشجعة فورية العرض على شاشاتهم.
  2. "teacherGuidance": التخطيط وكواليس المعلم لإدارة الحوار الصفي، وتوجيه الطلاب، والملاحظة، ومعالجة المفاهيم البديلة.
  3. "scaffold": تلميح ومفتاح المساعدة الجاهز للمحطة لمساندة الطلاب دون حرق الحلول.
- الأنشطة التفاعلية في المحطة الأولى (مشوّق ومحفّز) أو أي محطة أخرى:
  * إذا طلب المعلم في الطلبات الخاصة أو في التخطيط "أحجية" أو "لغز" (riddle): جهّز كائن "interactiveActivity" بنوع "riddle" يتضمن نص الأحجية، تلميحات كسقالات مساندة، خيارات تفاعلية، والحل الصريح مع ربطه بهدف الدرس.
  * إذا طلب المعلم "بازل" أو "puzzle" أو "ترتيب" أو "تركيب": جهّز كائن "interactiveActivity" بنوع "puzzle" يتضمن تعليمات الترتيب، قطع البازل المرقمة المنطقية، المفهوم المستهدف، ورسالة النجاح.
  * إذا طلب المعلم "فيديو" أو "فيلم": جهّز كائن "interactiveActivity" بنوع "video" مع عنوان الفيلم وكلمات بحث يوتيوب الدقيقة ورابط مقترح وسؤال التأمل.
  * قاعدة تطابق العرض مع التخطيط: يجب أن يتطابق حقل "type" في interactiveActivity تماماً مع فحوى ما كتبته في studentPrompt؛ فإذا كتبت لغزاً أو مشهداً محيراً يجب أن يكون type = "riddle"، وإذا فيلم type = "video"، وإذا بازل type = "puzzle".
- في المحطة الثانية: اختر الطريقة الأنسب ("guided_exploration" أو "direct_instruction" أو "blended") واكتب مادتها ومفاهيمها الصريحة.
- في المحطة الثالثة (التطبيق والتدريب) على وجه الخصوص:
  * "studentPrompt": شرح توجيهي وتطبيقي شامل للطلاب يشرح لهم كيفية تطبيق المفاهيم، ويلخص القواعد العلمية الأساسية للتطبيق العملي بلغة واضحة وخطوات عملية، وبيّن لهم كيفية عمل المجموعات وتوزيع المهام المتمايزة.
  * "teacherGuidance": إرشادات التخطيط وكواليس المعلم لإدارة المحطة الثالثة: كيفية توجيه النقاش، مراقبة تفاعل الفرق، أسئلة السبر والتدخل المساند، ومراعاة الفروق الفردية.
  * "scaffold": مفتاح وتلميح مساند عام للمحطة دون حرق الحلول.
  * "tasks": وفر ٣ مهمات وتحديات متمايزة (support, core, advanced) مع سقالة لكل منها.
- في المحطة الرابعة (أدلة الفهم):
  * "studentPrompt": مهمة التحقق الفردي المستقل الصريحة المعروضة للطلاب.
  * "teacherGuidance": إرشادات المعلم لتقييم الدليل الفردي واستخدام سلم المعايير.
  * "scaffold": تلميح مساند مسموح به.
  * حدد مهمة الدليل الفردي (individualTask) ومعيار التحقق الصريح (criterion).
- في المحطة الخامسة (حصاد ونقل الأثر):
  * "studentPrompt": توجيهات الحصاد الصريحة للطلاب للإجابة على بطاقة الخروج والتفكير في نقل الأثر للحياة اليومية.
  * "teacherGuidance": إرشادات المعلم لختام الحصة وجمع بطاقات الخروج ومراجعة المخرجات.
  * "scaffold": سؤال مساند للتأمل.
  * ضع أسئلة بطاقة الخروج الأربعة (q1, q2, q3, q4_transfer).

أخرج JSON صالحاً فقط:
{
  "title": "${a}",
  "grade": "${o}",
  "objective": "الهدف الصريح والمحدد للدرس...",
  "successCriteria": "معيار النجاح الصريح القابل للقياس...",
  "suggestedDuration": 45,
  "stations": {
    "1_hook": {
      "name": "مشوّق ومحفّز",
      "number": 1,
      "icon": "🔥",
      "studentPrompt": "اللغز أو الموقف المثير الصريح المعروض للطلاب...",
      "teacherGuidance": "إرشادات المعلم السرية لإدارة المدخل المحفز وكتابة الهدف على اللوح...",
      "suggestedDuration": 6,
      "scaffold": "تلميح للبدء...",
      "interactiveActivity": {
        "type": "riddle",
        "title": "عنوان النشاط المشوق",
        "riddle": {
          "riddleText": "نص الأحجية أو اللغز الذكي والمحفز لفضول الطلاب...",
          "clues": [
            "التلميح الأول (سقالة مساعدة 1)",
            "التلميح الثاني (سقالة مساعدة 2)"
          ],
          "options": ["خيار أ", "خيار ب", "خيار ج", "خيار د"],
          "solution": "حل الأحجية الصريح",
          "explanation": "ربط الحل بهدف الدرس ومفهومه الأساسي"
        },
        "puzzle": {
          "instruction": "رتب قطع أو خطوات البازل بالتسلسل المنطقي الصحيح",
          "pieces": [
            { "id": "p1", "text": "القطعة أو الخطوة الأولى", "order": 1 },
            { "id": "p2", "text": "القطعة أو الخطوة الثانية", "order": 2 },
            { "id": "p3", "text": "القطعة أو الخطوة الثالثة", "order": 3 },
            { "id": "p4", "text": "القطعة أو الخطوة الرابعة", "order": 4 }
          ],
          "targetConcept": "المفهوم النهائي الذي يكشفه اكتمال البازل",
          "successMessage": "أحسنت! اكتمل البازل وتكشف المفتاح المعرفي"
        },
        "video": {
          "title": "عنوان الفيلم أو المقطع المشوق",
          "searchQuery": "كلمات بحث يوتيوب الدقيقة للفيلم",
          "youtubeUrl": "رابط مقترح إن وجد",
          "reflectionQuestion": "سؤال التأمل والمناقشة بعد المشاهدة"
        }
      },
      "media": {
        "type": "video",
        "title": "عنوان الفيلم أو المقطع المشوق",
        "searchQuery": "كلمات بحث يوتيوب الدقيقة للفيلم",
        "youtubeUrl": "رابط مقترح إن وجد",
        "reflectionQuestion": "سؤال التأمل والمناقشة بعد المشاهدة"
      }
    },
    "2_understanding": {
      "name": "فهم وبناء المعنى",
      "number": 2,
      "icon": "🧩",
      "pedagogicalMode": "guided_exploration",
      "pedagogicalModeName": "الاستكشاف الموجّه",
      "studentPrompt": "المفاهيم والأمثلة والشرح الصريح للطلاب...",
      "teacherGuidance": "إرشادات النمذجة أو قيادة الاستكشاف الصفي...",
      "suggestedDuration": 12,
      "scaffold": "منظم بصري أو خطوة مساعدة..."
    },
    "3_practice": {
      "name": "التطبيق والتدريب",
      "number": 3,
      "icon": "🛠️",
      "studentPrompt": "شرح توجيهي وتطبيقي شامل للطلاب: كيف نطبق المفاهيم، خطوات العمل الجماعي، وما المطلوب من الفرق...",
      "teacherGuidance": "إرشادات التخطيط وكواليس المعلم لإدارة المحطة الثالثة ومتابعة المجموعات ومعالجة الصعوبات...",
      "scaffold": "تلميح ومفتاح المساعدة الجاهز للمحطة...",
      "suggestedDuration": 15,
      "workMode": "groups",
      "tasks": [
        { "tier": "support", "badge": "🌱 فريق الانطلاق والتمكن", "title": "مهمة الانطلاق", "task": "تمرين مباشر مع خيارات وسقالة...", "scaffold": "سقالة مساندة..." },
        { "tier": "core", "badge": "⭐ فريق الممارسة والإتقان", "title": "مهمة الإتقان", "task": "تطبيق المعيار الأساسي للدرس مع التعليل...", "scaffold": "سقالة مساندة..." },
        { "tier": "advanced", "badge": "🚀 فريق الرواد والتحدي", "title": "مهمة التحدي", "task": "مهمة تفكير عليا وتطبيق مركب أو اكتشاف أخطاء...", "scaffold": "تلميح للتفكير..." }
      ]
    },
    "4_evidence": {
      "name": "أدلة الفهم",
      "number": 4,
      "icon": "🔎",
      "studentPrompt": "مهمة التحقق الفردي المستقل الصريحة المعروضة للطلاب لحلها بمفردهم...",
      "teacherGuidance": "إرشادات المعلم لتقييم الدليل الفردي وملاحظة مستويات الإتقان...",
      "scaffold": "تلميح مساند مسموح به دون حرق الحل...",
      "suggestedDuration": 7,
      "criterion": "معيار التحقق: ما الذي يثبت تحقق هدف التعلم لدى كل طالب...",
      "individualTask": "مهمة الدليل الفردي الصريحة التي يحلها كل طالب بمفرده...",
      "allowedHelp": ["تلميح بسيط", "توضيح التعليمات"],
      "evalLevels": {
        "mastered": "حقق الهدف",
        "partial": "حققه جزئياً",
        "needs_support": "يحتاج دعماً",
        "insufficient_data": "الدليل غير كافٍ للحكم"
      }
    },
    "5_harvest": {
      "name": "حصاد ونقل الأثر",
      "number": 5,
      "icon": "🎒",
      "studentPrompt": "توجيهات الحصاد الصريحة للطلاب لتلخيص التعلم والإجابة عن بطاقة الخروج والتأمل في نقل الأثر...",
      "teacherGuidance": "إرشادات المعلم لإغلاق الحصة وجمع بطاقات الخروج ومراجعة المخرجات...",
      "scaffold": "تأمل: كيف تغير فهمك للموضوع اليوم؟",
      "suggestedDuration": 5,
      "exitTicket": {
        "q1": "ما أهم فكرة تعلّمتها اليوم؟",
        "q2": "ما الذي ساعدني على الفهم؟",
        "q3": "ما الذي ما زلت أحتاج إلى توضيحه؟ (يمكنك اختيار: لا أحتاج إلى توضيح إضافي)",
        "q4_transfer": "أين أستطيع استخدام ما تعلّمته؟"
      }
    }
  }
}`,u=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,\s*}/g,`}`).replace(/,\s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}},f=e=>{if(!e||!e.stations)return e;let t=(c+` `+a).toLowerCase(),n=t.match(/فيلم|فيديو|مقطع|video|film|movie/i),r=t.match(/أحجية|احجية|لغز|فزورة|غموض|riddle|mystery/i),i=t.match(/بازل|puzzle|ترتيب|تركيب|jigsaw/i),o=e.stations[`1_hook`];if(o){let e=t.includes(`تميز`)||t.includes(`التميز`)||t.includes(`نجاح`)||t.includes(`تفوق`),s={title:e?`فيلم قصير عن التميز والنجاح: ما سر الفرق بين الشخص العادي والمتميز؟`:`فيلم تعليمي قصير: ${a}`,searchQuery:e?`فيلم كرتوني عن التميز والنجاح للاطفال رسوم متحركة`:`فيديو تعليمي للاطفال عن ${a}`,youtubeUrl:e?`https://www.youtube.com/watch?v=EUm-vAOmWV1`:``,reflectionQuestion:`بعد مشاهدة هذا الفيلم: ما الفرق الجوهري الذي استنتجتموه؟ وكيف نطبق ذلك في درسنا اليوم؟`},c=e?{riddleText:`لستُ شيئاً تشتريه بالمال، ولا حجراً تجده في الرمال. إن بدأتَ عملاً أتقنته، وإن واجهك فشلٌ تحديته وتجاوزته! لا أرضى بالعادي بل أطمح للأفضل دائماً... فمن أكون؟`,clues:[`🔑 تلميح 1: كلمة تبدأ بحرف التاء، وترتبط بالإتقان والشغف والاجتهاد.`,`🔑 تلميح 2: هو شعار مدرستنا مشيرفة، والسر وراء كل عالم ومبتكر ومبدع!`],options:[`الكسل والانتظار`,`العمل العادي`,`التميّز والإتقان ⭐`,`الاستسلام السريع`],solution:`التميّز والإتقان المستمر ⭐`,explanation:`التميز ليس موهبة نولد بها فحسب، بل هو قرار واختيار يومي بالسعي والاجتهاد والتطور المستمر كما سنكتشف في محطات درسنا اليوم!`}:{riddleText:`أنا سرٌّ يرتبط بـ (${a})، أظهر في البداية كلغز محير، ولكن حينما تفكر في أسبابه وتستكشف خصائصه، أصبح مفتاحك للحل والنجاح... فما هو التفسير العلمي المنطقي وراء هذا الموقف؟`,clues:[`🔑 تلميح 1: فكر في العلاقة المباشرة بين المعطيات وما تعلمته سابقاً.`,`🔑 تلميح 2: استبعد التخمينات العشوائية وركز على الخاصية الأساسية التي لا تتغير.`],options:[`تفسير عشوائي بدون دليل`,`المفهوم العلمي المنطقي لـ ${a} 🎯`,`تجاهل الموقف`,`الاعتماد على الحظ`],solution:`المفهوم العلمي المنطقي لـ (${a}) 🎯`,explanation:`الحل يكمن في تطبيق التفكير المنطقي وربط الملاحظة بالدليل للوصول للهدف التعليمي للحصة.`},l=e?{instruction:`رتب مراحل صعود قمة التميز بالترتيب الذهبي الصحيح لاكتمال البازل:`,pieces:[{id:`p1`,text:`١. تحديد الهدف والشغف 🎯`,order:1},{id:`p2`,text:`٢. البدء بالمحاولة الأولى والتدريب المستمر 🏃‍♂️`,order:2},{id:`p3`,text:`٣. التعلم من الأخطاء وتجاوز العثرات 💡`,order:3},{id:`p4`,text:`٤. الوصول إلى الإتقان والتميز وخدمة المجتمع 🌟`,order:4}],targetConcept:`معادلة التميز الحقيقي في مدرسة مشيرفة الابتدائية`,successMessage:`🎉 رائع جداً! لقد ركّبتم بازل التميز واكتشفتم أن التميز رحلة إصرار وعمل مستمر!`}:{instruction:`رتب خطوات استكشاف وتطبيق (${a}) بالترتيب الصحيح لاكتمال البازل المعرفي:`,pieces:[{id:`p1`,text:`١. الملاحظة واستكشاف الموقف وتحديد المشكلة 🔍`,order:1},{id:`p2`,text:`٢. تحليل المعطيات وربط العلاقات ببعضها 🧩`,order:2},{id:`p3`,text:`٣. صياغة الاستنتاج وتطبيق القاعدة الحسابية/العلمية ⚙️`,order:3},{id:`p4`,text:`٤. التحقق من صحة الحل وتقديم الدليل الفردي ✅`,order:4}],targetConcept:`المسار المتكامل لفهم وتطبيق (${a})`,successMessage:`🎉 ممتاز! اكتمل بازل المعرفة بنجاح وحصلتم على المفتاح الذهبي للمحطة!`},u=`video`;r?u=`riddle`:i?u=`puzzle`:n?u=`video`:o.interactiveActivity?.type&&(u=o.interactiveActivity.type),o.interactiveActivity={type:u,title:u===`riddle`?o.interactiveActivity?.riddle?.riddleText?`أحجية المحطة`:`أحجية ولغز: ${a}`:u===`puzzle`?`بازل التحدي: ${a}`:s.title,riddle:{...c,...o.interactiveActivity?.riddle||{}},puzzle:{...l,...o.interactiveActivity?.puzzle||{}},video:{...s,...o.interactiveActivity?.video||{},...o.media||{}}},o.media={type:`video`,title:o.interactiveActivity.video.title,searchQuery:o.interactiveActivity.video.searchQuery,youtubeUrl:o.interactiveActivity.video.youtubeUrl,reflectionQuestion:o.interactiveActivity.video.reflectionQuestion}}let s=e.stations[`2_understanding`];s&&((!s.studentPrompt||!s.studentPrompt.trim())&&(s.studentPrompt=`المفاهيم العلمية الأساسية لـ (${a}):\n• استكشف الخصائص الجوهرية التي تميز هذا المفهوم.\n• لاحظ النماذج والأمثلة الحية وقارن بينها بدقة.\n• دوّن القاعدة الأساسية في دفترك العلمي.`),(!s.teacherGuidance||!s.teacherGuidance.trim())&&(s.teacherGuidance=`إرشادات المعلم لمحطة بناء المعنى:
١. وجّه الطلاب نحو النمذجة والاستكشاف الصفي النشط.
٢. اطرح أسئلة توجيهية تساعد الطلاب على صياغة الاستنتاج بأنفسهم.
٣. ركّز على تثبيت المفهوم المركزي ومعايير التمييز بدقة.`),(!s.scaffold||!s.scaffold.trim())&&(s.scaffold=`منظم بصري أو خطوة استرشادية مساندة.`));let l=e.stations[`3_practice`];l&&((!l.studentPrompt||!l.studentPrompt.trim())&&(l.studentPrompt=`مرحباً بكم يا علماء المستقبل في محطة التطبيق والتدريب! 🛠️\nفي هذه المحطة سنقوم بتطبيق ما تعلمناه حول (${a}) وتعميق فهمنا العملي.\n• تذكّروا المعايير والمفاهيم الأساسية التي استنتجناها في المحطة السابقة.\n• ستعمل الفرق وفق ٣ مستويات متمايزة (الانطلاق والتمكن، الممارسة والإتقان، الرواد والتحدي).\n• تعاونوا داخل مجموعتكم، ناقشوا التحديات، وبرروا كل خطوة تبريراً علمياً سليماً!`),(!l.teacherGuidance||!l.teacherGuidance.trim())&&(l.teacherGuidance=`إرشادات المعلم لإدارة محطة التطبيق والتدريب:
١. وجّه الطلاب إلى فرقهم المتمايزة بحسب مستويات الجاهزية والاستعداد.
٢. أكّد على تطبيق المعايير العلمية المستهدفة والتعاون الإيجابي.
٣. تجوّل بين المجموعات: وجّه فريق الانطلاق بالسقالات المساندة، وادفع فريق الإتقان لدقة الصياغة والتبرير، وتحدَّ فريق الرواد بأسئلة تفكير عليا.
٤. راقب التفاعل وحفّز الطلاب على تصحيح أخطائهم ذاتياً عبر الحوار.`),(!l.scaffold||!l.scaffold.trim())&&(l.scaffold=`تلميح مساند: ارجع إلى القاعدة المركزية للمحطة السابقة واستند إليها في كل تمرين.`));let u=e.stations[`4_evidence`];u&&((!u.studentPrompt||!u.studentPrompt.trim())&&(u.studentPrompt=u.individualTask||`مهمة التحقق الفردي المستقل (حل بمفردك) ✍️\nأثبت فهمك وإتقانك لـ (${a}) بحل التمرين المخصص لك في بطاقتك دون مساعدة خارجية، وقدّم تبريراً واضحاً لإجابتك.`),(!u.teacherGuidance||!u.teacherGuidance.trim())&&(u.teacherGuidance=`إرشادات المعلم لتقييم الدليل الفردي:
١. تأكد من استقلالية كل طالب أثناء الحل لقياس الأثر الحقيقي للتعلم.
٢. راقب المفاهيم البديلة وصنّف الإجابات فورياً وفق مستويات الإتقان الأربعة.
٣. حدد الفجوات الشائعة لتناولها في بداية الحصة القادمة أو ضمن الدعم المركز.`),(!u.scaffold||!u.scaffold.trim())&&(u.scaffold=`تذكّر: اقرأ السؤال بدقة، وركّز على تقديم دليل علمي مقنع.`));let d=e.stations[`5_harvest`];return d&&((!d.studentPrompt||!d.studentPrompt.trim())&&(d.studentPrompt=`محطة الحصاد ونقل الأثر 🎒✨\nوصلنا إلى ختام رحلتنا التعليمية الرائعة! حان وقت رصد ثمار تعلمكم اليوم:\n١. ما الفكرة الجوهرية التي اكتسبتموها عن (${a})؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف تستفيد مما تعلّمته في حياتك اليومية ومحيطك؟`),(!d.teacherGuidance||!d.teacherGuidance.trim())&&(d.teacherGuidance=`إرشادات المعلم لإغلاق الحصة:
١. امنح الطلاب ٤-٥ دقائق لإتمام بطاقة الخروج بهدوء وتأمل ذاتي.
٢. استمع لـ ٢-٣ مشاركات ملهمة حول نقل الأثر إلى الحياة اليومية.
٣. اجمع بطاقات الخروج أو تفقد النتائج إلكترونياً لتقييم نسبة تحقق الهدف العام.
٤. وجّه كلمة شكر وتشجيع للطلاب على شغفهم وتفكيرهم الاستنتاجي.`),(!d.scaffold||!d.scaffold.trim())&&(d.scaffold=`تأمل: كيف تطوّر فهمك وثقتك بالمفهوم منذ بداية الدرس حتى الآن؟`)),e};if(i)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${i}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:l}],temperature:.45,max_tokens:3200})},16e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content,n=u(e);if(n&&n.stations&&n.stations[`1_hook`])return f(n)}}catch(t){console.warn(`Groq full journey (${e}) failed:`,t)}if(r)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${r}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:`${l}\n\nStrict JSON response only:`}]}],generationConfig:{temperature:.4,maxOutputTokens:3200,responseMimeType:`application/json`}})},16e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text,n=u(e);if(n&&n.stations&&n.stations[`1_hook`])return f(n)}}catch(t){console.warn(`Gemini full journey (${e}) failed:`,t)}return f({title:a,grade:o,objective:`أن يتمكن الطالب من استيعاب وتطبيق المهارات والمفاهيم الأساسية لدرس (${a}) وتبرير خطواته بدقة.`,successCriteria:`حل وتطبيق ثلاثة تمارين متنوعة بنجاح، وتقديم دليل فردي يثبت الفهم المستقل، ونقل الأثر لموقف حياتي.`,suggestedDuration:45,stations:{"1_hook":{name:`مشوّق ومحفّز`,number:1,icon:`🔥`,studentPrompt:`لغز وتحدي المدخل لدرس (${a}):\nتأمل هذا الموقف المثير: حدثت مفارقة تجعلنا نتساءل: كيف يمكننا التفسير بدقة ودون غموض؟ ما الذي يثير فضولك وما أول فكرة تخطر ببالك؟`,teacherGuidance:`اعرض الموقف وناقش فضول الطلاب دون إعلان الحل فوراً. اكتب الهدف ومعيار النجاح بخط بارز على اللوح.`,suggestedDuration:6,scaffold:`فكر في العلاقة بين المعطيات وما درسته في الحصة السابقة.`},"2_understanding":{name:`فهم وبناء المعنى`,number:2,icon:`🧩`,pedagogicalMode:`guided_exploration`,pedagogicalModeName:`الاستكشاف الموجّه`,studentPrompt:`بناء المفاهيم والقاعدة الذهبية لـ (${a}):\n١. المفهوم الأساسي: التعريف والخصائص المركزية.\n٢. القاعدة التطبيقية: الخطوات الثلاث للوصول للحل الصحيح.\n٣. مثال محلول توضيحي خطوة بخطوة.`,teacherGuidance:`وجّه الطلاب لملاحظة النمط واستخراج القاعدة بأنفسهم قبل التلخيص الجماعي.`,suggestedDuration:12,scaffold:`مخطط بصري ملخص للقاعدة وللكلمات المفتاحية.`},"3_practice":{name:`التطبيق والتدريب`,number:3,icon:`🛠️`,suggestedDuration:15,workMode:`groups`,tasks:[{tier:`support`,badge:`🌱 فريق الانطلاق والتمكن`,task:`حل تمرين مباشر حول (${a}): اختر الإجابة المناسبة من بين الخيارات مع توضيح بسيط للسبب.`,scaffold:`تلميح: راجع المثال الأول في بطاقة الشرح واستبعد الخيار غير المنطقي.`},{tier:`core`,badge:`⭐ فريق الممارسة والإتقان`,task:`طبق القاعدة الأساسية لـ (${a}) على ثلاث فقرات جديدة في دفترك، مع كتابة تعليل موجز لكل خطوة.`,scaffold:`تلميح: تأكد من مطابقة جميع معايير النجاح وتدوين خطواتك بوضوح.`},{tier:`advanced`,badge:`🚀 فريق الرواد والتحدي`,task:`اكتشف الخطأ الخفي في نموذج الحل المعروض وفسر سببه، ثم صغ مسألة جديدة لتحدي زملائك في باقي الفرق.`,scaffold:`تلميح: ركز على الحالات الاستثنائية التي نوقشت أثناء الدرس.`}]},"4_evidence":{name:`أدلة الفهم`,number:4,icon:`🔎`,suggestedDuration:7,criterion:`تقديم إجابة فردية مستقلة ومبررة تثبت امتلاك مهارة (${a}) دون مساعدة.`,individualTask:`مهمة التحقق الفردي:
أجب عن السؤالين التاليين في بطاقتك الخاصة بمفردك:
١. تطبيق مباشر على المفهوم المركزي.
٢. تعليل علمي أو لغوي موجز لسبب اختيارك.`,allowedHelp:[`تلميح بسيط`,`توضيح التعليمات`],evalLevels:{mastered:`حقق الهدف`,partial:`حققه جزئياً`,needs_support:`يحتاج دعماً`,insufficient_data:`الدليل غير كافٍ للحكم`}},"5_harvest":{name:`حصاد ونقل الأثر`,number:5,icon:`🎒`,suggestedDuration:5,exitTicket:{q1:`ما أهم فكرة تعلّمتها اليوم؟`,q2:`ما الذي ساعدني على الفهم؟`,q3:`ما الذي ما زلت أحتاج إلى توضيحه؟ (يمكنك اختيار: لا أحتاج إلى توضيح إضافي)`,q4_transfer:`أين أستطيع استخدام ما تعلّمته في حياتي خارج المدرسة؟`}}}})},I=async(e,t=[],n=`مستكشفنا البطل`)=>{let{geminiKey:r,groqKey:i}=await s(),a=`أنت "جني البحث العلمي السحري" 🧞‍♂️✨ في مدرسة مشيرفة الابتدائية، المساعد السحري الذكي للأطفال في رحلة البحث العلمي والاكتشاف.
أنت تتحدث باللغة العربية الفصحى الجميلة والمبهجة، بأسلوب مرح ومشجع مفعم بالحماس والذكاء (مثل جني الفانوس الودود المحب للعلوم 🧞‍♂️).
أنت تخاطب الطالب باسمه دائماً: "${n}".

مهامك الإرشادية في البحث العلمي:
1. صياغة سؤال البحث: مساعدة الطالب في تحويل أفكاره وفضوله إلى سؤال بحث علمي محدد وقابل للقياس، بصيغة واضحة مثل: "ما تأثير [المتغير المستقل] على [المتغير التابع]؟".
2. الفرضية العلمية: تعليمه كيف يصوغ تخميناً ذكياً قابلاً للاختبار بصيغة: "إذا قمنا بـ... فإن ... سيحدث لأن...".
3. المتغيرات: شرح المتغير المستقل (الذي نغيره)، والمتغير التابع (الذي نقيسه)، والعوامل الثابتة بأسلوب مبسط بالأمثلة.
4. تخطيط التجربة: اقتراح خطوات عملية آمنة، وأدوات منزلية أو مدرسية بسيطة، وطريقة تسجيل الملاحظات.
5. استخلاص النتائج والاستنتاج: كيف يجيب عن سؤاله بناءً على ما شاهده في التجربة.
6. الإجابة على أي سؤال علمي عام بأسلوب شيق يبهر الطالب ويشعل فضوله.

قواعد الإجابة:
- ابدأ برد مرح مثل: "شبيك لبيك يا بطلنا ${n}! 🧞‍♂️✨" أو "بأمر العلم والفضول العجيب!"
- قسّم الإجابة إلى نقاط قصيرة وواضحة جداً يسهل على تلميذ ابتدائي قراءتها.
- استخدم إيموجيز علمية مشوقة (🔬 🌱 🧪 ⚡ 💡 🚀).
- شجع الطالب دائماً واختم بسؤال تفاعلي مرح يدفعه للخطوة التالية.
- ممنوع تماماً كتابة أي نصوص بالإنجليزية أو مسودات تفكير.`,o=[{role:`system`,content:a}];if(Array.isArray(t)){let e=t.slice(-6);for(let t of e)t.sender===`user`?o.push({role:`user`,content:t.text}):t.sender===`genie`&&t.text&&o.push({role:`assistant`,content:t.text})}if(o.push({role:`user`,content:e}),i)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${i}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:o,temperature:.7,max_tokens:1200})},1e4);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e&&e.trim()){let t=f(e.trim());if(t)return t}}}catch(t){console.warn(`Genie AI (${e}) failed:`,t)}if(r){let t=[`gemini-1.5-flash`,`gemini-2.0-flash`,`gemini-1.5-pro`],i=`${a}\n\nسؤال الطالب ${n}: "${e}"`;for(let e of t)try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${r}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:i}]}],generationConfig:{temperature:.7,maxOutputTokens:1200}})},1e4);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim()){let t=f(e.trim());if(t)return t}}}catch(t){console.warn(`Genie AI Gemini (${e}) failed:`,t)}}return`شبيك لبيك يا بطلنا المبدع ${n}! 🧞‍♂️✨\nسؤالك العلمي مدهش جداً! تذكر أن كل بحث علمي يبدأ بـ:\n1. 🔍 ملاحظة شيء يثير دهشتك.\n2. ❓ صياغة سؤال واضح ومحدد (ما تأثير... على...؟).\n3. 💡 وضع فرضية ذكية قابلة للاختبار.\n4. 🧪 تجربة ممتعة تسجل فيها أرقامك وملاحظاتك!\nما هي فكرة التجربة التي ترغب في استكشافها معاً؟ 🪄🌱`},L=async({rawText:e=``,fileBase64:t=``,mimeType:n=`text/plain`,fileName:r=``})=>{if(e&&typeof e==`string`)try{let t=e.trim();if(t.startsWith(`{`)&&t.endsWith(`}`)){let e=JSON.parse(t);if(e.stations&&(e.stations.m||e.stations.f||e.stations.t||e.stations.y||e.stations.h))return{title:e.title||r.replace(/\.[^/.]+$/,``)||`تخطيط درس مستورد`,subject:e.subject||`عام`,grade:e.grade||`المرحلة الابتدائية`,duration:Number(e.duration)||45,objective:e.objective||``,author:e.author||`مستورد من الحاسوب`,stations:{m:e.stations.m||``,f:e.stations.f||``,t:e.stations.t||``,a:e.stations.a||e.stations.y||``,y:e.stations.a||e.stations.y||``,h:e.stations.h||``}}}}catch{}let{geminiKey:i,groqKey:a}=await s(),o=/[\u0590-\u05FF]/.test(e||``)||/[\u0590-\u05FF]/.test(r||``),c=o?`אתה המומחה הפדגוגי הבכיר של מודל "מַפְתֵּי"חַ" (מודל מפתיח) בבית הספר היסודי מושירפה.
מורה העלה קובץ תכנון שיעור ממחשבו האישי (שם הקובץ: "${r}").
משימתך: לקרוא בעיון רב את תוכן הקובץ, לחלץ את מרכיביו ולשבץ/להמיר אותם במדויק לחמש תחנות מודל מַפְתֵּי"חַ [ מ , פ , ת , י , ח ]:
1. [ מ ] משיכה וסקרנות (משוך): גירוי מוחשי, שאלת סקרנות, עירור ידע קודם, והכלת כלל התלמידים.
2. [ פ ] פיתוח הבנה (הבנה): מטרת השיעור, המשגה, מילון מושגים, ומידול המורה (I Do).
3. [ ת ] תובנה והעמקה (תבונה): שאלות חשיבה מסדר גבוה, נימוק, ודיון מעמיק.
4. [ י ] יצירה ויישום (יישום): משימה מעשית, 3 מסלולי תמאוז (נתמך, רגיל, מאתגר), ושולחן ממוקד.
5. [ ח ] חתימה וצידה לדרך (חתימה): רפלקציה, 5 השאלות, והצידה לדרך שלוקח התלמיד.

אם הקובץ המקורי בנוי במבנה שיעור מסורתי (פתיחה, גוף, סיכום), פרוס והעשר את התוכן במקצועיות רבה כך שימלא את חמש התחנות באופן מושלם.
חלץ גם: כותרת/נושא השיעור (title), תחום דעת (subject), שכבת גיל/כיתה (grade), משך השיעור (duration בדקות), ומטרת השיעור (objective).

החזר פלט בפורמט JSON בלבד:
{
  "title": "כותרת השיעור",
  "subject": "תחום הדעת",
  "grade": "שכבת הגיל",
  "duration": 45,
  "objective": "מטרת השיעור",
  "stations": {
    "m": "תוכן תחנת משיכה וסקרנות...",
    "f": "תוכן תחנת פיתוח הבנה...",
    "t": "תוכן תחנת תובנה והעמקה...",
    "y": "תוכן תחנת יצירה ויישום...",
    "h": "תוכן תחנת חתימה וצידה לדרך..."
  }
}`:`أنت الخبير البيداغوجي والمستشار التربوي الأول لنموذج «مِفتاح» (موديل مفتیح) بمدرسة مشيرفة الابتدائية.
قام المعلم برفع ملف تخطيط حصة دراسية من حاسوبه (اسم الملف: "${r}").
مهمتك بدقة وإتقان تام: قراءة محتوى الملف المرفق، واستخراج وتوزيع وإعادة صياغة محتواه بذكاء ليتطابق مع المحطات الخمس لنموذج مِفتاح المعتمد بمدرسة مشيرفة:
1. [ م ] مدخل محفّز (משיכה וסקרנות): إثارة الفضول، سؤال الانطلاق، الاحتواء، والتقويم الأولي، وعبارة الانتقال الإلزامية.
2. [ ف ] فهم وبناء المعنى (פיתוח הבנה): الهدف بلغة الطلاب، النص أو المفهوم العلمي، نمذجة المعلم (I Do)، والاحتواء والتقويم التكويني.
3. [ ت ] تفكير وتبصّر (תובנה והעמקה): أسئلة التفكير العليا (HOTS)، المناقشة السقراطية، والتعمق.
4. [ ي ] إنجاز وتطبيق (יצירה ויישום): ورشة العمل ومسارات التمايز الثلاثة (دعم، أساسي، وإثراء/تحدٍ) ودمج UDL.
5. [ ح ] حصاد وزوّادة (חתימה וצידה לדרך): التأمل الذاتي، تذكرة الخروج، زوّادة الطالب، وسؤال نقل الأثر الحياتي للمنزل.

إذا كان التخطيط المرفوع مكتوباً بهيكل تقليدي (مثل: تمهيد، شرح، أسئلة، واجب بيتي)، قم بفرز وتوزيع وإثراء المحتوى بذكاء ومهنية عالية ليغذي المحطات الخمس كاملة بدون أي نقص وبأعلى معايير الجودة البيداغوجية.
استخرج أيضاً:
- عنوان الدرس (title)
- المادة الدراسية (subject)
- الصف (grade)
- زمن الحصة بالدقائق (duration)
- الهدف العام ومؤشرات النجاح (objective)

أخرج النتيجة بصيغة JSON حصراً بدون أي كود أو نصوص خارج الـ JSON:
{
  "title": "عنوان الدرس",
  "subject": "المادة الدراسية",
  "grade": "الصف",
  "duration": 45,
  "objective": "الهدف التعليمي ومعايير النجاح",
  "stations": {
    "m": "نص محطة المدخل المحفز بتفاصيلها...",
    "f": "نص محطة فهم وبناء المعنى بنمذجة المعلم والمفهوم...",
    "t": "نص محطة التفكير والتبصر وأسئلة التفكير العليا...",
    "y": "نص محطة الإنجاز والتطبيق ومسارات التمايز الثلاثة...",
    "h": "نص محطة الحصاد والزوّادة وتذكرة الخروج..."
  }
}`,l=e=>{if(!e)return null;let t=e.trim();t.startsWith("```json")?t=t.slice(7):t.startsWith("```")&&(t=t.slice(3)),t.endsWith("```")&&(t=t.slice(0,-3)),t=t.trim();let n=t.indexOf(`{`),i=t.lastIndexOf(`}`);n!==-1&&i!==-1&&i>n&&(t=t.substring(n,i+1));try{let e=JSON.parse(t);if(e.stations&&(e.stations.m||e.stations.f||e.stations.t||e.stations.y||e.stations.h))return{title:e.title||r.replace(/\.[^/.]+$/,``)||`تخطيط درس مستورد`,subject:e.subject||`عام`,grade:e.grade||`المرحلة الابتدائية`,duration:Number(e.duration)||45,objective:e.objective||``,author:`مستورد من الحاسوب ومُعالج بموديل مِفْتَاح`,stations:{m:e.stations.m||``,f:e.stations.f||``,t:e.stations.t||``,y:e.stations.y||``,h:e.stations.h||``}}}catch(e){console.warn(`Failed parsing AI JSON response:`,e)}return null};if(i)for(let r of[`gemini-1.5-flash`,`gemini-2.0-flash`,`gemini-1.5-pro`])try{let a=[];if(t&&(n===`application/pdf`||n.startsWith(`image/`))?(a.push({inlineData:{mimeType:n,data:t}}),a.push({text:c})):e&&a.push({text:`${c}\n\nنص ملف التخطيط المرفوع من الحاسوب:\n"""\n${e.slice(0,15e3)}\n"""`}),a.length>0){let e=await d(`https://generativelanguage.googleapis.com/v1beta/models/${r}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:a}],generationConfig:{temperature:.4,maxOutputTokens:3800,responseMimeType:`application/json`}})},14e3);if(e.ok){let t=(await e.json()).candidates?.[0]?.content?.parts?.[0]?.text,n=l(t);if(n)return n}}}catch(e){console.warn(`Gemini upload parser (${r}) failed:`,e)}if(a&&e)for(let t of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`])try{let n=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${a}`},body:JSON.stringify({model:t,messages:[{role:`system`,content:o?`אתה יועץ פדגוגי של מודל מפתיח. עליך להמיר את מערך השיעור המועלה ל-JSON של 5 התחנות.`:`أنت خبير بيداغوجي لنموذج مِفتاح. حول التخطيط المرفوع إلى JSON يحوي المحطات الخمس بدقة.`},{role:`user`,content:`${c}\n\nنص ملف التخطيط المرفوع:\n"""\n${e.slice(0,15e3)}\n"""`}],temperature:.4,max_tokens:3800,response_format:{type:`json_object`}})},13e3);if(n.ok){let e=(await n.json()).choices?.[0]?.message?.content,t=l(e);if(t)return t}}catch(e){console.warn(`Groq upload parser (${t}) failed:`,e)}let u=(e||``).split(`
`).map(e=>e.trim()).filter(Boolean),f=r.replace(/\.[^/.]+$/,``).replace(/[-_]/g,` `)||`تخطيط درس مستورد من الحاسوب`,p=`عام`,m=`المرحلة الابتدائية`,h=``;for(let e=0;e<Math.min(u.length,15);e++){let t=u[e];/عنوان|موضوع الدرس|נושא השיעור/i.test(t)?f=t.replace(/.*[:\-–]/,``).trim()||f:/مادة|المادة|الموضوع|تחום דעת/i.test(t)?p=t.replace(/.*[:\-–]/,``).trim()||p:/صف|الصف|כיתה/i.test(t)?m=t.replace(/.*[:\-–]/,``).trim()||m:/هدف|الهدف|الأهداف|מטרה/i.test(t)&&(h=t.replace(/.*[:\-–]/,``).trim()||h)}let g=u.length,_=Math.max(1,Math.floor(g/5)),v=(e,t)=>u.slice(e,t).join(`

`);return{title:f,subject:p,grade:m,duration:45,objective:h||`استيعاب المفاهيم الأساسية وتطبيقها في أنشطة متنوعة وفق نموذج مِفتاح.`,author:`مستورد من الحاسوب`,stations:{m:v(0,_)||`🔥 [م - مشوّق ومحفّز]: إثارة الفضول واستدعاء المعرفة السابقة وتهيئة الطلاب وتحديد هدف التعلم ومعيار النجاح.`,f:v(_,_*2)||`💡 [ف - فهم وبناء المعنى]: تقديم المفهوم الأساسي بلغة واضحة ونمذجة المعلم للمهارة خطوة بخطوة وتوضيح معايير النجاح.`,t:v(_*2,_*3)||`🛠️ [ت - تطبيق وتدريب]: مهمة أساسية مشتركة، سقالات دعم، تحديات للمتقدمين، وتفعيل مجموعة الدعم الفوري المؤقتة.`,y:v(_*3,_*4)||`🔎 [ي - يقين من الفهم]: أداة فحص فردية لقياس دليل حدوث التعلم وتحديد قرارات المعلم الثلاثة (تقدم / تدريب إضافي / دعم مختلف).`,h:v(_*4,g)||`🎒 [ح - حصاد وزوّادة]: تأمل ذاتي وتذكرة خروج تلخص الزوّادة المعرفية والوجدانية وسؤال نقل الأثر للبيت.`}}},R=async({stationNumber:e=1,problemTitle:t=``,problemDetail:n=``,whyProblem:r=``,extraContext:i=``})=>{let{geminiKey:a,groqKey:o}=await s(),c={1:`أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 1: اكتشاف المشكلة وفهمها):
مساعدة الطالب في صياغة مشكلة مدرسية واقعية بدقة:
عنوان التحدي: "${t||`مشكلة مدرسية`}"
ما كتبه الطالب عن المشكلة: "${n||`لا يوجد وصف بعد`}"
ما كتبه عن أسباب المشكلة ولماذا هي مشكلة: "${r||`لا يوجد تعليل بعد`}"

المطلوب:
1. قدم تشجيعاً حاراً للطالب.
2. وضح له كيف يعبر عن المشكلة بالتحديد وبجملة واضحة ومحددة.
3. ساعده في شرح "لماذا هي مشكلة حقيقية" (الأضرار المترتبة على صحة الطلاب أو البيئة أو التعلم في مدرسة مشيرفة إذا لم تحل).
4. اطرح عليه سؤالين توجيهيين لتحديد من يتأثر بها ومتى وأين تحدث بالتحديد.
اجعل الرد بنقاط قصيرة، لغة عربية فصحى مشوقة وميسرة لطلاب الابتدائي، مع إيموجيز مشجعة.`,2:`أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 2: مصفوفة تكامل التخصصات STEAM):
التحدي المطروح: "${t}"
تفاصيل المشكلة: "${n} - لماذا هي مشكلة: ${r}"

المطلوب: اقترح أفكاراً ذكية ومبسطة ومناسبة لطلاب الابتدائي لربط المشكلة بأركان STEAM الخمسة:
• 🔬 العلوم (S): قانون أو ظاهرة علمية يمكن الاستفادة منها.
• 💻 التكنولوجيا (T): فكرة استخدام حساس أو أداة رقمية بسيطة.
• 🛠️ الهندسة (E): فكرة لتصميم وبناء نموذج من خامات بسيطة كرتون أو خشب.
• 🎨 الفنون واللغات (A): شعار جذاب وفكرة بوستر أو أسلوب إلقاء.
• 📐 الرياضيات (M): حسابات أو قياسات أو نسب مئوية يمكن قياسها.
اجعل الأفكار ملموسة وقابلة للتطبيق بالمدرسة.`,3:`أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 3: هندسة النموذج الأولي والعرض Prototyping & Pitching):
التحدي: "${t}"
المطلوب:
1. اقترح نصائح لبناء نموذج أولي بأدوات آمنة وبسيطة متوفرة في المدرسة أو البيت.
2. اكتب له مسودة سيناريو إلقاء سريع في دقيقة واحدة (Elevator Pitch) مكون من 4 جمل:
   - الجملة 1: ما المشكلة التي لاحظناها؟
   - الجملة 2: ما حلنا المبتكر؟
   - الجملة 3: كيف يعمل؟
   - الجملة 4: ما الفائدة لمدرستنا مشيرفة؟`,4:`أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 4: الاختبار والتقييم التبادلي Testing & Peer Review):
التحدي: "${t}"
المطلوب:
1. كيف يختبر الطالب نموذجه عملياً في ساحة أو صفوف مدرسة مشيرفة بأمان؟
2. ما الأرقام والقياسات التي يمكنه تسجيلها للتأكد من نجاح الفكرة (مثل: قياس الوزن، كمية الماء، درجة الصوت، الوقت المستغرق)؟
3. نصيحة لكيفية تقبل ملاحظات الزملاء وتحويلها إلى أفكار تطويرية.`,5:`أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 5: التحسين وإعادة التصميم Iteration & Redesign):
التحدي: "${t}"
سياق التعديل: "${i}"
المطلوب:
1. وضح للطالب أن الأخطاء والتحديات في النماذج الأولية هي سر نجاح أعظم العلماء والمخترعين!
2. اقترح 3 أفكار لتطوير النموذج للنسخة المحسنة (V2) وحل المشاكل الشائعة.`,6:`أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
مهمتك في (المحطة 6: قياس الأثر والتكريم Impact & Recognition):
التحدي: "${t}"
المطلوب:
1. صغ بياناً ختامياً فخوراً للمشروع يوضح كيف سيغير هذا الابتكار مدرسة مشيرفة للأفضل.
2. اقترح عبارة وسام وشعار تميز يستحقه الفريق.`},l=c[e]||c[1];if(o)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${o}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:[{role:`system`,content:`أنت مرشد بيداغوجي ذكي لحاضنة ستيم بمدرسة مشيرفة الابتدائية. قدم إرشادات تشجيعية وعملية باللغة العربية الفصحى.`},{role:`user`,content:l}],temperature:.6,max_tokens:650})},8e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e&&e.trim())return f(e.trim())}}catch(t){console.warn(`Groq STEAM Station Guide (${e}) failed:`,t)}if(a)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${a}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:l}]}],generationConfig:{temperature:.6,maxOutputTokens:650}})},8e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return f(e.trim())}}catch(t){console.warn(`Gemini STEAM Station Guide (${e}) failed:`,t)}return`أحسنت يا بطل الابتكار! 🌟 في هذه المحطة، ركّز على ربط ما تلاحظه في مدرستنا مشيرفة بالحلول العملية. كل فكرة مهما كانت بسيطة هي بداية لاختراع عظيم! 🚀💡`},z=async({stationNumber:e=1,ageTrack:t=`upper`,problemText:n=``,questionText:r=``,evidenceText:i=``,subjectKey:a=``,solutionsList:o=``,planText:c=``,testDataText:l=``,reflectionText:u=``})=>{let{geminiKey:p,groqKey:m}=await s(),h=t===`lower`,g=h?`أنت تتحدث مع تلميذ في الصفوف الأولى (1-3). استخدم جملاً قصيرة جداً ومرحة، كلمات سهلة ومشجعة، وأمثلة حسية ملموسة.`:`أنت تتحدث مع تلميذ في الصفوف العليا (4-6). استخدم أسلوباً علمياً مشوقاً، وركز على الدليل، والتحديد، والقياس.`,_=``;switch(e){case 1:_=`المحطة 1: ألاحظ: ما المشكلة؟
رسالة المحطة: «انظر حولك: ما الشيء الذي تتمنى تحسينه في المدرسة أو البيت أو الحي؟»
ما كتبه الطالب: "${n}"
المطلوب منك:
1. اطرح عليه سؤالين استقصائيين مثل: "متى لاحظت ذلك؟" و "ما الذي رأيته بنفسك في مدرسة مشيرفة؟".
2. ساعده على التمييز بين موضوع عام (مثل "الكهرباء" أو "النظافة") ومشكلة محددة قابلة للملاحظة.
3. اقترح له صياغة أوضح وأدق للمشكلة ليراجعها ويختار ما يناسبه.`;break;case 2:_=`المحطة 2: أحدّد: ماذا أريد أن أعرف أو أغيّر؟
المشكلة الملاحظة: "${n}"
سؤال التحدي الحالي: "${r}"
المطلوب منك:
1. اشرح للطالب الفرق بين: ما شاهده كواقع، وتفسيره المحتمل، وفكرته للحل.
2. ساعده على تضييق السؤال ليصبح سؤال بحث أو تحدياً هندسياً عملياً يبدأ بـ "كيف يمكننا... دون أن...؟".
3. ذكّره بالحدود العملية (الوقت المتاح، المواد الممكنة في المدرسة، وما يمكن قياسه).`;break;case 3:_=`المحطة 3: أستكشف: ماذا نعرف قبل أن نقترح حلًا؟
المشكلة: "${n}"
ما كتبه كدليل: "${i}"
المطلوب منك:
1. نبّه الطالب بلطف إذا كان قد كتب تخميناً أو حكماً شخصياً على أنه حقيقة، وسل: "كيف عرفت ذلك؟ وما مصدر هذه المعلومة؟".
2. ساعده على التمييز بين "وجدت دليلاً على..." و "ما زلت لا أعرف...".
3. اقترح عليه مصدرين أو فكرتين بسيطتين لجمع أدلة حقيقية من بيئة المدرسة.`;break;case 4:_=`المحطة 4: أرى المشكلة بعيون المواد (العدسة: ${a||`المواد الدراسية`})
المشكلة: "${n}"
المطلوب منك:
بين للطالب كيف ينظر معلم ${a||`المادة`} لهذه المشكلة، واقترح عليه فكرة لسؤال أو مهمة قصيرة جداً خاصة بهذه المادة تجعل مشروعه أكثر عمقاً وتكاملاً.`;break;case 5:_=`المحطة 5: أتخيل وأقارن حلولًا
المشكلة: "${n}"
الحلول المقترحة: "${o}"
المطلوب منك:
1. ساعد الطالب في مقارنة حلوله بحسب المعايير (هل يعالج المشكلة؟ هل يمكن تنفيذه؟ ما مواده؟ كيف سنعرف أنه نجح؟).
2. اسأله عن ميزة كل فكرة وأهم قيد أو عائق أمامها (دون أن تختار الحل نيابة عنه!).`;break;case 6:_=`المحطة 6: أخطّط وأبني
المشروع والحل المختار: "${c}"
المطلوب منك:
1. ساعد في ترتيب خطوات العمل في 3-4 خطوات متسلسلة.
2. اقترح عليه كيف يوزع الأدوار بإنصاف بين أعضاء الفريق.
3. قدم نصيحة لاختيار خامات آمنة وقليلة التكلفة في المدرسة أو البيت.`;break;case 7:_=`المحطة 7: أجرّب وأقيس
ما كتبه عن التجربة والبيانات: "${l}"
المطلوب منك:
1. شجع الطالب على قياس ما قبل التجربة وما بعد التجربة (Before / After).
2. اسأله: "هل تدعم هذه الأرقام استنتاجك؟ وما الذي قد يكون أثر على النتيجة؟".
3. اقترح طريقة بسيطة لعرض الأرقام (جدول أو رسم مبسط).`;break;case 8:_=`المحطة 8: أتبصّر وأعيد المحاولة
رسالة المحطة: «ماذا نجح؟ ماذا لم ينجح؟ ما الذي ستغيّره، ولماذا؟»
ما كتبه الطالب: "${u}"
المطلوب منك:
1. أكد للطالب أن إعادة المحاولة والتعديل جزء أساسي وممتع في رحلة الابتكار وليست إخفاقاً أبداً.
2. اقترح عليه فكرتين لتطوير نسخته الثانية (V2).`;break;case 9:_=`المحطة 9: أشارك الأثر
ملخص المشروع: "${n} | ${c}"
المطلوب منك:
1. صغ عبارة ملهمة وموجزة تعبر عن فخر المدرسة بهذا الابتكار.
2. اطرح السؤال الختامي: "لمن يفيد الحل؟ وما الخطوة التالية لتطبيقه على نطاق أوسع في مدرستنا؟".`;break;default:_=`قدم نصيحة تفكير هندسي وبحثي لتلميذ المرحلة الابتدائية حول: "${n}".`}let v=`أنت "مرشد مختبر التميّز" في مدرسة مشيرفة الابتدائية.
${g}
قواعدك الصارمة:
- لا تعطِ حلاً جاهزاً أبداً؛ دورك أن تسأل، وتلفت النظر للثغرات، وتساعد في صياغة الفكرة.
- الرد بلغة عربية فصحى مشوقة، مقسم لنقاط قصيرة، مع إيموجيز مشجعة (💡 🔬 🔍 🛠️ 🎯).
- الحد الأقصى للرد: 3 إلى 4 أسطر فقط لتناسب تركيز التلميذ.

المهمة الحالية:
${_}`;if(m)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=await d(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${m}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:[{role:`system`,content:`أنت مرشد مختبر التميز بمدرسة مشيرفة.`},{role:`user`,content:v}],temperature:.5,max_tokens:500})},7500);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e&&e.trim())return f(e.trim())}}catch(t){console.warn(`Groq ExcellenceLab AI (${e}) error:`,t)}if(p)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await d(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${p}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:v}]}],generationConfig:{temperature:.5,maxOutputTokens:500}})},7500);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return f(e.trim())}}catch(t){console.warn(`Gemini ExcellenceLab AI (${e}) error:`,t)}return h?`أحسنت يا بطل! 🌟 فكرتك جميلة جداً، فكر في شيء شاهدته بنفسك في مدرستنا، وتذكر أن العلماء الصغار يلاحظون الأشياء بذكاء! 🔍💡`:`خطوة ممتازة نحو التفكير العلمي! 🌟 احرص على أن تميز بين ما رأيته كدليل مؤكد وما تتوقعه، واجعل سؤالك محدداً بدقة. 🎯🔬`};export{D as C,L as D,N as E,T as O,E as S,R as T,_,w as a,g as b,p as c,k as d,A as f,j as g,M as h,f as i,v as l,P as m,S as n,m as o,F as p,y as r,x as s,b as t,C as u,h as v,z as w,O as x,I as y};