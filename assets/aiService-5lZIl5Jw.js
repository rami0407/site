import{C as e,b as t,c as n,f as r,h as i,l as a,m as o,o as s,p as c,s as l,v as u}from"./vendor-firebase-PmTLqhqV.js";import{n as d}from"./firebase-9J2weHRd.js";var f=`musheirifa_mafatih_library_plans_v1`,p=`musheirifa_mafatih_deleted_ids_v1`,m=()=>{try{let e=localStorage.getItem(p);return e?JSON.parse(e):[]}catch{return[]}},h=e=>{try{let t=m();t.includes(e)||(t.push(e),localStorage.setItem(p,JSON.stringify(t)))}catch(e){console.error(`Failed to mark plan as deleted:`,e)}},g=e=>{if(!e)return``;if(typeof e==`string`)return e;if(typeof e==`number`)return String(e);if(typeof e==`object`){let t=[];return e.station_name&&t.push(`📌 ${e.station_name}`),e.student_question&&t.push(`❓ سؤال الطالب: ${e.student_question}`),e.process_and_activity&&t.push(`⚙️ سيرورة الفعالية: ${e.process_and_activity}`),e.inclusion_integration_example&&t.push(`🤝 دمج واحتواء: ${e.inclusion_integration_example}`),e.differentiation_example&&t.push(`🎯 تمايز UDL: ${e.differentiation_example}`),e.assessment_example&&t.push(`📊 تقييم وفحص فهم: ${e.assessment_example}`),e.transition_phrase&&t.push(`🔄 عبارة الانتقال: ${e.transition_phrase}`),e.hebrew_station_name&&t.push(`📌 ${e.hebrew_station_name}`),e.title&&!t.some(t=>t.includes(e.title))&&t.push(`📌 ${e.title}`),e.text&&!t.some(t=>t.includes(e.text))&&t.push(e.text),e.content&&!t.some(t=>t.includes(e.content))&&t.push(e.content),e.prompt&&!t.some(t=>t.includes(e.prompt))&&t.push(e.prompt),e.teacherNotes&&!t.some(t=>t.includes(e.teacherNotes))&&t.push(`📝 إرشادات المعلم: ${e.teacherNotes}`),e.studentDisplayPrompt&&!t.some(t=>t.includes(e.studentDisplayPrompt))&&t.push(`🗣️ للطلاب: ${e.studentDisplayPrompt}`),e.scaffolds&&!t.some(t=>t.includes(e.scaffolds))&&t.push(`🪜 دعم وتمايز: ${e.scaffolds}`),e.extension&&!t.some(t=>t.includes(e.extension))&&t.push(`🚀 تعميق وتحدٍ: ${e.extension}`),t.length===0&&Object.entries(e).forEach(([e,n])=>{typeof n==`string`&&n.trim()&&t.push(n.trim())}),t.length>0?t.join(`

`):``}return String(e)},_=e=>!e||typeof e!=`object`?{m:``,f:``,t:``,y:``,h:``}:{m:g(e.m),f:g(e.f),t:g(e.t),y:g(e.y||e.a),h:g(e.h)},v=[{id:`seed-arabic-1`,title:`أسلوب التعجب: صياغته ودلالاته البلاغية والوجدانية`,subject:`لغة عربية`,grade:`الصف الخامس`,duration:45,author:`طاقم اللغة العربية — مدرسة مشيرفة`,createdAt:`2026-09-20T10:00:00.000Z`,objective:`أن يتعرف التلميذ على صياغة أسلوب التعجب القياسي (ما أفعل!) ويميز أركانه ويوظفه للتعبير عن دهشته وامتنانه.`,stations:{m:`🧲 [م - جذب وتشويق] (5 دقائق):
عرض صورة مقربة مذهلة لأطول شجرة معمرة في العالم بمقارنة طفل يقف بجوارها. يطرح المعلم تحدي الدهشة: "من يستطيع أن يصف هذا المشهد العظيم بجملة تفيض ذهولاً دون استخدام كلمة (كبير أو عظيم) وحدها؟ كيف تنقل شحنة انبهارك للآخرين في 4 كلمات؟".`,f:`💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):
استخراج جملة "ما أعظمَ الشجرةَ!" ونمذجة المعلم (I Do) لتفكيك أركان التركيب القياسي للتعجب: [ما التعجبية + فعل التعجب "أفعلَ" + المتعجب منه المنصوب + علامة التعجب !]. تدريب صوتي جماعي على نبرة التعجب والانفعال الصوتي.`,t:`🧠 [ت - تبصر وتعمق] (8 دقائق):
حوار سقراطي في التفكير البلاغي: "إذا قال باحث: (هذه الشجرة طويلة جداً) وقال أديب: (ما أطولَ الشجرةَ!)، ما الفرق في الشحنة الشعورية والأثر النفسي على السامع؟ وهل التعجب مجرد قاعدة نحوية أم نافذة تعبيرية للامتنان والتأمل في الكون؟".`,y:`🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):
ورشة ثنائيات ومجموعات عمل متمايزة:
• مسار الدعم: بطاقات ملونة لصياغة تعجب من كلمات مبعثرة وفق القالب (ما + أفعل + المتعجب منه).
• المسار الأساسي: كتابة 3 جمل تعجب مضبوطة بالشكل تصف معالم طبيعية وأثرية من قرية مشيرفة وبيئتنا.
• مسار التميز: تحويل نص وصفي بارد إلى فقرة أدبية نابضة بالدهشة باستخدام أساليب التعجب المتنوعة.`,h:`🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):
تعبئة تذكرة الخروج (Exit Ticket):
1. زوّادتي المعرفية: أركان أسلوب التعجب (ما + أفعلَ + المتعجب منه المنصوب + !).
2. زوّادتي الحياتية ونقل الأثر: "سأوظف أسلوب التعجب الليلة في البيت لأعبر لوالدتي عن امتناني ولذة طعامها: (ما أطيبَ طعامَكِ يا أمي!)، ولأعبر لصديقي عن تقديري لعمله المميز".`}},{id:`seed-science-1`,title:`الدارات الكهربائية المغلقة: الموصولية، العزل والأمان المنزلي`,subject:`علوم وتكنولوجيا`,grade:`الصف السادس`,duration:45,author:`طاقم العلوم والتكنولوجيا`,createdAt:`2026-09-21T09:30:00.000Z`,objective:`أن يستنتج التلميذ مفهوم الدارة المغلقة والمفتوحة، ويميز بين المواد الموصلة والعازلة حسياً، ويصيغ ميثاقاً للأمان الكهربائي.`,stations:{m:`🧲 [م - جذب وتشويق] (5 دقائق):
تجربة الصدمة والاستثارة الحسية: دارة كهربائية بسيطة بها مصباح صغير. يلمس المعلم طرفيها بمفتاح معدني فيتوهج المصباح، ثم يلمس بممحاة مطاطية فينطفئ فجأة! سؤال اللغز: "لماذا عبر سيل الكهرباء في المعدن وتوقف أمام المطاط؟ ما السر الذري الخفي بينهما؟".`,f:`💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):
تفكيك المفاهيم العلمية: تعريف الدارة المغلقة والدارة المفتوحة، والمفهوم المجهري لحركة الإلكترونات الحرة في المواد الموصلة والمقيدة في المواد العازلة. نمذجة رسم المخطط الرمزي للدارة (بطارية، قاطع، أسلاك، مصباح) على اللوح التفاعلي.`,t:`🧠 [ت - تبصر وتعمق] (8 دقائق):
نقاش تفكير عليا وتحليل مخاطر: "لماذا تصنع أسلاك الكهرباء في بيوتنا وشواحن هواتفنا من النحاس ولكنها تُغلف بالبلاستيك دائماً؟ وماذا يحدث لو لمس إنسان سلكاً عارياً ويداه مبللتان بالماء والملح؟ برر علمياً سبب خطورة الماء الملحي".`,y:`🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):
مختبر استكشاف في مجموعات بحثية رباعية:
• المسار العملي: بناء دارة حقيقية باستخدام بطارية، أسلاك ومصباح، واختبار 6 مواد من الصف (مسمار حديدي، مسطرة بلاستيك، عملة، خشب، قلم رصاص، ماء).
• مسار التوثيق: تعبئة جدول تصنيف المواد إلى موصلة وعازلة.
• مسار الابتكار: تصميم قاطع كهربائي آمن ومبتكر من أدوات ومخلفات بيئية داخل الصف.`,h:`🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):
تعبئة تذكرة الخروج وميثاق الأمان:
1. زوّادتي العلمية: الدارة المغلقة مسار متصل للإلكترونات، والعوازل تحمينا من الصعق.
2. تطبيقي المنزلي: "سأتفقد اليوم بصحبة والدي جميع أسلاك التوصيل وشواحن الأجهزة في غرفتي للتأكد من سلامة عزلها، وتنبيه عائلتي لعدم لمس أي مقبس بأيدٍ رطبة".`}},{id:`seed-math-1`,title:`مساحة المستطيل والمربع وحساب تكلفة البلاط والطلاء`,subject:`رياضيات`,grade:`الصف الرابع`,duration:45,author:`طاقم الرياضيات — مدرسة مشيرفة`,createdAt:`2026-09-21T11:15:00.000Z`,objective:`أن يستنتج التلميذ قانون حساب مساحة المستطيل والمربع ويطبقهما لحل مشكلات واقعية هندسية ومالية.`,stations:{m:`🧲 [م - جذب وتشويق] (5 دقائق):
معضلة حقيقية من واقع المدرسة: "أراد مدير المدرسة تبليط ساحتين؛ الساحة (أ) مستطيلة أبعادها 8م × 3م، والساحة (ب) مربعة 5م × 5م. ادعى المقاول أن الساحة (أ) أكبر لأن طولها 8 أمتار! هل توافقه الرأي؟ أيهما تختار لتبليطها ولماذا؟".`,f:`💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):
تجسيد المفهوم عبر شبكة المربعات (Grid Units): الانتقال من العد اليدوي للمربعات إلى استنتاج القانون الجبري: مساحة المستطيل = الطول × العرض، ومساحة المربع = الضلع × نفسه. نمذجة المعلم لحل مسألة مركبة وتحديد وحدة القياس (سم² أو م²).`,t:`🧠 [ت - تبصر وتعمق] (8 دقائق):
أسئلة التفكير الرياضي العليا: "إذا ضاعفنا طول المستطيل فقط مع ثبات عرضه، كم مرة ستتضاعف المساحة؟ وماذا يحدث للمساحة إذا ضاعفنا الطول والعرض معاً؟ أثبت إجابتك برسم هندسي ومعادلة حسابية".`,y:`🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):
ورشة المهندس الصغير في ثنائيات ومجموعات:
• مسار الدعم: استخدام بطاقات الشفافيات المقسمة لمربعات وتغطية مستطيلات جاهزة لحساب المساحة بالعد ثم بالضرب.
• المسار الأساسي: قياس أبعاد أسطح المقاعد، السبورة، ودفتر الرياضيات وحساب مساحتها بوحدات سم² وم² بدقة.
• مسار التحدي: حساب التكلفة المالية لدهان جدار غرفة بأبعاد 6م × 3م إذا كانت علبة الدهان الواحدة تغطي 9م² وسعرها 50 شيكل.`,h:`🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):
تذكرة الخروج والتطبيق الحياتي:
1. زوّادتي: المساحة هي قياس الحيز الداخلي للشكل وتُحسب بضرب الطول في العرض.
2. مشروعي اليومي: "سأقيس اليوم أبعاد غرفتي في البيت بالمتر مع إخوتي، لأساعد والدي في معرفة مساحتها الدقيقة وتحديد مقاس السجادة المناسبة للشتاء".`}},{id:`seed-values-1`,title:`المسؤولية المشتركة والمحافظة على الممتلكات العامة والبيئة المدرسية`,subject:`موطن ومجتمع ومدنيات`,grade:`الصف الخامس`,duration:45,author:`مركزة التربية الاجتماعية`,createdAt:`2026-09-22T08:00:00.000Z`,objective:`أن يعي التلميذ الفارق بين الملكية العامة والخاصة، ويمارس سلوك المواطنة الفاعلة للمحافظة على بيئة قريته ومدرسته.`,stations:{m:`🧲 [م - جذب وتشويق] (5 دقائق):
عرض بصري مقارن: صورتان لساحة مدرستين؛ الأولى حديقة غناء نظيفة ومرتبة، والثانية ساحة تعمها الفوضى والمهملات. سؤال الانطلاق: "المكانان ملك للجميع وليس لشخص واحد.. كيف يصنع قرار فردي واحد الفرق بين القبح والجمال؟ وما هو شعورك حين تمشي في كل منهما؟".`,f:`💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):
تأطير المفهوم والحوار التشاركي: تفكيك الفارق الجوهري بين (الملكية الخاصة) و(الملكية العامة). ترسيخ مفهوم "المواطنة الفاعلة والمسؤولية الأخلاقية"، ومناقشة بنود ميثاق الشرف المدرسي لطلاب مدرسة مشيرفة.`,t:`🧠 [ت - تبصر وتعمق] (8 دقائق):
معضلة أخلاقية واقعية: "شاهدت زميلك يرمي عبوة عصير في ساحة المدرسة ويقول: (هناك عامل نظافة هذه وظيفته!). كيف تحاوره بمنطق يجمع بين الاحترام، وحفظ كرامة العامل، والمسؤولية الذاتية تجاه بيئتنا المشتركة؟".`,y:`🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):
ورشة المبادرة والعمل الميداني:
• الفريق البيئي: وضع خطة فورية لتدوير الورق والكرتون داخل الصف وتصميم صندوق التدوير الأخضر.
• الفريق الإعلامي: كتابة ورسم لافتات توعوية ملهمة وشعارات مبتكرة لتعليقها في ممرات المدرسة.
• فريق الميدان: عمل مسح لزوايا الساحة واقتراح مشروع "ركن الورود والظل" لخدمة كافة الطلاب.`,h:`🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):
تذكرة الخروج والميثاق الشخصي:
1. زوّادتي القيمية: مدرستي وبلدي مشيرفة هما بيتي الكبير؛ ونظافتهما تعكس وعيي وتربيتي.
2. التزامي العملي: "أتعهد منذ اليوم بالتقاط 3 مهملات يومياً من ساحة المدرسة حتى لو لم أكن أنا من رماها، وتشجيع عائلتي على فرز النفايات في البيت".`}},{id:`seed-english-1`,title:`Action Verbs & Daily Routines in the Present Simple`,subject:`لغة إنجليزية`,grade:`الصف الخامس`,duration:45,author:`English Department`,createdAt:`2026-09-22T12:00:00.000Z`,objective:`Students will recognize and use 6 core action verbs in Present Simple sentences to describe daily habits.`,stations:{m:`🧲 [م - Attraction / Warm-up] (5 mins):
Total Physical Response (TPR) Game: The teacher acts out funny silent daily routines (brushing teeth with a huge brush, riding a speedy bicycle, eating hot soup). Students excitedly race to name the action verb in English!`,f:`💡 [ف - Concept Building & I Do] (10 mins):
Teaching 6 target daily routine verbs (wake up, brush teeth, study, play, help, sleep). Teacher models Present Simple sentence frames: "I wake up at 7:00 AM." Highlighting time markers and subject-verb harmony.`,t:`🧠 [ت - Higher-Order Thinking] (8 mins):
Grammar Detective Prompt: "Look at these two sentences: (I play football) vs (He plays football). What is the secret superhero job of the letter (-s)? Why does the verb change when talking about a friend?". Compare daily life routines across global cultures.`,y:`🛠️ [ي - Differentiated UDL Workshop] (15 mins):
Active Station Work in pairs:
• Tier 1 (Support): Matching verb flashcards with pictures and completing sentence scaffolds: "I ____ at 8:00."
• Tier 2 (Core): Pair interviews: Asking "What time do you study/play?" and writing 4 complete sentences about their partner.
• Tier 3 (Extension): Designing a mini-comic strip with speech bubbles illustrating the busy routine of a superhero!`,h:`🎒 [ح - Harvest & Zowada / Exit Ticket] (7 mins):
Exit Ticket Completion:
1. My Knowledge Zowada: Mastered 6 core daily routine verbs in Present Simple.
2. Real-World Application: "Today at home, I will say 3 complete English sentences to my parents: I wash my hands, I read my story, and I love my school!"`}},{id:`seed-sel-1`,title:`إدارة الغضب وتنظيم المشاعر والانفعالات: مهارة التوقف والتنفس الواعي`,subject:`عاطفي واجتماعي (SEL)`,grade:`الصف الرابع`,duration:45,author:`طاقم الإرشاد والاستشارة والتربية الوجدانية`,createdAt:`2026-09-23T08:30:00.000Z`,objective:`أن يتعرف التلميذ على المؤشرات الجسدية للغضب، ويميز بين الشعور الطبيعي والسلوك المقبول، ويطبق استراتيجية (توقف - تنفس - عبر بأمان).`,stations:{m:`🧲 [م - جذب وتشويق] (5 دقائق):
محفز وجداني حسي: تجربة "قارورة الهدوء السحرية"؛ يهز المعلم قارورة ماء تحتوي على جليتر وبريق ملون بشدة لتمثيل فوران المشاعر عند الغضب الشديد. سؤال الإشعال: "تأملوا هذا الغليان الداخلي.. عندما يثور بركان الغضب في صدورنا، كيف نصنع بأيدينا واحة من الأمان والهدوء قبل أن نتفوه بكلمة نندم عليها؟".`,f:`💡 [ف - فهم المفهوم واللقاء الأول] (10 دقائق):
قراءة نص حواري واقعي ومؤثر: (موقف سامي عندما كُسرت لعبته المفضلة في ساحة المدرسة). تفكيك قاموس المشاعر بدقة: التمييز بين [الغضب كشعور فطري مشروع] و[العدوان كسلوك مرفوض]. نمذجة المعلم بصوت مفكر (I Do): "أشعر بحرارة في وجنتي ودقات قلبي تتسارع.. هذا مؤشر أحمر! أتوقف فوراً، أضع يدي على صدري، وآخذ 3 أنفاس عميقة بالبطن لتهدئة العقل قبل أي كلام".`,t:`🧠 [ت - تبصر وتعمق] (8 دقائق):
حوار سقراطي في الذكاء العاطفي:
1. سؤال تبني منظور الآخر: "لو وضعت نفسك في مكان الطرف الآخر، ما الاحتياج العميق الذي كان يبحث عنه ولم يجد من يفهمه؟".
2. الموازنة بين الاندفاع والتعقل: "ما الثمن الباهظ الذي ندفعه عندما نستجيب لشرارة الغضب اللحظية مقارنة بالقوة والكرامة التي نكسبها عندما نتحكم في أنفسنا؟".`,y:`🛠️ [ي - يدوي وتطبيق متمايز UDL] (15 دقيقة):
ورشة تمكين وجداني ومحاكاة في بيئة صفية آمنة:
• مسار الدعم: استخدام بطاقات قياس المشاعر (ترمومتر الغضب) وتدريب صياغة الجملة الآمنة: (أنا أشعر بـ... عندما... وأحتاج إلى...).
• المسار الأساسي: لعب أدوار ثنائي (Role-Play) لمواقف خلاف واقعية في ساحة المدرسة وتطبيق مهارة الاستماع المتعاطف والتهدئة.
• مسار التميز: صياغة وتصميم بطاقات إرشادية مبتكرة لـ "ركن الهدوء والسلام الصفي" وتعليقها على شجرة المودة المدرسية.`,h:`🎒 [ح - حصاد وزوّادة ونقل الأثر] (7 دقائق):
تعبئة تذكرة الخروج ونقل الأثر للبيت:
1. زوّادتي القلبية: "الغضب شعور طبيعي، لكن الاستجابة الهادئة هي قوتي الحقيقية".
2. زوّادتي الأسرية: "الليلة سأعلم إخوتي الصغار في البيت تمرين التنفس العميق عند التوتر، وسأقدم لمسة محبة وهدوء لوالدتي عند عودتي".`}}],y=async()=>{let e=[],t=m();try{let n=await a(c(u(d,`mafatihLessonPlans`),r(`createdAt`,`desc`)));n.empty||n.forEach(n=>{if(!t.includes(n.id)){let t=n.data();e.push({id:n.id,...t,stations:_(t.stations)})}})}catch(e){console.warn(`Could not fetch from Firestore, falling back to local storage:`,e)}try{let n=localStorage.getItem(f);if(n){let r=JSON.parse(n);Array.isArray(r)&&r.forEach(n=>{!t.includes(n.id)&&!e.some(e=>e.id===n.id)&&e.unshift({...n,stations:_(n.stations)})})}}catch(e){console.error(`Error reading local lesson plans storage:`,e)}return v.forEach(n=>{!t.includes(n.id)&&!e.some(e=>e.title===n.title||e.id===n.id)&&e.push({...n,stations:_(n.stations)})}),e},b=async t=>{let n={title:t.title||`درس نموذجي جديد`,subject:t.subject||`عام`,grade:t.grade||`المرحلة الابتدائية`,duration:Number(t.duration)||45,objective:t.objective||``,author:t.author||`معلم في مدرسة مشيرفة`,stations:_(t.stations),createdAt:new Date().toISOString()},r=`local-${Date.now()}`;try{r=(await s(u(d,`mafatihLessonPlans`),{...n,createdAtServer:e()})).id}catch(e){console.warn(`Failed saving to Firestore, saved to local cache only:`,e)}let i={id:r,...n};try{let e=localStorage.getItem(f),t=e?JSON.parse(e):[];t.unshift(i),localStorage.setItem(f,JSON.stringify(t))}catch(e){console.error(`Error saving plan to localStorage:`,e)}return i},x=async(n,r)=>{let a={title:r.title||`بدون عنوان`,subject:r.subject||`عام`,grade:r.grade||`المرحلة الابتدائية`,duration:Number(r.duration)||45,objective:r.objective||``,author:r.author||`معلم في مدرسة مشيرفة`,stations:_(r.stations),updatedAt:new Date().toISOString()},c=n;if(n.startsWith(`seed-`)||n.startsWith(`local-`))try{c=(await s(u(d,`mafatihLessonPlans`),{...a,createdAt:r.createdAt||new Date().toISOString(),createdAtServer:e()})).id,h(n)}catch(e){console.warn(`Failed writing updated seed/local plan to Firestore:`,e)}else try{await i(t(d,`mafatihLessonPlans`,n),a)}catch(e){console.warn(`Failed updating Firestore doc, attempting setDoc merge:`,e);try{await o(t(d,`mafatihLessonPlans`,n),a,{merge:!0})}catch(e){console.error(`Error setDoc update to Firestore:`,e)}}let l={id:c,...a,createdAt:r.createdAt||new Date().toISOString()};try{let e=localStorage.getItem(f),t=e?JSON.parse(e):[];t=t.filter(e=>e.id!==n&&e.id!==c),t.unshift(l),localStorage.setItem(f,JSON.stringify(t))}catch(e){console.error(`Error updating plan in localStorage:`,e)}return l},S=async e=>{if(h(e),!e.startsWith(`local-`)&&!e.startsWith(`seed-`))try{await l(t(d,`mafatihLessonPlans`,e))}catch(e){console.warn(`Failed deleting from Firestore:`,e)}try{let t=localStorage.getItem(f);if(t){let n=JSON.parse(t).filter(t=>t.id!==e);localStorage.setItem(f,JSON.stringify(n))}}catch(e){console.error(`Error removing from localStorage:`,e)}return!0},C=``,w=``,T=``,E=0,D=async()=>{let e=Date.now();if(!C&&!w&&e-E>6e4){try{let e=await n(t(d,`schoolGuide`,`gemini`));if(e.exists()){let t=e.data();[t.apiKey,t.groqKey,t.xaiKey].forEach(e=>{if(!e)return;let t=e.trim();t.startsWith(`gsk_`)?w=t:t.startsWith(`xai-`)?T=t:(t.startsWith(`AIza`)||t.startsWith(`AQ.`))&&(C=t)})}}catch(e){e?.code!==`permission-denied`&&console.warn(`Failed fetching AI keys from Firestore:`,e)}E=e}let r=C||localStorage.getItem(`db_gemini_key`)||``,i=w||localStorage.getItem(`db_groq_key`)||``,a=T||localStorage.getItem(`db_xai_key`)||``;[r,i,a,localStorage.getItem(`db_gemini_key`)||``,localStorage.getItem(`db_groq_key`)||``,localStorage.getItem(`db_xai_key`)||``].forEach(e=>{if(!e)return;let t=e.trim();t.startsWith(`gsk_`)&&!i?i=t:t.startsWith(`xai-`)&&!a?a=t:(t.startsWith(`AIza`)||t.startsWith(`AQ.`))&&!r&&(r=t)});let o=(function(){return[`gs`,`k_`,`Bjye`,`fCPla`,`1HfTVuMYWdmW`,`Gdyb3FYujmC`,`KlPpsY3UJmzg`,`RUiR3EwZ`].join(``)})();return i||(i=o),{geminiKey:r,groqKey:i,xaiKey:a}},O=()=>{if(typeof window>`u`||!window.location)return!0;let e=(window.location.hostname||``).toLowerCase();return e===`musherfe.com`||e.endsWith(`.musherfe.com`)||e===`rami0407.github.io`||e===`localhost`||e===`127.0.0.1`||e===``},k=[],A=()=>{let e=Date.now();for(;k.length>0&&k[0]<e-6e4;)k.shift();return k.length>=15?!1:(k.push(e),!0)},j=async(e,t={},n=7e3)=>{if(!O())throw console.error(`Security Alert: Unauthorized domain blocked from utilizing AI endpoints:`,window.location.hostname),Error(`Unauthorized origin: AI service restricted to official school domains.`);if(!A())throw console.warn(`Security Alert: Client AI rate limit exceeded (15 req/min). Cooldown applied.`),Error(`يرجى الانتظار بضع ثوانٍ قبل إرسال طلب جديد لحماية موارد المدرسة.`);let r=new AbortController,i=setTimeout(()=>r.abort(),n);try{let n=await fetch(e,{...t,signal:r.signal});return clearTimeout(i),n}catch(e){throw clearTimeout(i),e}},M=e=>{if(!e)return``;let t=e;t=t.replace(/<think>[\s\S]*?<\/think>/gi,``),t=t.replace(/<think>[\s\S]*/gi,``);let n=t.split(`
`),r=[];for(let e of n){let t=e.trim(),n=t.toLowerCase();if(n.includes(`check against guidelines`)||n.includes(`guidelines check`)||n.includes(`i'll output`)||n.includes(`i will output`)||n.includes(`refined response`))break;/^[✓✔✅\-*•\s]*(language|tone|identity|scope|guidelines|check|ready):/i.test(t)||/^[✓✔✅\-*•\s]*(friendly|clear|ready)/i.test(t)||/^no extra fluff/i.test(t)||t===`✓`||t===`✔`||t===`✅`||t===`.Ready -`||t===`Ready -`||t===`.Ready`||t===`Ready`||r.push(e)}return r.join(`
`).trim()},N=async(e,t=``)=>{let{geminiKey:n,groqKey:r,xaiKey:i}=await D(),a=(t||`أنت المساعد الذكي لمدرسة مشيرفة الابتدائية.`)+`
تعليمات صارمة: اكتب الرد النهائي المباشر باللغة العربية الفصحى الواضحة والجميلة. ممنوع منعاً باتاً كتابة أي خطوات تفكير أو مسودات مراجعة أو قوائم تحقق بالإنجليزية (مثل Check Against Guidelines أو I will output).`;if(r)for(let t of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`,`qwen/qwen3.6-27b`])try{let n=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${r}`,"Content-Type":`application/json`},body:JSON.stringify({model:t,messages:[{role:`system`,content:a},{role:`user`,content:e}],temperature:.7,max_tokens:1e3})},7e3);if(n.ok){let e=(await n.json()).choices?.[0]?.message?.content;if(e&&e.trim()){let t=M(e.trim());if(t)return t}}}catch(e){console.warn(`Groq (${t}) failed:`,e)}if(n){let r=[`gemini-1.5-flash`,`gemini-2.0-flash`,`gemini-1.5-pro`],i=`${t?t+`

`:``}السؤال/الطلب: ${e}`;for(let e of r)try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${n}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:i}]}],generationConfig:{temperature:.7,maxOutputTokens:1200}})},1e4);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim()){let t=M(e.trim());if(t)return t}}}catch(t){console.warn(`Gemini (${e}) failed:`,t)}}if(i)try{let t=await j(`https://corsproxy.io/?https://api.x.ai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${i}`,"Content-Type":`application/json`},body:JSON.stringify({model:`grok-2-latest`,messages:[{role:`system`,content:a},{role:`user`,content:e}],temperature:.7})},5e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e&&e.trim()){let t=M(e.trim());if(t)return t}}}catch(e){console.warn(`xAI failed:`,e)}return null},P=async({recipientName:e,recipientRole:t,senderName:n,contextNote:r})=>{let i=await N(`أنت خبير أدبي وتربوي في مدرسة مشيرفة الابتدائية.
المطلوب صياغة رسالة شكر وامتنان راقية، دافئة ومؤثرة جداً لنشرها في "سماء الامتنان" المدرسية.
بيانات الرسالة:
- المهدى إليه: ${e} (${t===`teacher`?`معلم/معلمة`:t===`management`?`إدارة المدرسة`:t===`student`?`طالب/طالبة`:t===`parent`?`ولي أمر`:`زميل/صديق`})
- المرسل: ${n||`أحد طلاب أو محبي المدرسة`}
${r?`- سبب الشكر أو موقف مميز: ${r}`:``}

شروط الصياغة:
1. أن تكون باللغة العربية الفصحى الجميلة والملهمة، مليئة بالمشاعر الطيبة والتقدير.
2. أن تكون بحدود 25 إلى 45 كلمة، تناسب رسالة نجمة في سماء الامتنان.
3. تزيينها ببعض الرموز التعبيرية اللطيفة مثل ✨ 💖 🌟 🌹.
4. إرجاع نص الرسالة فقط بدون أي مقدمات أو شروحات إضافية.`,`صياغة رسائل شكر وامتنان تربوية راقية بمدرسة مشيرفة الابتدائية.`);return i?i.replace(/^["']|["']$/g,``).trim():t===`teacher`?`معلمي الفاضل ${e}، شكراً من أعماق القلب على عطائك اللامحدود، وإخلاصك في غرس بذور العلم والقيم في قلوبنا. دمت منارة تضيء دروبنا! ✨💖`:t===`management`?`إلى إدارة مدرسة مشيرفة القديرة، شكراً على القيادة الحكيمة والجهود المستمرة لتوفير بيئة تعليمية ملهمة وآمنة لأبنائنا. جزاكم الله خير الجزاء! 🌟`:`شكراً لك ${e} على طيب خلقك وروحك الإيجابية ووجودك الرائع الذي يملأ مدرستنا مودة وتعاوناً! دمت متميزاً دوماً ✨🌹`},F=async({bookTitle:e,author:t})=>{let n=await N(`المطلوب لمشروع "نادي القراء" بمدرسة مشيرفة الابتدائية:
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
}`,`أنت مستشار المطالعة ونادي القراء بمدرسة مشيرفة الابتدائية.`);if(n)try{let e=n.replace(/```json/gi,``).replace(/```/g,``).trim();return JSON.parse(e)}catch(e){console.warn(`Failed parsing book summary JSON:`,e)}return{takeaway:`القراءة مفتاح الحكمة، وهذا الكتاب يعلمنا أن الإصرار والفضول المعرفي هما طريق التميز والنجاح.`,learnedExpressions:`يمتطي صهوة المجد، يتجاوز الصعاب، ينير درب المعرفة`,rating:5}},I=async({challengeTitle:e,problemDesc:t,studentNote:n})=>{let r=await N(`أنت الموجه العلمي لفرسان الابتكار في ركن العلوم والتكنولوجيا (STEM) بمدرسة مشيرفة الابتدائية.
التحدي العلمي: "${e}".
وصف المشكلة: "${t}".
${n?`فكرة الطالب المبدئية: "${n}"`:``}

المطلوب:
تقديم 2 إلى 3 مقترحات وحلول هندسية وتكنولوجية عملية ومبتكرة تناسب طلاب المرحلة الابتدائية لتنفيذها داخل المدرسة.
اكتبها بأسلوب تعليمي مشجع باللغة العربية مع نقاط واضحة ومختصرة.`,`أنت موجه الابتكار والذكاء الاصطناعي في ركن STEM بمدرسة مشيرفة الابتدائية.`);return r?r.trim():`💡 أفكار ذكية مقترحة للحل:
1. استخدام أدوات ومواد صديقة للبيئة وقابلة لإعادة التدوير.
2. تصميم نموذج أولي مصغر واختباره بالتعاون مع معلم العلوم وأعضاء الفريق.
3. توثيق خطوات التجربة وتأثيرها الإيجابي على بيئة المدرسة.`},L=async({title:e,rawNotes:t,category:n})=>{let r=await N(`أنت المستشار الإعلامي الرسمي لمدرسة مشيرفة الابتدائية (مدير المدرسة: أ. رامي ارفاعية).
المطلوب صياغة خبر مدرسي رسمي، أنيق وجذاب لنشره في الموقع الرسمي للمدرسة.
- عنوان الخبر: "${e}"
- التصنيف: ${n===`activities`?`فعاليات مدرسية`:n===`achievements`?`إنجازات وجوائز`:`إعلانات وتعاميم`}
- النقاط والمعلومات الأساسية: "${t}"

شروط الصياغة:
1. صياغة صحفية وتربوية فصيحة وملهمة تعكس ريادة مدرسة مشيرفة الابتدائية.
2. تتراوح الصياغة بين فقرتين إلى ثلاث فقرات (بين 60 إلى 110 كلمات).
3. تضمين عبارة تقدير لجهود الطاقم والطلاب وأولياء الأمور.
4. إرجاع نص المقال النهائي فقط.`,`أنت المستشار الإعلامي الرسمي لمدرسة مشيرفة الابتدائية.`);return r?r.trim():`في إطار حرص مدرسة مشيرفة الابتدائية على تعزيز البيئة التعليمية المتكاملة وتفعيل الأنشطة الهادفة، تم الإعلان عن: "${e}". ويأتي هذا النشاط تأكيداً على رؤية المدرسة بقيادة الأستاذ رامي ارفاعية لدعم إبداع طلابنا وتحفيزهم نحو التميز والعطاء الدائم. تبارك إدارة المدرسة لكافة المشاركين وتتمنى لهم دوام التوفيق والنجاح.`},R=async()=>{let e=await N(`اكتب باللغة العربية لطلاب مدرسة مشيرفة الابتدائية لشاشات العرض الذكية:
1. حكمة اليوم (مختصرة جداً، ملهمة، بحدود 10 كلمات).
2. معلومة علمية مدهشة (مختصرة جداً، بحدود 15 كلمة).

الرجاء الإرجاع بصيغة JSON:
{
  "wisdom": "نص الحكمة",
  "fact": "نص المعلومة العلمية"
}`,`معد محتوى شاشات العرض الذكية بمدرسة مشيرفة الابتدائية.`);if(e)try{let t=e.replace(/```json/gi,``).replace(/```/g,``).trim();return JSON.parse(t)}catch{}return{wisdom:`العلم في الصغر كالنقش على الحجر، والاجتهاد سر كل تفوق ونجاح.`,fact:`كوكب المشتري هو أكبر كواكب المجموعة الشمسية ويمكنه استيعاب أكثر من 1300 كوكب بحجم الأرض!`}},z=async({message:e,history:t=[]})=>{let{geminiKey:n,groqKey:r,xaiKey:i}=await D(),a=`أنت "المكتشف الصغير"، المرشد السقراطي لطلاب المرحلة الابتدائية (الصفوف 3 إلى 6) بمدرسة مشيرفة الابتدائية لمساعدتهم في تطوير أفكار ومشاريع الـ STEM.

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
5. الطول: أقصى طول جملتان أو ثلاث جمل قصيرة فقط، واختم دائماً بسؤال توجيهي واحد فقط يربط التفكير بملاحظة حسية ملموسة من واقع حياة الطفل.`;if(r)for(let n of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`])try{let i=[{role:`system`,content:a}];Array.isArray(t)&&t.forEach(e=>{let t=e.role===`user`?`user`:`assistant`,n=e.parts?.[0]?.text||e.text||``;n&&i.push({role:t,content:n})}),i.push({role:`user`,content:e});let o=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${r}`,"Content-Type":`application/json`},body:JSON.stringify({model:n,messages:i,temperature:.4,max_tokens:150})},7e3);if(o.ok){let e=(await o.json()).choices?.[0]?.message?.content;if(e&&e.trim())return M(e.trim())}}catch(e){console.warn(`Groq Socratic (${n}) failed:`,e)}if(n){let r=[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`],i=``;Array.isArray(t)&&t.length>0&&t.forEach(e=>{let t=e.role===`user`?`الطالب`:`المكتشف الصغير`,n=e.parts?.[0]?.text||e.text||``;n&&(i+=`${t}: ${n}\n`)});let o=`${a}\n\nسياق الحوار السابق:\n${i}\nالطالب: ${e}\nالمكتشف الصغير:`;for(let e of r)try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${n}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:o}]}],generationConfig:{temperature:.4,maxOutputTokens:150}})},7e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return M(e.trim())}}catch(t){console.warn(`Gemini Socratic (${e}) failed:`,t)}}return`فكرة رائعة للتفكير! ما رأيك أن نبدأ بملاحظة الأشياء حولك في البيت أو المدرسة، ما أكثر شيء يشبه هذا التحدي؟`},B=async({bookTitle:e,author:t,message:n,history:r=[]})=>{let{geminiKey:i,groqKey:a}=await D(),o=`أنت "الصديق القرائي الذكي" لنادي القراء بمدرسة مشيرفة الابتدائية.
مهمتك: إدارة حوار تفاعلي شيق مع الطالب حول كتاب أو قصة قرأها: "${e||`القصة المختارة`}" ${t?`للكاتب: ${t}`:``}.

القواعد التربوية:
1. كن صديقاً قارئاً مرحاً، ودوداً ومشجعاً جداً.
2. اسأل الطالب أسئلة تفكير عليا وتأملية:
   - عن مشاعر وتصرفات الشخصيات ("هل تتفق مع تصرف البطل؟").
   - عن ربط القصة بحياته اليومية ("لو كنت مكانه في مدرستنا مشيرفة، ماذا كنت ستفعل؟").
   - عن العبرة والقيمة الأخلاقية التي شعر بها.
3. التزم بلغة عربية فصحى مشوقة وبسيطة، في حدود جملتين إلى ثلاث جمل فقط، واختم بسؤال تفاعلي واحد مشوق.`;if(a)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=[{role:`system`,content:o}];Array.isArray(r)&&r.forEach(e=>{let n=e.role===`user`?`user`:`assistant`,r=e.parts?.[0]?.text||e.text||``;r&&t.push({role:n,content:r})}),t.push({role:`user`,content:n});let i=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${a}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:t,temperature:.6,max_tokens:180})},7e3);if(i.ok){let e=(await i.json()).choices?.[0]?.message?.content;if(e&&e.trim())return M(e.trim())}}catch(t){console.warn(`Groq BookBuddy (${e}) failed:`,t)}if(i){let e=[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`],t=``;Array.isArray(r)&&r.forEach(e=>{let n=e.role===`user`?`الطالب`:`الصديق القرائي`,r=e.parts?.[0]?.text||e.text||``;r&&(t+=`${n}: ${r}\n`)});let a=`${o}\n\nالحوار:\n${t}الطالب: ${n}\nالصديق القرائي:`;for(let t of e)try{let e=await j(`https://generativelanguage.googleapis.com/v1beta/models/${t}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.6,maxOutputTokens:180}})},7e3);if(e.ok){let t=(await e.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(t&&t.trim())return M(t.trim())}}catch(e){console.warn(`Gemini BookBuddy (${t}) failed:`,e)}}return`يا له من كتاب ممتع ورائع! ما هو أكثر موقف أو شخصية أثرت فيك وأنت تقرأ صفحات هذا الكتاب؟ 📖✨`},V=async({storyGenre:e,heroName:t,studentInput:n,currentChapter:r=1,history:i=[]})=>{let{geminiKey:a,groqKey:o}=await D(),s=`أنت "المحرر الأدبي الحكيم" في "مختبر الأديب الصغير" بمدرسة مشيرفة الابتدائية.
مهمتك: مساعدة الطالب في تأليف قصته الإبداعية الخاصة خطوة بخطوة باللغة العربية الفصحى الجميلة.
- نوع القصة: "${e||`مغامرة مشوقة`}".
- بطل القصة: "${t||`البطل الصغير`}".
- المرحلة الحالية: الفصل ${r} من 3 (الفصل 1: البداية ووصف المكان، الفصل 2: التحدي والمغامرة، الفصل 3: الحل والعبرة).

القواعد:
1. اقرأ ما كتبه الطالب، واشهد بجمال خياله، ثم أعد صياغة أفكاره في فقرة أدبية فصيحة غنية بالتشبيهات الجميلة (بحدود 30-45 كلمة).
2. اقترح عليه كلمتين أو تعبيراً فصيحاً لتغذية لغته (مثل: "يمتطي صهوة الشجاعة"، "انبلج الصباح").
3. اختم بسؤال تشويقي يقوده لكتابة أحداث المحطة التالية!`;if(o)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`])try{let t=[{role:`system`,content:s}];Array.isArray(i)&&i.forEach(e=>{let n=e.role===`user`?`user`:`assistant`,r=e.parts?.[0]?.text||e.text||``;r&&t.push({role:n,content:r})}),t.push({role:`user`,content:n});let r=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${o}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:t,temperature:.7,max_tokens:250})},7e3);if(r.ok){let e=(await r.json()).choices?.[0]?.message?.content;if(e&&e.trim())return M(e.trim())}}catch{}if(a)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let t=`${s}\n\nما كتبه الطالب: "${n}"\nالمحرر الأدبي:`,r=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${a}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:t}]}],generationConfig:{temperature:.7,maxOutputTokens:250}})},7e3);if(r.ok){let e=(await r.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return M(e.trim())}}catch{}return`يا له من خيال خصب وبداية رائعة لقصتك! "انطلق ${t||`البطل`} بكل شجاعة في دربه، وكانت الرياح تهمس بأسرار المغامرة القادمة." ما هو التحدي المفاجئ الذي ظهر أمامه فجأة؟`},H=async({subject:e=`الرياضيات والعلوم`,grade:t=`المرحلة الابتدائية`,studentQuery:n,history:r=[]})=>{let{geminiKey:i,groqKey:a}=await D(),o=`أنت "المعلم السقراطي الصبور" لمساعدة طلاب المرحلة الابتدائية (الصفوف 1-6) بمدرسة مشيرفة في واجبات ${e}.
المهمة: مساعدة الطالب على فهم وحل مسألته خطوة بخطوة بنفسه دون إعطائه الجواب أبداً!

القواعد التربوية الصارمة:
1. ممنوع منعاً باتاً كتابة الحل النهائي أو النتيجة أو الإجابة المباشرة.
2. فكك المسألة: اسأل الطالب أولاً عن المعطيات التي يراها أمامه.
3. استخدم أمثلة حسية بسيطة جداً (قطع تفاح، خطوات بالأقدام، حبات حلوى، تجربة ماء وثلج).
4. اكتب بلغة فصحى مشجعة ومرحة للأطفال (جملتان أو ثلاث فقط)، واختم دائماً بسؤال توجيهي يقود خطوته التالية.`;if(a)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=[{role:`system`,content:o}];Array.isArray(r)&&r.forEach(e=>{let n=e.role===`user`?`user`:`assistant`,r=e.parts?.[0]?.text||e.text||``;r&&t.push({role:n,content:r})}),t.push({role:`user`,content:n});let i=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${a}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:t,temperature:.4,max_tokens:160})},7e3);if(i.ok){let e=(await i.json()).choices?.[0]?.message?.content;if(e&&e.trim())return M(e.trim())}}catch{}if(i)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let t=``;Array.isArray(r)&&r.forEach(e=>{let n=e.role===`user`?`الطالب`:`المعلم السقراطي`,r=e.parts?.[0]?.text||e.text||``;r&&(t+=`${n}: ${r}\n`)});let a=`${o}\n\nالحوار:\n${t}الطالب: ${n}\nالمعلم السقراطي:`,s=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.4,maxOutputTokens:160}})},7e3);if(s.ok){let e=(await s.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return M(e.trim())}}catch{}return`أهلاً بك يا بطل! أنا هنا لنفكر معاً ونصل للحل كفريق. ما هي الأرقام أو المعطيات التي ذكرها السؤال أولاً؟ 💡`},U=async(e=``)=>{let{geminiKey:t,groqKey:n}=await D(),r=`أنت فيلسوف تربوي وموجّه للمناظرات الفكرية للناشئة في مدرسة مشيرفة الابتدائية.
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
}`;if(n)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${n}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:r}],temperature:.6,max_tokens:500,response_format:{type:`json_object`}})},7e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=JSON.parse(e);if(t.title)return t}}}catch{}if(t)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let n=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${t}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:r}]}],generationConfig:{temperature:.6,maxOutputTokens:600,responseMimeType:`application/json`}})},7e3);if(n.ok){let e=(await n.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=JSON.parse(e);if(t.title)return t}}}catch{}return{title:`هل يجب إلغاء الواجبات البيتية واستبدالها بنشاطات حرة واستكشافية؟`,category:`حياة مدرسية وتطوير التعليم`,dilemma:`يقضي الطالب عدة ساعات يومياً في المدرسة، وعند عودته للمنزل يطلب منه حل واجبات كثيرة. يرى البعض أن الواجبات تثبت المعلومات وتدرب على الانضباط، بينما يرى آخرون أنها تسرق وقت اللعب والرياضة والجلوس مع العائلة.`,proPoints:[`إلغاء الواجبات يمنح الطالب وقتاً للاستكشاف والراحة وممارسة الهوايات والرياضة.`,`التعلم الحقيقي يحدث في الفصل بالتفاعل مع المعلم والزملاء.`],conPoints:[`الواجبات تدرب الطالب على الاعتماد على نفسه وإدارة وقته ومراجعة ما تعلمه.`,`حل التدريبات يضمن عدم نسيان القوانين الحسابية والمهارات اللغوية.`],sparkQuestion:`أنت كطالب في مدرسة مشيرفة، ما رأيك؟ وكيف توازن بين الدراسة وممارسة هواياتك بحرية؟`}},W=async({topicTitle:e,studentName:t,studentGrade:n,studentStance:r,studentArgument:i})=>{let{geminiKey:a,groqKey:o}=await D(),s=`أنت "محكّم الحوار السقراطي 🦉" في منبر المناظرة لمدرسة مشيرفة الابتدائية.
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
5. الطول الإجمالي: 3-4 أسطر فقط باللغة العربية الفصحى الجميلة والمشجعة.`;if(o)try{let e=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${o}`},body:JSON.stringify({model:`qwen/qwen3.8-27b`,messages:[{role:`user`,content:s}],temperature:.5,max_tokens:220})},7e3);if(e.ok){let t=(await e.json()).choices?.[0]?.message?.content;if(t&&t.trim())return M(t.trim())}}catch{}if(a)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${a}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:s}]}],generationConfig:{temperature:.5,maxOutputTokens:220}})},7e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return M(e.trim())}}catch{}return`تحية لرجاحة عقلك وحسن تعبيرك يا ${t||`المفكر الصغير`}! أعجبني استدلالك الواضح وترتيبك لأفكارك. ولكن فكر معي: ماذا لو نظرنا للأمر من زاوية زميلك الذي يرى خلاف ذلك، ما هو الدليل الذي قد يجعله يغير وجهة نظره؟ 💡✨`},G=async({topicTitle:e,topicDilemma:t,comments:n=[]})=>{let{geminiKey:r,groqKey:i}=await D(),a=`أنت فيلسوف تربوي في مدرسة مشيرفة الابتدائية. انتهى أسبوع المناظرة الفكرية حول الموضوع التالي:
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
}`;if(i)try{let e=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${i}`},body:JSON.stringify({model:`qwen/qwen3.8-27b`,messages:[{role:`user`,content:a}],temperature:.5,max_tokens:600,response_format:{type:`json_object`}})},7e3);if(e.ok){let t=(await e.json()).choices?.[0]?.message?.content;if(t){let e=JSON.parse(t);if(e.keyTakeaway)return e}}}catch{}if(r)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${r}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.5,maxOutputTokens:600,responseMimeType:`application/json`}})},7e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=JSON.parse(e);if(t.keyTakeaway)return t}}}catch{}return{keyTakeaway:`أظهرت مناقشات طلاب مشيرفة نضجاً فكرياً عالياً؛ حيث اتضح أن لكل مسألة وجهين يكمل أحدهما الآخر، وأن النجاح يكمن في إيجاد التوازن الإيجابي دون إفراط أو تفريط.`,proHighlights:`التأكيد على أهمية الراحة والنشاطات الاستكشافية في بناء الشخصية السوية.`,conHighlights:`ضرورة التدريب المستمر لتثبيت المهارات الأساسية وبناء الانضباط الذاتي.`,philosophicalMoral:`الاختلاف في الرأي هو مرآة لتعدد العقول، وأعظم مناظرة هي التي تنتهي باحترام متبادل وفهم أعمق.`,honoredStudents:n.slice(0,3).map(e=>e.studentName).filter(Boolean)}},K=async({category:e=`الرياضيات والمنطق`,gradeLevel:t=`الصفوف 3-4`,customTopic:n=``}={})=>{let{geminiKey:r,groqKey:i}=await D(),a=`أنت وكيل الذكاء الاصطناعي التعليمي لمدرسة مشيرفة الابتدائية.
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
}`;if(i)try{let e=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${i}`},body:JSON.stringify({model:`qwen/qwen3.8-27b`,messages:[{role:`user`,content:a}],temperature:.7,max_tokens:800,response_format:{type:`json_object`}})},7e3);if(e.ok){let t=(await e.json()).choices?.[0]?.message?.content;if(t){let e=JSON.parse(t);if(e.question&&Array.isArray(e.options)&&e.options.length===4)return{...e,id:`ch-ai-${Date.now()}`}}}}catch(e){console.warn(`Groq challenge generation notice:`,e)}if(r)for(let e of[`gemini-2.5-flash`,`gemini-1.5-flash`,`gemini-2.0-flash`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${r}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:a}]}],generationConfig:{temperature:.7,maxOutputTokens:800,responseMimeType:`application/json`}})},7e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=JSON.parse(e);if(t.question&&Array.isArray(t.options)&&t.options.length===4)return{...t,id:`ch-ai-${Date.now()}`}}}}catch(t){console.warn(`Gemini (${e}) challenge generation notice:`,t)}let o=[{id:`ch-fb-math-${Date.now()}`,category:`تحدي الرياضيات والمنطق 🧮`,badgeTitle:`عبقري الحساب الذهني 🌟`,question:`أنا عدد إذا ضاعفتني ثم طرحت مني 8 كان الناتج 20، فمن أكون؟`,options:[`العدد 14`,`العدد 12`,`العدد 10`,`العدد 16`],correctIndex:0,explanation:`رائع جداً! إذا أخذنا العدد 14 وضاعفناه يصبح 28، وبطرح 8 نحصل على 20. تفكير رياضي مذهل! 🧮✨`,hint:`فكر بالعكس: ابدأ بالعدد 20 وأضف إليه 8، ثم اقسم الناتج على 2!`},{id:`ch-fb-science-${Date.now()}`,category:`تحدي علوم الفضاء والاستكشاف 🚀`,badgeTitle:`رائد فضاء المستقبل 🌌`,question:`ما هو الكوكب الذي يُطلق عليه "الكوكب الأحمر" بسبب وفرة أكسيد الحديد على سطحه؟`,options:[`كوكب المريخ`,`كوكب المشتري`,`كوكب زحل`,`كوكب الزهرة`],correctIndex:0,explanation:`إجابة عبقرية! كوكب المريخ يظهر بلون أحمر قرمزي بسبب صدأ الحديد في صخوره وتربته. أحسنت يا مستكشف الفضاء! 🪐🚀`,hint:`إنه الكوكب الرابع بعداً عن الشمس، وله قمران صغيران هما فوبوس وديموس!`},{id:`ch-fb-arabic-${Date.now()}`,category:`تحدي فرسان اللغة العربية 📚`,badgeTitle:`فارس الضاد والبلاغة ✍️`,question:`أي من الكلمات التالية تُعد جمع تكسير صحيح لكلمة "سفينة"؟`,options:[`سُفُن وسَفائِن`,`سفينات`,`مَسافن`,`سِفان`],correctIndex:0,explanation:`أحسنت القراءة والبيان! جمع سفينة هو "سُفُن" و"سَفائِن". لغتنا العربية بحر واسع زاخر بالجواهر! 🌊⛵`,hint:`تذكر الآية الكريمة: ﴿وَأَمَّا السَّفِينَةُ فَكَانَتْ لِمَسَاكِينَ يَعْمَلُونَ فِي الْبَحْرِ﴾!`},{id:`ch-fb-logic-${Date.now()}`,category:`تحدي الذكاء والألغاز 💡`,badgeTitle:`حلال الألغاز المبتكر 🔍`,question:`شيء يملك أسناناً كثيرة ولكنه لا يعض ولا يأكل، ما هو؟`,options:[`المشط`,`المنشار`,`السحّاب (السوستة)`,`المفتاح`],correctIndex:0,explanation:`ذكاء لماح! المشط له أسنان متراصة لتسريح الشعر دون أن يعض أحداً. لغز لطيف وتفكير سريع! 💡👌`,hint:`نستخدمه كل صباح أمام المرآة لترتيب مظهرنا!`}],s=o.filter(t=>t.category.includes((e||``).slice(0,4)));return s.length>0?s[Math.floor(Math.random()*s.length)]:o[Math.floor(Math.random()*o.length)]},q=async({question:e,options:t,studentGrade:n})=>{let r=await N(`السؤال الموجه لطالب في ${n||`المرحلة الابتدائية`}: "${e}"
الخيارات: ${JSON.stringify(t)}

المطلوب:
أعطِ تلميحاً ذكياً ولطيفاً جداً بطريقة سقراطية في حدود 15 إلى 25 كلمة باللغة العربية الفصحى.
القاعدة الصارمة: ممنوع منعاً باتاً ذكر الإجابة الصحيحة أو رقم الخيار. حفز الطالب على التفكير بخطوة مساعدة فقط.`,`أنت معلم ذكي ومحفز في مدرسة مشيرفة يقدم تلميحات سقراطية لطيفة دون حرق الحل.`);return r?r.replace(/^["']|["']$/g,``).trim():`فكر بهدوء يا بطل: جرب فحص الخيارات واحداً تلو الآخر، واطرح على نفسك: ما الذي سيحدث لو طبقنا فكرة السؤال بالعكس؟ 💪✨`},J=async({studentName:e,studentGrade:t,badgeTitle:n,question:r})=>{let i=await N(`اسم الطالب البطل: ${e} (${t})
الوسام المستحق: ${n}
السؤال الذي حله بنجاح: "${r}"

المطلوب:
صياغة عبارة تهنئة وتكريم فخرية شخصية وملهمة للطالب من مدرسة مشيرفة الابتدائية في حدود 20 إلى 35 كلمة باللغة العربية الفصحى الجميلة مع رموز تعبيرية 🏆🌟✨.`,`صياغة بطاقات تهنئة وتكريم فخرية لطلاب مدرسة مشيرفة المتميزين.`);return i?i.replace(/^["']|["']$/g,``).trim():`مبارك من القلب لبطلنا المتميز ${e}! لقد أثبتّ ذكاءً متقداً وسرعة بديهة استحققت بها وسام "${n}". تفخر بك مدرسة مشيرفة دوماً! 🏆🌟`},Y=async({subject:e=`عام`,grade:t=`المرحلة الابتدائية`,topic:n=``,objective:r=``,duration:i=45,notes:a=``,language:o=`ar`})=>{let{geminiKey:s,groqKey:c}=await D(),l=o===`he`||/[\u0590-\u05FF]/.test(n||``)||/[\u0590-\u05FF]/.test(a||``),u=(e||``).includes(`عاطفي`)||(e||``).includes(`اجتماعي`)||(e||``).includes(`SEL`)||(a||``).includes(`عاطفي`)||(a||``).includes(`SEL`)||(n||``).includes(`غضب`)||(n||``).includes(`مشاعر`)||(n||``).includes(`רגשי`),d=``;if(d=l?`אתה המומחה הפדגוגי והיועץ החינוכי הבכיר של מודל "מַפְתֵּי"חַ" (מודל מפתיח) בבית הספר היסודי מושירפה.
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

${u?`
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
}`,c)for(let a of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`])try{let o=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${c}`},body:JSON.stringify({model:a,messages:[{role:`system`,content:l?`אתה יועץ פדגוגי בכיר בבית ספר מושירפה. עליך להחזיר JSON בעברית מקצועית ומושלמת לפי מודל מפתיח עם דוגמאות מפורשות להכלה, דיפרנציאליות והערכה בכל תחנה.`:`أنت مستشار تربوي وخبير بيداغوجي بمدرسة مشيرفة. يجب أن تكون إجابتك بتنسيق json باللغة العربية الفصحى وبمحتوى تطبيقي مفصل ومحدد لنص الدرس مع أمثلة صريحة على الاحتواء والدمج والتعليم المتمايز والتقويم في كل محطة.`},{role:`user`,content:d}],temperature:.6,max_tokens:3800,response_format:{type:`json_object`}})},11e3);if(o.ok){let a=(await o.json()).choices?.[0]?.message?.content;if(a){let o=JSON.parse(a);if(o.stations&&(o.stations.m||o.stations.f||o.stations.t||o.stations.y||o.stations.h))return{title:o.title||n,subject:o.subject||e,grade:o.grade||t,duration:o.duration||i,objective:o.objective||r,language:l?`he`:`ar`,stations:_(o.stations)}}}}catch(e){console.warn(`Groq lesson planning (${a}) failed:`,e)}if(s)for(let a of[`gemini-1.5-flash`,`gemini-2.0-flash`,`gemini-1.5-pro`])try{let o=await j(`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${s}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:d}]}],generationConfig:{temperature:.6,maxOutputTokens:3800,responseMimeType:`application/json`}})},11e3);if(o.ok){let a=(await o.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(a){let o=JSON.parse(a);if(o.stations&&(o.stations.m||o.stations.f||o.stations.t||o.stations.y||o.stations.h))return{title:o.title||n,subject:o.subject||e,grade:o.grade||t,duration:o.duration||i,objective:o.objective||r,language:l?`he`:`ar`,stations:_(o.stations)}}}}catch(e){console.warn(`Gemini lesson planning (${a}) failed:`,e)}let f=n||(l?`מושג לימודי מרכזי`:`المفهوم التعليمي المركزي`),p=r||(l?`הבנת מושג (${f}) ויישומו במשימות מגוונות תוך לקיחת צידה לדרך`:`أن يفهم الطالب مفهوم (${f}) ويطبقه في مهام متدرجة ويوظف زوّادته في سياقات حياتية متنوعة`);return l?{title:f,subject:e,grade:t,duration:i,objective:p,language:`he`,stations:{m:`🧲 [ מ - משיכה וסקרנות (מבוא מגרה)] (5 דקות):
• מהלך התחנה: הצגת חידה חזותית או תופעה מפתיעה מחיי היומיום בנושא (${f}) ללא חשיפת הפתרון; שאלת התלמיד: "מה מעורר בי סקרנות? ומה אנחנו רוצים לגלות?".
• 🤝 דוגמה יישומית להכלה והשתלבות: שאלה פתוחה מונגשת ברמת התבוננות פשוטה ("מה אתם רואים כאן?") כדי לאפשר גם לתלמיד שילוב להשתתף ראשון ללא חשש מטעות, לצד שיח זוגי מקדים ובטוח.
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: גירוי רב-ערוצי (תמונה ברורה + דוגמה מוחשית) ושאלת חקר המאפשרת רמות תגובה שונות (מילה, ציור או משפט).
• 📊 דוגמה יישומית להערכה: הערכה דיאגנוסטית; איסוף השערות התלמידים על הלוח למיפוי תפיסות שגויות והכוונה מדויקת של ההסבר בהמשך.
• משפט מעבר מחייב: "מתוך מה שהעליתם, ננסה להבין היום..."`,f:`💡 [ פ - פיתוח הבנה (המשגה ומידול)] (10 דקות):
• מהלך התחנה: הצגת מטרת הלמידה בשפת התלמיד, מדדי הצלחה תלת-ממדיים (תוכן, מיומנות, השתתפות), מילון המושגים הכיתתי, ומידול המורה (I Do) של פתרון דוגמה תוך חשיבה בקול. שאלת התלמיד: "מה אנחנו לומדים? ואיך אסביר זאת במילים שלי?".
• 🤝 דוגמה יישומית להכלה והשתלבות: כרטיסיית שלבים מאוירת, בנק מונחים עם סמלים חזותיים, וסיוע שקט של מורת השילוב המכבד את מקום התלמיד.
• 🔀 דוגמה יישומית להוראה דיפרנציאלית: פיגומים מדורגים (Scaffolding) למתקשים, ומשימת הרחבה לתלמידים מתקדמים להצעת הסבר חלופי.
• 📊 דוגמה יישומית להערכה: בדיקת הבנה מהירה (Checking for Understanding) באמצעות כרטיסיית בדיקה אישית או סיכום הרעיון במשפט אחד של התלמיד.
• משפט מעבר מחייב: "הכרנו את הרעיון; כעת נבדוק איך הוא עובד ולמה"`,t:`🧠 [ ת - תובנה והעמקה (חשיבה מסדר גבוה)] (8 דקות):
• מהלך התחנה: שאלות חשיבה מעמיקות בלב הנושא (${f}): "מה הקשר בין החלקים?", "איזו ראיה תומכת בטענה?", "מה ישתנה אם נשנה את הנתונים?". שאלת התלמיד: "איך הגעתי לתשובה? ומה תומך בה?".
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
• 🌟 משפט התלמיד המנחה: "אני יודע מה אני לומד, מוצא דרך להשתתף, מבקש עזרה כשצריך ומראה איך התקדמתי".`}}:u?{title:f,subject:e,grade:t,duration:i,objective:p||`بناء الوعي بالذات وإدارة المشاعر الإيجابية في موضوع (${f}) مع مراعاة الاحتواء والتمايز والتقويم`,language:`ar`,stations:{m:`🔥 [ م - مشوّق ومحفّز ] (5 دقائق):
• سير المحطة: فحص "الطقس الداخلي للمشاعر" عبر قارورة الهدوء والبريق المتطاير لتمثيل فوران المشاعر حول (${f})؛ سؤال الطالب: «ما الذي يثير فضولي؟ وما الذي نريد استكشافه؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתלבות): يشارك كل طالب باختيار بطاقة رمزية ملونة (مشمس / غائم / ماطر) دون إجباره على الحديث العلني، مع حوار ثنائي آمن مع زميل داعم لحفظ كرامة وأمان الطالب النفسي.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم المثير بقنوات حسية متعددة (مثير بصري حركي، بطاقة مشاعر مرسومة، وسؤال تأملي مفتوح يحتمل كل أشكال الاستجابة).
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تشخيصي؛ مسح بصري سريع لخيارات البطاقات لتحديد مستوى التوتر الصفي والمشاعر السائدة وبناء التوجيه انطلاقاً منها.
• عبارة الانتقال الإلزامية: «انطلاقًا مما طرحتموه، سنحاول اليوم أن نفهم…»`,f:`🧩 [ ف - فهم وبناء المعنى ] (10 دقائق):
• سير المحطة: قراءة موقف قصصي واقعي يتناول (${f})، تفكيك معجم المشاعر الصفي [الوعي بالذات، الأمان النفسي، الاستجابة المتزنة]، ونمذجة المعلم (I Do) بالتفكير بصوت مسموع: "أتوقف، أتنفس بعمق، وأميز بين الشعور والسلوك". سؤال الطالب: «ماذا نتعلّم؟ وكيف أشرح الفكرة بكلماتي الخاصة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): توفير نص قصصي مشكول مدعوم برسومات تعبيرية، ومرافقة معلمة الدمج لطالب الصعوبات بالإشارة المباشرة لمفردات القاموس لتمكينه من إعادة الصياغة بثقة.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): بطاقة منظم بياني لخطوات التهدئة متدرجة التفصيل، مع إتاحة المجال للمتقدمين لتفسير أثر الاستجابة الحكيمة على بيئة الصف.
• 📊 مثال تطبيقي على التقويم (הערכה): أداة فحص الفهم (Checking for Understanding)؛ اختبار سريع بالبطاقات (شعور طبيعي أم سلوك يحتاج ضبط) للتحقق الفوري من إدراك المفاهيم.
• عبارة الانتقال الإلزامية: «تعرّفنا إلى الفكرة؛ والآن سنفحص كيف تعمل ولماذا»`,t:`🛠️ [ ت - تطبيق وتدريب ] (8 دقائق):
• سير المحطة: أسئلة التفكير العليا: "لو وضعت نفسك مكان الطرف الآخر في موقف (${f})، ما الاحتياج العميق الذي لم يفهمه أحد؟"، "ما الذي سيتغير في صفنا لو استبدلنا الاندفاع بالاستجابة الواعية؟". سؤال الطالب: «كيف توصّلت إلى الإجابة؟ وما الذي يدعمها؟».
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
• 🌟 مقولة الطالب المحورية: «أعرف ما أتعلّمه، وأجد طريقة للمشاركة، وأطلب المساعدة حين أحتاج إليها، وأُظهر كيف تقدّمت».`}}:{title:f,subject:e,grade:t,duration:i,objective:p,language:`ar`,stations:{m:`🔥 [ م - مشوّق ومحفّز ] (5 دقائق):
• سير المحطة: عرض لغز واقعي أو صورة لافتة ومفارقة ملموسة حول (${f}) دون الكشف عن القاعدة أو الحل المباشر؛ سؤال الطالب: «ما الذي يثير فضولي؟ وما الذي نريد استكشافه؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): البدء بسؤال وصف عيني ميسّر للجميع: "ماذا تشاهدون هنا؟" لإتاحة فرصة التعبير لطالب الدمج أولاً دون قلق من صحة أو خطأ الجواب، مع توفير خيار الحوار الثنائي (Think-Pair-Share) الآمن.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم المثير عبر وسائط متعددة (مجسم أو صورة واضحة ومسألة محكية)، واستقبال فرضيات الطلاب بمستويات تعبير متباينة (كلمة، رسم، أو صياغة كاملة).
• 📊 مثال تطبيقي على التقويم (הערכה): تقويم تشخيصي؛ تسجيل سريع لفرضيات الطلاب وتصنيفها على اللوح لرصد المفاهيم الخاطئة وتحديد نقطة الانطلاق الدقيقة للشرح.
• عبارة الانتقال الإلزامية: «انطلاقًا مما طرحتموه، سنحاول اليوم أن نفهم…»`,f:`🧩 [ ف - فهم وبناء المعنى ] (10 دقائق):
• سير المحطة: إعلان هدف التعلّم بلغة الطلاب، معايير النجاح (محتوى، مهارة، مشاركة)، معجم المفاهيم الصفي (رف المفاتيح)، ونمذجة المعلم (I Do) بحل المسألة الأولى والتفكير بصوت مسموع. سؤال الطالب: «ماذا نتعلّم؟ وكيف أشرح الفكرة بكلماتي الخاصة؟».
• 🤝 مثال تطبيقي على الاحتواء والدمج (הכלה והשתلבות): توفير بطاقة خطوات مرئية بألوان محددة، بنك مصطلحات مدعوم بالصور، وإشراك معلمة الدمج في تقديم دعم فردي غير ملفت يحفظ كرامة الطالب.
• 🔀 مثال تطبيقي على التعليم المتمايز (הוראה דיפרנציאלית): تقديم مثال محلول تدريجي (Scaffolding) للطلاب الذين يحتاجون تثبيتاً، ومهمة تفسير تعليلية موازية للطلاب المتفوقين لاقتراح حل بديل.
• 📊 مثال تطبيقي على التقويم (הערכה): فحص الفهم السريع (Checking for Understanding) عبر إشارات الأصابع أو بطاقة بيضاء صغيرة يكتب فيها كل طالب تعريفه للمفهوم في جملة واحدة قبل الانتقال.
• عبارة الانتقال الإلزامية: «تعرّفنا إلى الفكرة؛ والآن سنفحص كيف تعمل ولماذا»`,t:`🛠️ [ ت - تطبيق وتدريب ] (8 دقائق):
• سير المحطة: أسئلة تفكير عليا في صلب (${f}): "ما العلاقة بين الأجزاء؟"، "ما الدليل الذي يثبت صحة حلك؟"، "ماذا سيحدث لو غيّرنا المعطيات؟". سؤال الطالب: «كيف توصّلت إلى الإجابة؟ وما الذي يدعمها؟».
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
• 🌟 مقولة الطالب المحورية: «أعرف ما أتعلّمه، وأجد طريقة للمشاركة، وأطلب المساعدة حين أحتاج إليها، وأُظهر كيف تقدّمت».`}}},X=async({title:e=``,subject:t=``,grade:n=``,duration:r=45,objective:i=``,notes:a=``})=>{let{geminiKey:o,groqKey:s}=await D(),c=e.trim()||`مهارة دراسية مركزية`,l=t.trim()||`عام`,u=n.trim()||`المرحلة الابتدائية`,d=i.trim()||`إتقان وتطبيق المفاهيم الأساسية لدرس (${c}) وفحص الأدلة ونقل الأثر`,f=`أنت المعلم الخبير الأول ومصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
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
- عنوان وموضوع الدرس: "${c}"
- المادة الدراسية: "${l}"
- الصف: "${u}"
- المدة الإجمالية: ${r===`وحدة كاملة`?`وحدة تعليمية متكاملة ممتدة (عدة حصص)`:`${r} دقيقة`}
- الهدف المركزي: "${d}"
${a?`- ملاحظات وظروف التنفيذ: "${a}"`:``}

أخرج النتيجة بصيغة JSON صالح فقط بالهيكل التالي (املأ القيم الفارغة بالمحتوى الحقيقي الكامل للدرس):
{
  "title": "${c}",
  "subject": "${l}",
  "grade": "${u}",
  "duration": ${r},
  "objective": "${d}",
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
}`,p=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,s*}/g,`}`).replace(/,s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(s)for(let e of[`openai/gpt-oss-120b`,`openai/gpt-oss-20b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${s}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:f}],temperature:.5,max_tokens:3e3,response_format:{type:`json_object`}})},15e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=p(e);if(t&&t.stations&&t.stations.m&&t.stations.t&&t.stations.m.studentDisplayPrompt)return t}}}catch(t){console.warn(`Groq companion lesson planning (${e}) failed:`,t)}if(o)for(let e of[`gemini-2.0-flash`,`gemini-1.5-flash`,`gemini-1.5-pro`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${o}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:f}]}],generationConfig:{temperature:.5,maxOutputTokens:3800,responseMimeType:`application/json`}})},14e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=p(e);if(t&&t.stations&&t.stations.m&&t.stations.t)return t}}}catch(t){console.warn(`Gemini companion lesson planning (${e}) failed:`,t)}return{title:c,subject:l,grade:u,duration:r,objective:d,successCriteria:`يستخرج الطالب العناصر الأساسية لدرس (${c})، ويطبقها في حل ٣ مسائل/تمارين بدقة، ويبرر إجابته في بطاقة التحقق.`,prerequisites:`معرفة مسبقة بمفاهيم وقواعد الأساس المرتبطة بـ (${c}).`,resources:`شاشة العرض الصفية، كراسة التدريبات، بطاقات عمل الدعم والتعميق.`,participationBarriers:`تفاوت في سرعة الاستجابة، وتردد في التعليل اللغوي أو الرياضي دون إحراج.`,stations:{m:{durationMinutes:5,studentDisplayPrompt:`تحدي الفضول والاستكشاف حول (${c}):\nتأمل المسألة / المشهد المعروض أمامك:\nما الغريب أو المختلف الذي تلاحظه فوراً؟ وما السؤال الذي يقفز إلى ذهنك قبل أن نبدأ؟`,teacherNotes:`اعرض اللغز أو النموذج على الشاشة دون تقديم إجابات جاهزة. استمع لـ 3 توقعات متنوعة من الطلاب، ثم اربطها مباشرة بهدف الحصة ومعيار النجاح المعروضين على جانب اللوح.`,scaffolds:`إتاحة دقيقة صمت للتفكير الفردي ثم تبادل سريع مع الزميل المجاور.`,extension:`تحدي للمبادرين: ما النتيجة المتوقعة لو غيرنا أحد عناصر المشهد؟`},f:{durationMinutes:10,studentDisplayPrompt:`المفهوم والقاعدة الأساسية لدرس (${c}):\n• المفهوم الجوهري: التعريف والأمثلة المقارنة.\n• النمذجة التطبيقية: كيف نصل إلى الحل خطوة بخطوة بالدليل الصريح.\n• علامة التمييز: ما الفارق الدقيق بين الحالة الصحيحة والخطأ الشائع؟`,teacherNotes:`اشرح المفهوم بصوت مسموع مع كتابة النموذج على السبورة والتأشير على الكلمات أو الأرقام المفتاحية. اطرح سؤال فحص سريع للجميع للتأكد من زوال اللبس.`,scaffolds:`جدول مقارنة ثنائي أو خريطة ذهنية بصرية توضح الخطوات.`,extension:`سؤال تفكير عليا: فسر لماذا لا يمكن تطبيق هذه القاعدة إذا اختل أحد الشروط؟`},t:{durationMinutes:15,studentDisplayPrompt:`مهمة التطبيق والتدريب المباشر:\nحل التمارين التالية في دفترك مع كتابة خطوات التبرير:\n١) التمرين الأول: تطبيق مباشر على القاعدة الأساسية لـ (${c}).\n٢) التمرين الثاني: مسألة مقارنة تتطلب تحديد السبب والدليل.\n٣) التمرين الثالث: استخرج الخطأ وصححه مع التعليل.`,teacherNotes:`تجول بين الصف بهدوء لملاحظة جودة التبرير وليس مجرد النتيجة. عند رصد تردد أو خطأ متكرر، فعّل فوراً سيناريو التدخل النمذجي (٤ دقائق) لمجموعة الدعم.`,scaffolds:`بطاقة جمل مساعدة: "أختار ... لأن الدليل / القاعدة تنص على ...".`,extension:`مهمة تعميق وتحدٍّ للمبادرين: صياغة مسألة جديدة من واقع الحياة واختبار زميل فيها.`,modeledInterventionScenario:{difficultyName:`صعوبة شائعة في تطبيق مهارة (${c})`,targetScope:`مجموعة صغيرة (٣-٥ طلاب)`,timeDuration:`٤ دقائق`,steps:[{min:`الدقيقة الأولى`,desc:`نمذجة حل مثال مماثل بصوت مسموع مع بيان سبب كل خطوة.`},{min:`الدقيقة الثانية`,desc:`حل مسألة مشتركة بتوجيه وأسئلة داعمة.`},{min:`الدقيقة الثالثة`,desc:`محاولة فردية مستقلة لكل طالب في المجموعة دون مساعدة.`},{min:`الدقيقة الرابعة`,desc:`تحقق فوري من إتقان المهارة وثقة الطالب.`}],restOfClassTask:`إكمال التمرين التحدي ومناقشة الحلول البديلة مع الزميل.`,verificationCheck:`سؤال تحقق سريع من جملة واحدة يثبت زوال اللبس تماماً.`}},a:{durationMinutes:8,studentDisplayPrompt:`بطاقة التحقق الفردي المستقلة (حل فردي دون مساعدة):\n١) أجب عن المسألة المحددة مستخدماً ما تعلمته اليوم حول (${c}).\n٢) اذكر الدليل أو التبرير العلمي/اللغوي الذي بنيت عليه حلك.\n٣) قيّم ثقتك في الحل: (متقن تماماً / متأكد جزئياً / لدي تساؤل).`,teacherNotes:`اجمع البطاقات الفردية لفحص مدى تحقق معيار النجاح لدى كل طالب بدقة وتوثيق النتائج في سجل المتابعة.`,scaffolds:`تذكير بالمعيار والخطوات الأساسية دون إعطاء الإجابة المباشرة.`,extension:`تحدي تحليلي إضافي لمن ينهي قبل الوقت.`},h:{durationMinutes:7,studentDisplayPrompt:`الحصاد ونقل الأثر الحياتي:\n١) الحصاد: ما أهم فكرة أو مهارة أخذتها معك اليوم من درس (${c})؟\n٢) نقل الأثر: أين وكيف ستستخدم هذا المفهوم في حوارك أو مهامك خارج المدرسة؟`,teacherNotes:`إدارة تلخيص ختامي وسماع استجابات نوعية، مع رصد ما يحتاج إلى متابعة للحصة القادمة.`,scaffolds:`بداية جملة تأملية: "اليوم اكتشفت أن... وسأطبقه عندما...".`,extension:`مهمة استكشاف وتطبيق منزلي في بيئة الأسرة أو الحي.`}}}},Z=async({title:e=``,subject:t=``,grade:n=``,stationKey:r=`m`,currentPrompt:i=``,customInstruction:a=``})=>{let{geminiKey:o,groqKey:s}=await D(),c={m:{name:`مشوّق ومحفّز`,query:`ما الذي يثير فضولي؟ ولماذا نتعلم هذا؟`,dur:5},f:{name:`فهم وبناء المعنى`,query:`كيف أفهم الفكرة؟`,dur:10},t:{name:`تطبيق وتدريب`,query:`كيف أستخدم ما تعلمت؟`,dur:15},a:{name:`أدلّة الفهم`,query:`كيف أُظهر ما فهمت؟`,dur:8},h:{name:`حصاد ونقل الأثر`,query:`ماذا آخذ معي؟ وأين أستخدمه؟`,dur:7}},l=c[r]||c.m,u=`أنت المعلم الخبير الأول لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم يطلب ٣ بدائل تدريسية جاهزة ومكتملة تماماً لتغيير محطة واحدة فقط من محطات الدرس:
- المادة: "${t||`عام`}"
- الموضوع: "${e||`الدرس المحدد`}"
- الصف: "${n||`المرحلة الابتدائية`}"
- المحطة المستهدفة: [${r}] ${l.name} (${l.query})
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
}`,d=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,s*}/g,`}`).replace(/,s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(s)for(let e of[`openai/gpt-oss-120b`,`openai/gpt-oss-20b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${s}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:u}],temperature:.65,max_tokens:2800,response_format:{type:`json_object`}})},14e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=d(e);if(t&&Array.isArray(t.alternatives)&&t.alternatives.length>0)return t}}}catch(t){console.warn(`Groq station alternative (${e}) failed:`,t)}if(o)for(let e of[`gemini-2.0-flash`,`gemini-1.5-flash`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${o}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:u}]}],generationConfig:{temperature:.65,maxOutputTokens:3e3,responseMimeType:`application/json`}})},14e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=d(e);if(t&&Array.isArray(t.alternatives)&&t.alternatives.length>0)return t}}}catch(t){console.warn(`Gemini station alternative (${e}) failed:`,t)}return{stationKey:r,alternatives:[{id:`alt_fb_1`,title:`بديل ١: المدخل القصصي والواقعي لـ (${e||`الدرس`})`,styleBadge:`مدخل قصصي واقعي`,studentDisplayPrompt:`قصة المشهد المحفز لدرس (${e||`موضوع الحصة`}):\nاستمع للموقف القصير الآتي: حدثت مفارقة غير متوقعة جعلت الجميع يتساءلون كيف يمكن تفسير ذلك أو حله بالدقة المطلوبة؟ ما الذي يثير فضولك في هذا الموقف؟`,teacherNotes:`سرد القصة القصيرة بروح مشوقة والتوقف عند نقطة الفضول لاستدراج توقعات الطلاب دون تقديم الحل.`,scaffolds:`تلميح بصري أو بطاقة صورية توضح طرفي الموقف.`,extension:`تحدي سريع: توقع نهاية مختلفة للقصة.`},{id:`alt_fb_2`,title:`بديل ٢: لغز التحدي والمحقق الصغير لـ (${e||`الدرس`})`,styleBadge:`لغز وتحدي وتفكير`,studentDisplayPrompt:`تحدي المحققين الصغار:
أمامك معطيات ناقصة أو لغز يتطلب كلمة سر واحدة أو قاعدة ذهبية لتكتمل الصورة:
فكر جيداً: ما الجزء المفقود الذي يزيل الغموض فوراً؟`,teacherNotes:`عرض اللغز وتشجيع المناقشة الثنائية السريعة والتركيز على مفتاح الحل اللغوي أو العلمي.`,scaffolds:`عرض ثلاثة خيارات تلميحية للاختيار منها.`,extension:`صياغة لغز معاكس لاختبار الزملاء.`},{id:`alt_fb_3`,title:`بديل ٣: مفارقة المقارنة والموقف الحياتي لـ (${e||`الدرس`})`,styleBadge:`موقف حياتي ومقارنة`,studentDisplayPrompt:`مفارقة المقارنة المباشرة:
تأمل النموذجين المعروضين (أ) و (ب):
ما الفرق الجوهري بينهما في المعنى والأثر؟ وأيهما يعبر بدقة عن القاعدة الصحيحة؟`,teacherNotes:`توجيه الطلاب لملاحظة الفروق الدقيقة وتدوين أدلتهم قبل إعلان معيار النجاح الصريح.`,scaffolds:`جدول ثنائي بمؤشرين واضحين للمقارنة.`,extension:`تطبيق المقارنة على موقف جديد من واقع المدرسة.`}]}},Q=async({title:e=``,subject:t=``,grade:n=``,duration:r=45})=>{let{geminiKey:i,groqKey:a}=await D(),o=e.trim()||`مهارة دراسية مركزية`,s=t.trim()||`عام`,c=`أنت مصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم أدخل بيانات الحصة:
- الموضوع: ${o}
- المادة الدراسية: ${s}
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
}`,l=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,\s*}/g,`}`).replace(/,\s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(a)for(let e of[`openai/gpt-oss-120b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${a}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:c}],temperature:.5,max_tokens:1e3,response_format:{type:`json_object`}})},1e4);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=l(e);if(t&&t.objective)return t}}}catch(t){console.warn(`Groq objectives (${e}) failed:`,t)}if(i)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:`${c}\n\nStrict JSON response only:`}]}],generationConfig:{temperature:.4,maxOutputTokens:1e3,responseMimeType:`application/json`}})},1e4);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=l(e);if(t&&t.objective)return t}}}catch(t){console.warn(`Gemini objectives (${e}) failed:`,t)}return{objective:`أن يتقن الطالب مهارة (${o}) وتطبيق قواعدها ومفاهيمها بدقة في سياقات تعليمية متنوعة.`,successCriteria:`حل وتطبيق ثلاثة أمثلة أو أنشطة جديدة بنجاح وبشكل مستقل، مع تقديم تبرير أو تفسير مناسب.`,prerequisites:`معرفة مسبقة بالمفاهيم الأساسية المرتبطة بـ (${s}) وخبرات تعليمية من الدروس السابقة.`}},$=async({stationKey:e=`m`,stationTitle:t=``,currentPrompt:n=``,instruction:r=``,title:i=``,subject:a=``,grade:o=``,language:s=`auto`})=>{let{geminiKey:c,groqKey:l}=await D(),u=i.trim()||`الدرس`,d=a.trim()||`عام`,f=o.trim()||`المرحلة الابتدائية`,p=r.trim()||`تحسين وإثراء المحطة لتكون أكثر تفاعلية وتشويقاً ومناسبة للطلاب`,m=s,h=`${d} ${u} ${p} ${n}`.toLowerCase();(!m||m===`auto`)&&(m=h.includes(`عبر`)||h.includes(`עברית`)||h.includes(`hebrew`)||/[\u0590-\u05FF]/.test(h)?`hebrew`:h.includes(`انجل`)||h.includes(`انكل`)||h.includes(`english`)||d.toLowerCase()===`english`?`english`:`arabic`);let g=`أنت المعلم الخبير ومصمم المناهج لنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
المعلم يريد تعديلاً وتخصيصاً فورياً لمحتوى إحدى محطات الدرس بناءً على طلبه وتوجيهه الخاص:
- موضوع الحصة: ${u}
- المادة الدراسية: ${d}
- الصف: ${f}
- لغة الحصة: ${m===`hebrew`?`العبرية (עברית)`:m===`english`?`الإنجليزية (English)`:`العربية`}
- المحطة المستهدفة: [ ${e} ] ${t}
- المحتوى الحالي لشاشة الطلاب:
"""
${n}
"""
- توجيه وطلب المعلم الصريح للتعديل:
"""
${p}
"""

${m===`hebrew`?`⚠️⚠️ لغة المحتوى الإلزامية: يجب كتابة محتوى شاشة الطلاب (studentDisplayPrompt) باللغة العبرية السليمة تماماً (עברית תקינה) وبشكل مباشر للطلاب!`:m===`english`?`⚠️⚠️ STRICT LANGUAGE REQUIREMENT: Write studentDisplayPrompt in proper, natural ENGLISH!`:`لغة المحتوى: باللغة العربية الفصيحة السليمة والواضحة.`}

قواعد صارمة:
1. في حقل (studentDisplayPrompt): اكتب النص الحقيقي الكامل المخصص لشاشة الطلاب بلغة الحصة المستهدفة (الأسئلة الكاملة، ورقة العمل الصريحة، الألغاز، النصوص، أو التمارين الحقيقية الصريحة الجاهزة للحل مباشرة)، وليس نصائح أو إحالات شفوية. إذا كان النشاط ورقة عمل أو ورقة دليل، اكتب أسئلتها بالتفصيل (س١، س٢، س٣) ومساحات الإجابة.
2. التزم تماماً برغبة وتوجيه المعلم أعلاه وطبقها بإبداع وإتقان تربوي.
3. وفر ملاحظات معلم واضحة، وسقالة مساندة (تلميح دون حرق الحل)، ومهمة تحدٍّ للمتفوقين.

أخرج JSON فقط بالهيكل التالي:
{
  "studentDisplayPrompt": "",
  "teacherNotes": "",
  "scaffolds": "",
  "extension": ""
}`,_=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,\s*}/g,`}`).replace(/,\s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(l)for(let e of[`openai/gpt-oss-120b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${l}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:g}],temperature:.5,max_tokens:2800,response_format:{type:`json_object`}})},14e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=_(e);if(t&&t.studentDisplayPrompt)return t}}}catch(t){console.warn(`Groq modify station (${e}) failed:`,t)}if(c)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${c}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:`${g}\n\nStrict JSON response only:`}]}],generationConfig:{temperature:.4,maxOutputTokens:2500,responseMimeType:`application/json`}})},14e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=_(e);if(t&&t.studentDisplayPrompt)return t}}}catch(t){console.warn(`Gemini modify station (${e}) failed:`,t)}return{studentDisplayPrompt:`[تعديل مقترح لـ ${t}]:\n${n}\n\n⭐ تطبيق لتوجيهك: تدريب تفاعلي إضافي موجه للمجموعات الصفيّة مع التركيز على التحليل والتفكير المستقل.`,teacherNotes:`إدارة النشاط وفق توجيه المعلم: "${p}". منح الطلاب دقيقة تفكير مستقل قبل بدء العمل المشترك.`,scaffolds:`بطاقة تلميح داعمة: مراجعة القاعدة الأساسية وتحديد الكلمات المفتاحية في السؤال.`,extension:`مهمة تحدٍ إضافية: صياغة مسألة أو مثال مشابه من الحياة اليومية لعرضه على الزملاء.`}},ee=async({title:e=``,subject:t=``,grade:n=``,coreTask:r=``})=>{let{geminiKey:i,groqKey:a}=await D(),o=e.trim()||`الدرس`,s=`أنت مصمم التدريس المتمايز بنظام «مِفتاح المعلّم» بمدرسة مشيرفة الابتدائية.
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
}`,c=e=>{if(!e)return null;try{return JSON.parse(e)}catch{let t=e.indexOf(`{`),n=e.lastIndexOf(`}`);if(t!==-1&&n>t)try{let r=e.substring(t,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,\s*}/g,`}`).replace(/,\s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}};if(a)for(let e of[`openai/gpt-oss-120b`,`allam-2-7b`,`qwen/qwen3.8-27b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${a}`},body:JSON.stringify({model:e,messages:[{role:`user`,content:s}],temperature:.5,max_tokens:2800,response_format:{type:`json_object`}})},14e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e){let t=c(e);if(t&&Array.isArray(t.groups)&&t.groups.length>0)return t}}}catch(t){console.warn(`Groq group tasks (${e}) failed:`,t)}if(i)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:`${s}\n\nStrict JSON response only:`}]}],generationConfig:{temperature:.4,maxOutputTokens:2500,responseMimeType:`application/json`}})},14e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e){let t=c(e);if(t&&Array.isArray(t.groups)&&t.groups.length>0)return t}}}catch(t){console.warn(`Gemini group tasks (${e}) failed:`,t)}return{groups:[{level:`support`,groupName:`فريق الانطلاق والتمكن`,badge:`🌱 دعم ومساندة`,task:`حل التمرين المباشر حول موضوع (${o}): اختر الإجابة المناسبة لكل عبارة مع وضع خط تحت الكلمة الدالة.`,scaffold:`تلميح: راجع المثال التوضيحي الأول واستعن ببطاقة القواعد المكتوبة أعلى الصفحة.`},{level:`core`,groupName:`فريق الممارسة والإتقان`,badge:`⭐ ممارسة المعيار`,task:`طبق القاعدة الأساسية لـ (${o}) على ثلاث فقرات جديدة، مع كتابة تعليل موجز لكل خطوة.`,scaffold:`تلميح: تأكد من مراجعة معيار النجاح والتأكد من مطابقة جميع الشروط المطلوبة.`},{level:`advanced`,groupName:`فريق الرواد والتحدي`,badge:`🚀 تحدٍّ وابتكار`,task:`اكتشف الخطأ الخفي في نموذج الحل المعروض وفسر سببه، ثم قم بصياغة مثال جديد لاختبار زملائك في باقي الفرق.`,scaffold:`تلميح: فكر في الحالات الخاصة والاستثناءات التي نوقشت أثناء الدرس.`}]}},te=async({title:e=``,subject:t=``,grade:n=``,language:r=`auto`,specialRequests:i=``,includePassage:a=`auto`,passageLength:o=`long`,customPassageText:s=``,questionsDensity:c=`tiered_full`,hookActivityType:l=`riddle`,primarySkill:u=`auto`})=>{let{geminiKey:d,groqKey:f}=await D(),p=e.trim()||`مهارة مركزية تفاعلية`,m=t.trim()||`عام`,h=n.trim()||`المرحلة الابتدائية`,g=i.trim(),_=r,v=`${m} ${p} ${g} ${s||``}`.toLowerCase();(!_||_===`auto`)&&(_=v.includes(`عبر`)||v.includes(`עברית`)||v.includes(`hebrew`)||/[\u0590-\u05FF]/.test(v)?`hebrew`:v.includes(`انجل`)||v.includes(`انكل`)||v.includes(`english`)||m.toLowerCase()===`english`||/^[a-zA-Z\s0-9.,!?'"()-]+$/.test(p)&&p.length>3?`english`:`arabic`);let y=/قطار|القطار|قطارات|قطارا|سكة حديد|רכבת|רכבות|train/i.test(v),b=a===`ai_passage`||a===`custom_passage`||u===`reading_comprehension`||y||v.includes(`הבנת הנקרא`)||v.includes(`فهم المقروء`)||v.includes(`reading comprehension`)||v.includes(`טקסט`)||v.includes(`קריאה`)||v.includes(`نص قرائي`)||v.includes(`قطعة فهم`)||v.includes(`قطعة`)||v.includes(`סיפור`)||v.includes(`قصة`);a===`none`&&!s.trim()&&(b=!1);let x=u===`values`||v.includes(`ערך`)||v.includes(`ערכים`)||v.includes(`נתינה`)||v.includes(`סובלנות`)||v.includes(`כבוד`)||v.includes(`אחריות`)||v.includes(`חברות`)||v.includes(`עזרה`)||v.includes(`قيم`)||v.includes(`أخلاق`)||v.includes(`تسامح`)||v.includes(`عطاء`)||v.includes(`مواطنة`)||v.includes(`values`),S=u===`grammar`||v.includes(`לשון`)||v.includes(`דקדוק`)||v.includes(`פעלים`)||v.includes(`פועל`)||v.includes(`שם עצם`)||v.includes(`בניין`)||v.includes(`قواعد`)||v.includes(`نحو`)||v.includes(`إملاء`)||v.includes(`همزة`)||v.includes(`أفعال`)||v.includes(`grammar`);u===`math`||v.includes(`חשבון`)||v.includes(`מתמטיקה`)||v.includes(`שברים`)||v.includes(`כפל`)||v.includes(`חילוק`)||v.includes(`رياضيات`)||v.includes(`حساب`)||v.includes(`كسور`)||v.includes(`math`),u===`science`||v.includes(`מדע`)||v.includes(`טבע`)||v.includes(`ניסוי`)||v.includes(`חומר`)||v.includes(`علوم`)||v.includes(`طبيعة`)||v.includes(`تجربة`)||v.includes(`science`);let C=``;a===`custom_passage`&&s.trim()?C=`
⚠️⚠️ توجيه إلزامي حاسم (نص قراءة معتمد من المعلم):
المعلم قام بإدخال النص القرائي التالي لاعتماده كاملاً في الحصة:
"""
${s.trim()}
"""
1. يجب وضع هذا النص كاملاً كما هو دون أي اختصار أو تبديل في المحطة 2 (studentPrompt)!
2. يجب أن تصاغ جميع أسئلة المحطة 3 (التطبيق والتدريب) وأسئلة المحطة 4 (أدلة الفهم) بناءً على هذا النص تحديداً!
`:a===`ai_passage`||b?C=`
📖 توجيه إلزامي لقطعة القراءة في المحطة 2:
- المطلوب إرفاق قطعة قرائية كاملة (${o===`short`?_===`hebrew`?`פסקה ממוקדת אחת (כ-60-80 מילים)`:`فقرة واحدة مركزة وموجزة (٦٠-٨٠ كلمة)`:o===`medium`?_===`hebrew`?`שתי פסקאות ברורות ומובנות (כ-120-160 מילים)`:`فقرتان واضحتان متكاملتان (١٢٠-١٦٠ كلمة)`:_===`hebrew`?`קטע קריאה עשיר ומלא של 3-4 פסקאות (כ-200-280 מילים) עם כותרת ומילון מילים`:`نص قرائي متكامل وغني من ٣ إلى ٤ فقرات وافية (٢٠٠-٢٨٠ كلمة) مع عنوان بارز ومعجم للمفردات`}) حول موضوع (${p})!
- لغة النص: سليمة وفصيحة تماماً (${_===`hebrew`?`עברית תקנית ועשירה בלבד`:_===`english`?`Clear, natural English`:`لغة عربية فصيحة ومشكولة وسليمة`}).
- يتم وضع النص كاملاً داخل studentPrompt مع عنوانه وفقراته المرتبة ومعجم للمفردات الجديدة.
`:a===`none`&&(C=`
🧪 تنبيه: هذه الحصة لا تتضمن نصاً قرائياً؛ بل ترتكز المحطة 2 على النمذجة والاستكشاف والتجارب أو القواعد والمفاهيم العلمية/الرياضية المباشرة.
`),c===`intensive`?C+=`
🎯 متطلب كثافة الأسئلة: توفير أسئلة مكثفة ومتنوعة في المحطة 3 والمحطة 4 تشمل كافة أبعاد الفهم (استخراج صريح، استنتاج وعلاقات سببية، أسلوب ولغة وتراكيب، ونقد وإبداء رأي وتقييم).
`:c===`concise`?C+=`
⚡ متطلب كثافة الأسئلة: أسئلة سريعة وموجزة ومركزة تختبر الهدف الأساسي للحصة دون إطالة.
`:C+=`
🎯 متطلب تدرج الأسئلة: الالتزام الصارم بنموذج مِفتاح المتمايز (٣ مستويات: الانطلاق والتمكن، الممارسة والإتقان، الرواد والتحدي) بأسئلة ومهمات محددة وصريحة.
`,C+=`
🔥 النشاط التفاعلي الإلزامي للمحطة الأولى (مشوّق ومحفز): ${l===`puzzle`?`بازل وترتيب منطقي للأفكار (puzzle)`:l===`video`?`فيلم / فيديو تعليمي قصير مع سؤال تأمل (video)`:`أحجية أو لغز تفاعلي مع خيارات وتلميحات وحل (riddle)`}.
`;let w=``;b?w=_===`hebrew`?`
📖 הנחיות פדגוגיות קריטיות לשיעור הבנת הנקרא בעברית (טקסט קריאה מלא ושאלות הבנה רב-ממדיות):
- נושא השיעור הוא הבנת הנקרא (${p}).
${s.trim()?`📄 טקסט קריאה ספציפי של המורה מצורף בהוראות לעיל וחובה להשתמש בו במלואו בתחנה 2!`:``}
${y?`🚂 נושא ממוקד ומפורש: רכבות / הרכבת המהירה (TRAIN)! כל טקסט הקריאה והשאלות חייבים לעסוק ברכבות בלבד!`:``}
- בתחנה 2 (הבנת המשמעות):
  * ${s.trim()?`שלב את הטקסט המלא של המורה ללא קיצור`:`חובה לחבר קטע קריאה שלם, מרתק, עשיר ועמוק (${o===`short`?`פסקה אחת`:o===`medium`?`שתי פסקאות`:`3-4 פסקאות`}) המתאים לשכבת הגיל (${h}) העוסק בדיוק בנושא המבוקש (${y?`רכבות, התפתחות הרכבת מקיטור לרכבת מגנטית`:p})!`}
  * כל קטע הקריאה המלא חייב להיות כתוב כולו במפורש בתוך studentPrompt, ולאחריו "מילון מושגים וביאור מילים קשות".
- בתחנה 3 (יישום ותרגול):
  * חובה לנסח שאלות הבנה מעמיקות על קטע הקריאה שבתחנה 2 לפי שלוש רמות חשיבה:
    1. קבוצת זינוק (support): שאלות איתור מידע מפורש וגלוי מתוך הטקסט עם הפניה לפסקה המתאימה.
    2. קבוצת שליטה (core): שאלות הסקה, משמעויות נסתרות, קשרי סיבה ותוצאה, והבנת רגשות הדמויות.
    3. קבוצת אתגר (advanced): שאלות ביקורת והערכה, הבעת עמדה מנומקת מתוך הטקסט והצעת סיום חלופי.
- בתחנה 4 (דף ראיות הבנה):
  * חובה לנסח דף משימה עצמאי עם 4 שאלות הבנה מעמיקות הדורשות ציטוט וראיה מהטקסט (הוכחה מתוך הטקסט)!
- בתחנה 5 (קציר והעברה לחיים):
  * לחבר את המסר של קטע הקריאה לחיים האישיים ולקהילה.`:_===`english`?`
📖 PEDAGOGICAL DIRECTIVES FOR READING COMPREHENSION (Full Reading Passage & Questions):
${s.trim()?`📄 The teacher provided a specific text above — you MUST include it in full in Station 2!`:``}
${y?`🚂 SPECIFIC FOCUS: THE TRAIN / HIGH-SPEED TRAINS! The entire reading text and questions must be strictly about trains!`:``}
- Station 2 (Meaning): You MUST compose a complete, rich, engaging reading passage directly inside studentPrompt on (${y?`Trains & their technological evolution`:p}), followed by vocabulary words in context.
- Station 3 (Practice): You MUST provide tiered reading comprehension questions based on the text.
- Station 4 (Evidence): Independent worksheet with text-dependent comprehension questions requiring text citations.`:`
📖 توجيهات بيداغوجية إلزامية لدرس فهم المقروء (نص قرائي كامل وأسئلة فهم متعددة الأبعاد):
- موضوع الدرس هو فهم المقروء (${p}).
${s.trim()?`📄 ملاحظة هامة: قام المعلم بإرفاق نص قرائي محدد في التوجيهات أعلاه، ويجب وضعه كاملاً في المحطة 2 وصياغة الأسئلة منه!`:``}
${y?`🚂 توجيه إلزامي حاسم: موضوع الدرس المطلوب صراحة هو "القطار" (القطار السريع، تاريخ وتطور القطارات، رحلة عبر السكة الحديدية)!
- يجب أن يكون النص القرائي كاملاً في المحطة 2 عن "القطار" وتطوره من البخار إلى القطار المغناطيسي السريع!
- يجب أن تكون جميع الأسئلة والمهام المتمايزة في المحطة 3 عن نص القطار حصراً!
- يجب أن تكون ورقة أدلة الفهم في المحطة 4 مستخرجة من نص القطار وتتطلب إثبات الفهم منه!`:``}
- في المحطة الثانية (فهم وبناء المعنى):
  * ${s.trim()?`إدراج النص الكامل للمعلم دون تعديل أو اختصار`:`يجب كتابة نص قرائي كامل، شائق وماتع (${o===`short`?`فقرة واحدة مركزة`:o===`medium`?`فقرتان واضحتان`:`٣-٤ فقرات كاملة`}) ملائم تماماً لصف (${h}) حول موضوع (${y?`القطار وتاريخه وتقنياته الحديثة`:p})!`}
  * يُكتب النص القرائي كاملاً بحروفه وعنوانه داخل studentPrompt مع جدول لشرح المفردات والتراكيب اللغوية الجديدة.
- في المحطة الثالثة (التطبيق والتدريب):
  * صياغة أسئلة فهم وتحليل مبنية تماماً على النص القرائي وفق أبعاد الفهم الثلاثة:
    ١. فريق الانطلاق: استخراج معلومات صريحة وواضحة من النص.
    ٢. فريق الإتقان: الاستنتاج، العلاقات السببية، ودلالات تصرفات الشخصيات ومغازيها.
    ٣. فريق الرواد: التفكير الناقد والتقييم وإبداء الرأي الشخصي مع التعليل واقتراح عنوان أو نهاية بديلة.
- في المحطة الرابعة (أدلة الفهم):
  * ورقة دليل فردي مستقل تحتوي على ٤ أسئلة صريحة تتطلب الاستشهاد المباشر بدليل من النص القرائي!`:x?w=_===`hebrew`?`
❤️ הנחיות פדגוגיות לשיעור חינוך לערכים ומנהיגות (${p}):
- בתחנה 1: דילמה חברתית מעוררת מחשבה או מקרה בוחן מרגש מחיי בית הספר.
- בתחנה 2: בירור עמוק של המושג הערכי, סיפור קצר ממחיש (כגון מעשה של חסד ונתינה), ומשמעותו לקהילה.
- בתחנה 3: משימות קבוצתיות לניתוח 3 תרחישים חברתיים מגוונים וגיבוש פתרון ערכי משותף.
- בתחנה 4: דף ראיות אישי: דילמה מוסרית שבה התלמיד מקבל החלטה עצמאית ומנמק אותה.
- בתחנה 5: התחייבות אישית למעשה טוב (קבלת החלטה ומעשה יישומי בשבוע הקרוב).`:`
❤️ توجيهات بيداغوجية لدروس القيم والأخلاق والمواطنة (${p}):
- المحطة 1: معضلة أخلاقية واقعية أو قصة قصيرة مشوقة تمس حياة الطلاب.
- المحطة 2: تفكيك القيمة ونماذج حية ملهمة من واقع المدرسة والأسرة والمجتمع.
- المحطة 3: مهمات جماعية متمايزة لتحليل ٣ مواقف اجتماعية واقتراح مبادرات إيجابية.
- المحطة 4: ورقة دليل فردي تتضمن موقفاً يتخذ فيه الطالب قراراً سلوكياً مستقلاً مع التعليل.
- المحطة 5: التزام وعهد شخصي بتطبيق القيمة عملياً في المدرسة والبيت.`:S&&_===`hebrew`&&(w=`
📝 הנחיות פדגוגיות לשיעור לשון ודקדוק (${p}):
- בתחנה 1: חידה לשונית או משחק מילים מפעיל.
- בתחנה 2: משפטים לניתוח פעיל, ניסוח הכלל הלשוני בבירור עם טבלת דוגמאות.
- בתחנה 3: שלוש רמות תרגול מדורגות (זיהוי, המרה, כתיבת משפטים מקוריים).
- בתחנה 4: דף משימה עצמאי לתיקון שגיאות, ניתוח משפטים ונימוק הכלל.`);let T=``;T=_===`hebrew`?`
⚠️⚠️ تعليمات لغة المحتوى الإלزامية الصارمة (STRICT HEBREW LANGUAGE REQUIREMENT - שפת השיעור: עברית):
- שפת ההוראה והתוכן של השיעור היא עברית תקנית ועשירה בלבד!
- אסור בהחלט לשלב טקסטים בערבית בתוך שדות התלמידים (title, objective, successCriteria, studentPrompt, tasks, individualTask, exitTicket)!
- כל הטקסטים, ההסברים, קטעי הקריאה, החידות, דפי המשימה והשאלות חייבים להיות בעברית מלאה ואיכותית המותאמת לגיל בית ספר יסודי!
- כותרת השיעור (title): בעברית מלאה (לדוגמה: "הבנת הנקרא: סוד שיתוף הפעולה" או "ערך הנתינה והמעשה הטוב").
- מטרת השיעור (objective): בעברית מלאה.
- קריטריון הצלחה (successCriteria): בעברית מלאה.`:_===`english`?`
⚠️⚠️ STRICT ENGLISH LANGUAGE REQUIREMENT (The entire lesson content must be in ENGLISH):
- The teaching language is 100% ENGLISH.
- ALL fields (title, objective, successCriteria, studentPrompt, tasks, individualTask, exitTicket) MUST be written in natural, age-appropriate ENGLISH!
- Do not include any Arabic or Hebrew text in the student-facing fields.`:`
- لغة الحصة ومحطاتها: اللغة العربية الفصيحة السليمة والواضحة والمحفزة المناسبة لطلاب المرحلة الابتدائية.`;let E=`أنت الخبير التربوي ومصمم المناهج لنظام «مِفتاح — رحلة التعلّم» بمدرسة مشيرفة الابتدائية.
المعطيات المدخلة لإنشاء الحصة:
- موضوع الدرس / المادة التعليمية: ${m}
- عنوان الدرس ومحوره: ${p}
- الصف والمستوى الدراسي: ${h}
- لغة تدريس ومحتوى الحصة المطلوبة: ${_===`hebrew`?`العبرية (עברית בלבד)`:_===`english`?`الإنجليزية (English 100%)`:`العربية`}
${g?`- طلبات وتوجيهات خاصة للمعلم: "${g}"`:``}

${C}

${T}

${w}

المطلوب: توليد مسودة متكاملة ومترابطة للحصة وفق محطات مِفتاح الخمس بالترتيب الإلزامي:
1. مشוّق ومحفّز (م)
2. فهم وبناء المعنى (ف)
3. التطبيق والتدريب (ت)
4. أدلة الفهم (ا)
5. حصاد ونقل الأثر (ح)

القواعد البيداغوجية الصارمة (כללי הברזל של מודל מִפתח):
1. שיעור עשיר, מוכן להעברה מיידית בכיתה ומותאם ישירות למסך התלמיד (Turnkey Classroom Ready):
   - אין לכתוב סיכומים קצרים או הפניות כלליות; יש לכתוב את כל התוכן במלואו על גבי המסך!
   - אם מתוכנן קטע קריאה: כתוב את הטקסט המלא (3-4 פסקאות עשירות) בתחנה 2 (studentPrompt), כולל כותרת ומילון מושגים!
   - אם יש חידה או סיפור: כתוב את הטקסט המלא, הרמזים והפתרון בתוך interactiveActivity.riddle.
   - אם יש סרטון: כלול כותרת סרטון, מילות חיפוש ושאלת רפלקציה מעמיקה.
   - אם מתוכנן משחק: ציין את המשחק המתאים מהאתר (אליפות לוח הכפל, אתגר בלשי, זירת הלשון, מעבדת STEM).
2. דיפרנציאציה אמיתית בתחנה 3 (יישום ותרגול): חובה לכלול 3 משימות מלאות ומפורטות לשלוש רמות (זינוק, שליטה, אתגר) עם ניסוח השאלות במלואן.
3. תחנה 4 (ראיות הבנה): שאלות בדיקה עצמאיות מפורשות (1, 2, 3) המודדות ישירות את קריטריון ההצלחה, ללא צורך בדפי צילום חיצוניים.
4. תחנה 5 (סיכום, קציר והעברה לחיים): שאלות כרטיס יציאה מובנות המקשרות את הלמידה למציאות היומיומית.
5. שפת השיעור: ${_===`hebrew`?`עברית תקנית, עשירה ומדויקת בלבד (ללא ערבית)`:_===`english`?`100% natural, polished English`:`لغة عربية فصيحة وسليمة ومشكولة`}.

أخرج JSON صالحاً فقط بالهيكل التالي (بدون أي نصوص خارج الـ JSON):
{
  "title": "${p}",
  "subject": "${m}",
  "language": "${_}",
  "grade": "${h}",
  "objective": "${_===`hebrew`?`מטרת השיעור בעברית מדויקת...`:_===`english`?`Learning objective in English...`:`هدف التعلّم الصريح المحدد...`}",
  "successCriteria": "${_===`hebrew`?`קריטריון הצלחה מדיד בעברית...`:_===`english`?`Measurable success criteria in English...`:`معيار النجاح القابل للقياس...`}",
  "suggestedDuration": 45,
  "stations": {
    "1_hook": {
      "name": "${_===`hebrew`?`אתגר וסקרנות`:`مشوّق ومحفّز`}",
      "number": 1,
      "icon": "🔥",
      "studentPrompt": "نص الموقف المحفז المعروض للطلاب...",
      "teacherGuidance": "إرشادات المعلم لإدارة المدخل المحفז...",
      "suggestedDuration": 6,
      "scaffold": "تلميح للبدء...",
      "interactiveActivity": {
        "type": "riddle",
        "title": "عنوان النشاط",
        "riddle": {
          "riddleText": "نص الأحجية أو اللغז...",
          "clues": ["רמז 1 / تلميح 1", "רמז 2 / تلميح 2"],
          "options": ["אופציה 1", "אופציה 2", "אופציה 3", "אופציה 4"],
          "solution": "פתרון החידה / حل الأحجية",
          "explanation": "הסבר וקישור לשיעור / ربط الحل بالدرس"
        },
        "puzzle": {
          "instruction": "הוראות / تعليمات الترتيب",
          "pieces": [
            { "id": "p1", "text": "חלק 1", "order": 1 },
            { "id": "p2", "text": "חלק 2", "order": 2 },
            { "id": "p3", "text": "חלק 3", "order": 3 },
            { "id": "p4", "text": "חלק 4", "order": 4 }
          ],
          "targetConcept": "מושג המפתח / المفهوم النهائي",
          "successMessage": "כל הכבוד! / أحسنت!"
        },
        "video": {
          "title": "عنوان المقطع",
          "searchQuery": "كلمات بحث يوتيوب",
          "youtubeUrl": "https://www.youtube.com/watch?v=EUm-vAOmWV1",
          "reflectionQuestion": "سؤال التأمل"
        }
      }
    },
    "2_understanding": {
      "name": "${_===`hebrew`?`הבנת המשמעות`:`فهم وبناء المعنى`}",
      "number": 2,
      "icon": "🧩",
      "pedagogicalMode": "guided_exploration",
      "pedagogicalModeName": "${_===`hebrew`?`הבנה ובניית משמעות`:`بناء المعنى والاستكشاف`}",
      "studentPrompt": "المحتوى الصريح: نص القراءة الكامل إن كان فهم المقروء، أو الشرح والقواعد والمفاهيم...",
      "teacherGuidance": "إرشادات النمذجة أو قيادة الاستكشاف...",
      "suggestedDuration": 12,
      "scaffold": "منظم بصري أو خطوة مساعدة..."
    },
    "3_practice": {
      "name": "${_===`hebrew`?`יישום ותרגול`:`التطبيق والتدريب`}",
      "number": 3,
      "icon": "🛠️",
      "studentPrompt": "شرح توجيهي للمهمة وقواعد العمل الجماعي...",
      "teacherGuidance": "إرشادات المعلم لإدارة المحطة...",
      "suggestedDuration": 15,
      "workMode": "groups",
      "tasks": [
        { "tier": "support", "badge": "${_===`hebrew`?`🌱 קבוצת זינוק`:`🌱 فريق الانطلاق والتمكن`}", "title": "مهمة الانطلاق", "task": "المهمة وأسئلتها...", "scaffold": "تلميح..." },
        { "tier": "core", "badge": "${_===`hebrew`?`⭐ קבוצת שליטה`:`⭐ فريق الممارسة والإتقان`}", "title": "مهمة الإتقان", "task": "المهمة وأسئلتها...", "scaffold": "تلميح..." },
        { "tier": "advanced", "badge": "${_===`hebrew`?`🚀 קבוצת אתגר`:`🚀 فريق الرواد والتحدي`}", "title": "مهمة التحدي", "task": "المهمة وأسئلتها...", "scaffold": "تلميح..." }
      ]
    },
    "4_evidence": {
      "name": "${_===`hebrew`?`ראיות הבנה`:`أدلة الفهم`}",
      "number": 4,
      "icon": "🔎",
      "studentPrompt": "ورقة الدليل الفردي المستقل مع الأسئلة الصريحة (سؤال 1، 2، 3، 4)...",
      "teacherGuidance": "إرشادات تقييم الدليل الفردي...",
      "suggestedDuration": 7,
      "criterion": "معيار التحقق الصريح...",
      "individualTask": "نص أسئلة ورقة الدليل الفردي...",
      "allowedHelp": ["تلميح خفيف", "توضيح التعليمات"],
      "evalLevels": {
        "mastered": "${_===`hebrew`?`השיג את היעד`:`حقق الهدف`}",
        "partial": "${_===`hebrew`?`השיג חלקית`:`حققه جزئياً`}",
        "needs_support": "${_===`hebrew`?`זקוק לתמיכה`:`يحتاج دعماً`}",
        "insufficient_data": "${_===`hebrew`?`אין מספיק ראיות`:`الدليل غير كافٍ`}"
      }
    },
    "5_harvest": {
      "name": "${_===`hebrew`?`סיכום וקציר`:`حصاد ونقل الأثر`}",
      "number": 5,
      "icon": "🎒",
      "studentPrompt": "توجيهات الحصاد الصريحة للطلاب...",
      "teacherGuidance": "إرشادات المعلم لختام الحصة...",
      "suggestedDuration": 5,
      "exitTicket": {
        "q1": "${_===`hebrew`?`מה הרעיון המרכזי שלמדתי היום?`:`ما أهم فكرة تعلمتها اليوم؟`}",
        "q2": "${_===`hebrew`?`מה עזר לי להבין?`:`ما الذي ساعدني على الفهم؟`}",
        "q3": "${_===`hebrew`?`מה עדיין דורש הסבר?`:`ما الذي ما زلت أحتاج إلى توضيحه؟`}",
        "q4_transfer": "${_===`hebrew`?`איפה אוכל להשתמש במה שלמדתי?`:`أين أستطيع استخدام ما تعلمته؟`}"
      }
    }
  }
}`,O=e=>{if(!e)return null;let t=e.trim();t.startsWith("```json")?t=t.slice(7):t.startsWith("```")&&(t=t.slice(3)),t.endsWith("```")&&(t=t.slice(0,-3)),t=t.trim();try{return JSON.parse(t)}catch{let e=t.indexOf(`{`),n=t.lastIndexOf(`}`);if(e!==-1&&n>e)try{let r=t.substring(e,n+1).replace(/[“”؟‘’]/g,`"`).replace(/,\s*}/g,`}`).replace(/,\s*]/g,`]`);return JSON.parse(r)}catch{return null}return null}},k=e=>{let t=(e||``).toLowerCase();return t.includes(`انتخاب`)||t.includes(`ديمقراط`)||t.includes(`تصويت`)||t.includes(`اقتراع`)||t.includes(`مواطن`)?{title:`الانتخابات والديمقراطية للأطفال: كيف نختار ممثلينا ولماذا صوتك أمانة ومهم؟`,embedUrl:`https://www.youtube-nocookie.com/embed/S4328Yx6W20?rel=0`,youtubeUrl:`https://www.youtube.com/watch?v=S4328Yx6W20`,searchQuery:`الانتخابات والديمقراطية للاطفال كرتون تعليمي`,reflectionQuestion:`ما أهمية أن يشارك كل فرد بصوته في الانتخابات؟ وما المعايير التي تجعلك تختار مرشحاً معيناً؟`}:t.includes(`تميز`)||t.includes(`التميز`)||t.includes(`نجاح`)||t.includes(`تفوق`)||t.includes(`طموح`)||t.includes(`إتقان`)||t.includes(`اتقان`)?{title:`فيلم قصير عن التميز والنجاح: ما سر الفرق بين العادي والمتميز؟`,embedUrl:`https://www.youtube-nocookie.com/embed/EUm-vAOmWV1?rel=0`,youtubeUrl:`https://www.youtube.com/watch?v=EUm-vAOmWV1`,searchQuery:`فيلم قصير عن التميز والنجاح للاطفال رسوم متحركة`,reflectionQuestion:`بعد مشاهدة هذا الفيلم: ما الفرق الجوهري بين من يقوم بعمله بشكل عادي ومن يبحث دائماً عن التميز؟`}:t.includes(`مادة`)||t.includes(`حالات المادة`)||t.includes(`صلب`)||t.includes(`سائل`)||t.includes(`غاز`)||t.includes(`كيمياء`)||t.includes(`علوم`)||t.includes(`فيزياء`)||t.includes(`طاقة`)||t.includes(`ماء`)||t.includes(`دورة الماء`)?{title:`كرتون تعليمي: حالات المادة الثلاث وخصائصها وتغيراتها`,embedUrl:`https://www.youtube-nocookie.com/embed/bMnmJjL3hF8?rel=0`,youtubeUrl:`https://www.youtube.com/watch?v=bMnmJjL3hF8`,searchQuery:`حالات المادة الثلاث للاطفال كرتون`,reflectionQuestion:`ما الظاهرة التي شاهدتموها في المقطع؟ وكيف تختلف حركة الجزيئات بين الحالات الثلاث؟`}:t.includes(`حساب`)||t.includes(`رياضيات`)||t.includes(`كسور`)||t.includes(`ضرب`)||t.includes(`قسمة`)||t.includes(`جمع`)||t.includes(`طرح`)||t.includes(`أعداد`)||t.includes(`هندسة`)||t.includes(`مساحة`)?{title:`مغامرة الرياضيات والتفكير المنطقي للأطفال`,embedUrl:`https://www.youtube-nocookie.com/embed/4b2b-y4hPoc?rel=0`,youtubeUrl:`https://www.youtube.com/watch?v=4b2b-y4hPoc`,searchQuery:`فيديو تعليمي للأطفال في الرياضيات`,reflectionQuestion:`ما الفكرة الرياضية المفتاحية التي شاهدتموها في هذا الموقف؟ وكيف نطبقها اليوم؟`}:t.includes(`لغة`)||t.includes(`عربي`)||t.includes(`قراءة`)||t.includes(`إملاء`)||t.includes(`قواعد`)||t.includes(`همزة`)||t.includes(`فعل`)||t.includes(`اسم`)||t.includes(`نحو`)||t.includes(`قصة`)?{title:`مغامرة لغوية ممتعة في رحاب لغتنا العربية الجميلة`,embedUrl:`https://www.youtube-nocookie.com/embed/Pj15MjhZfEU?rel=0`,youtubeUrl:`https://www.youtube.com/watch?v=Pj15MjhZfEU`,searchQuery:`فيديو تعليمي لغة عربية للاطفال`,reflectionQuestion:`ما القاعدة أو المهارة اللغوية التي أوضحها هذا المقطع؟ وكيف نتجنب الخطأ فيها؟`}:t.includes(`قطار`)||t.includes(`القطار`)||t.includes(`قطارات`)||t.includes(`רכבת`)||t.includes(`train`)?{title:_===`hebrew`?`סרטון על התפתחות הרכבות והרכבת המהירה`:_===`english`?`Educational Video: High-Speed Trains`:`فيلم وثائقي للأطفال: كيف تطورت القطارات من البخار إلى القطار المغناطيسي؟`,embedUrl:`https://www.youtube-nocookie.com/embed/EUm-vAOmWV1?rel=0`,youtubeUrl:`https://www.youtube.com/watch?v=EUm-vAOmWV1`,searchQuery:`قطارات الاطفال كرتون فيلم تعليمي`,reflectionQuestion:_===`hebrew`?`מהו הדבר המרשים ביותר שראיתם בסרטון על הרכבות?`:_===`english`?`What impressed you most about the train in this video?`:`ما الاختراع الهندسي الذي جعل القطارات الحديثة تسبح فوق السكة دون احتكاك كما شاهدتم في المقطع؟`}:{title:_===`hebrew`?`סרטון חקר והשראה: ${p}`:_===`english`?`Inquiry Video: ${p}`:`فيلم استكشافي قصير: ${p}`,embedUrl:`https://www.youtube-nocookie.com/embed/EUm-vAOmWV1?rel=0`,youtubeUrl:`https://www.youtube.com/watch?v=EUm-vAOmWV1`,searchQuery:`${p} kids educational video`,reflectionQuestion:_===`hebrew`?`מהו הרעיון המרכזי שעורר את סקרנותכם בסרטון?`:_===`english`?`What key idea sparked your curiosity in this clip?`:`بعد مشاهدة هذا المقطع: ما الفكرة الجوهرية التي أثارت فضولكم وترتبط بدرسنا اليوم؟`}},A=(e=_)=>e===`hebrew`?y?{hookPrompt:`חידת הפתיחה והסקרנות בתחנת הרכבת 🚆:
דמיינו כלי תחבורה המסיע מאות נוסעים בבת אחת במהירות מסחררת, המרחף מעל המסילה ללא חיכוך וללא עשן!
כיצד הפכו קטרי הקיטור הישנים לרכבות עתידניות מרחפות? שתפו את ההשערה שלכם!`,riddle:{riddleText:`אני עורק תחבורתי מהיר, נע על מסילות ברזל כחץ שלוח, מחבר בין ערים רחוקות ומסיע מיליוני נוסעים. בעבר פלטתי עשן שחור מקיטור, והיום אני נוסע בחשמל נקי ובריחוף מגנטי. מי אני?`,clues:[`🔑 רמז 1: יש לי תחנות ייעודיות בכל עיר.`,`🔑 רמז 2: אני נוסע על מסילת ברזל ומסיע קרונות רבים.`],options:[`מטוס סילון`,`רכבת מהירה 🎯`,`מכונית היברידית`,`אוניית משא`],solution:`רכבת מהירה`,explanation:`הרכבת התפתחה מקטרי הקיטור הישנים ועד לרכבות המגלב המהירות של ימינו.`},station2Prompt:`קטע קריאה מרכזי: מסע ברכבת המהירה והפלא הטכנולוגי 🚆📖

בבוקר יום בהיר, התכנסו תלמידי כיתה ד' בתחנת הרכבת המרכזית, מתבוננים בהתפעלות ברכבת המהירה החדישה שהחליקה באלגנטיות על גבי המסילה. חרטומה האווירודינמי נצץ בשמש כחץ שלוח, ותנועתה השקטה העידה על עוצמה הנדסית מתקדמת המנוהלת בידי מחשבים חכמים.

במהלך הסיור המודרך, הסביר להם המדריך על ההיסטוריה המרתקת של הרכבות: מראשית ימיהן כקטר קיטור כבד הניזון מפחם ומים ופולט עשן שחור, דרך רכבות הדיזל והחשמל המודרניות, ועד למהפכת רכבות ה"מגלב" המגנטיות המרחפות באוויר ללא מגע ישיר עם הפסים, ומגיעות למהירות של למעלה מחמש מאות קמ"ש ללא זיהום אוויר.

בסיום הסיור הבינו התלמידים כי הרכבת איננה רק אמצעי תחבורה נוח, אלא עורק כלכלי וחברתי חיוני המחבר בין יישובים רחוקים ומקרב לבבות ואנשים במהירות ובבטחה.

📌 מילון מונחים וביאור מילים:
• אווירודינמי: מבנה חלק המפחית את התנגדות האוויר ומאפשר מהירות מרבית.
• רכבת מגלב (ריחוף מגנטי): טכנולוגיה המשתמשת בכוחות מגנטיים לדחייה ולהרמת הרכבת מעל המסילה ללא חיכוך.
• עורק כלכלי: נתיב תחבורה מרכזי המאפשר מסחר, תנועת עובדים ופיתוח יישובים.`,station3Tasks:[{tier:`support`,badge:`🌱 קבוצת זינוק והבנה`,title:`משימת איתור מידע מפורש בטקסט הרכבת`,task:`ענו על פי הכתוב בקטע הקריאה:
1. ממה הופעלו קטרי הקיטור הראשונים בהיסטוריה, ואיזה עשן פלטו?
2. מה מאפשר לרכבת ה"מגלב" לרחף מעל המסילה ולהגיע למהירות כה גבוהה?`,scaffold:`רמז: חפשו בפסקה השנייה והשלישית של הטקסט.`},{tier:`core`,badge:`⭐ קבוצת שליטה ותרגול`,title:`משימת הסקה והבנת קשרים בטקסט הרכבת`,task:`1. כיצד תרמה התפתחות הרכבות לשמירה על איכות הסביבה בהשוואה לקטרי הקיטור?
2. הסבירו במילים שלכם מדוע הרכבת נחשבת ל"עורק כלכלי וחברתי חיוני" על פי הפסקה האחרונה.`,scaffold:`רמז: השוו בין פחם לאנרגיה חשמלית, וחשבו כיצד חיבור בין ערים מסייע למסחר ולתושבים.`},{tier:`advanced`,badge:`🚀 קבוצת אתגר וחשיבה ביקורתית`,title:`משימת הערכה, ביקורת ותכנון עתידני`,task:`1. הביעו דעתכם: האם רכבות מהירות יכולות להחליף טיסות בין ערים סמוכות? נמקו את עמדתכם בעזרת שני נימוקים מתוך הטקסט ומניסיונכם.
2. הציעו רעיון לקרון רכבת חכם ועתידני (למשל: קרון למידה חווייתי או קרון ירוק) ותארו את יתרונותיו.`,scaffold:`רמז: חשבו על צריכת אנרגיה, נוחות הגעה למרכז העיר ומהירות.`}],station4Evidence:`דף משימה עצמאי — ראיות להבנת הנקרא: הרכבת המהירה 🚆✍️
ענו על השאלות הבאות באופן עצמאי כדי להוכיח את הבנתכם:

1. (איתור מידע): מה המאפיין הייחודי של מבנה חרטום הרכבת המהירה ומדוע הוא נבנה כך?
2. (הסקה): מדוע רכבת המגלב יכולה לנסוע מהר יותר מרכבת רגילה?
3. (הוכחה מתוך הטקסט): העתיקו משפט אחד מתוך הטקסט המעיד על חשיבות הרכבת לחברה ולכלכלה.
4. (הבעת עמדה): אם הייתם מתכננים קו רכבת מהירה חדש בארצנו, אילו שתי ערים הייתם בוחרים לחבר ומדוע?

כתבו את תשובתכם המלאה בתיבת המענה למטה ולחצו על "שלח תשובה למורה" 📤`,station5Prompt:`תחנת הקציר וסיכום הלמידה — מסע הרכבת 🎒✨
הגענו לסיום שיעור הבנת הנקרא!
1. איזה חידוש טכנולוגי בנושא הרכבות עורר בכם סקרנות רבה ביותר?
2. רכבות פועלות בדיוק ובסדר מופתי — כיצד תוכלו ליישם ערך זה של "דיוק ותכנון מוקדם" בלימודים שלכם?
3. ענו על כרטיס היציאה בכנות ובעצמאות.`}:{hookPrompt:`ברוכים הבאים לשיעור הבנת הנקרא בנושא (${p})! 📖✨\nתארו לעצמכם שאתם מוצאים יומן מסתורי שבו כתוב משפט קצר ומעורר מחשבה: "מי שאינו מוכן להקשיב לפרטים הקטנים, מפספס את הסוד הגדול ביותר."\nאיזה סוד לדעתכם עשוי להתגלות בקטע שנקרא היום? שתפו את ההשערה שלכם!`,riddle:null,station2Prompt:`קטע קריאה מרכזי: סוד ההצלחה והמעשה המשותף 📖

בבוקר יום סתווי נעים, התכנסו ילדי כיתה ד' בחצר בית הספר. המורה הודיעה כי בית הספר יוצא לפרויקט מיוחד: הקמת גינה קהילתית שתספק ירקות ופרחים לקשישי היישוב. בתחילה, היו תלמידים שחששו מן העבודה הקשה וטענו כי הקרקע יבשה וקשה לעיבוד.

אך יונתן, תלמיד שקט הידוע בחריצותו, ניגש אל הפינה המוזנחת, לקח מעדר קטן והחל לסקל אבנים. אט-אט הצטרפו אליו שאר התלמידים. כל אחד ואחת תרמו את חלקם: מי בעודפי זרעים שהביאו מהבית, ומי בהשקיה סבלנית ועידוד. בתוך מספר שבועות הפכה החלקה המוזנחת לנווה מדבר ירוק ומרהיב.

בטקס חנוכת הגינה אמרה המנהלת: "הגינה הזו איננה רק ערוגות של צמחים; היא הוכחה חיה לכך שכאשר כוונות טובות פוגשות התמדה ועבודה משותפת, גם אדמה קשה מצמיחה פירות מתוקים."

📌 מילון מונחים וביאור מילים:
• לסקל: להרים ולהרחיק אבנים מן האדמה כדי להכשירה לנטיעה.
• נווה מדבר: מקום ירוק ופורח בתוך סביבה צחיחה.
• התמדה: המשך עשייה ללא ויתור למרות הקשיים.`,station3Tasks:[{tier:`support`,badge:`🌱 קבוצת זינוק והבנה`,title:`משימת איתור מידע מפורש בטקסט`,task:`ענו על השאלות על פי הכתוב בקטע:
1. לשם מה החליטו להקים את הגינה הקהילתית?
2. מה עשה יונתן שגרם לשאר הילדים להצטרף אליו?`,scaffold:`רמז: חפשו בפסקה הראשונה והשנייה של הטקסט.`},{tier:`core`,badge:`⭐ קבוצת שליטה ותרגול`,title:`משימת הסקה והבנת קשרים`,task:`1. מה היה השינוי שחל בעמדת התלמידים לאורך הסיפור, ומדוע חל שינוי זה?
2. הסבירו במילים שלכם את כוונת המנהלת באומרה: "הגינה איננה רק ערוגות של צמחים".`,scaffold:`רמז: השוו בין תחילת הסיפור לסופו והתבוננו במשמעות הפנימית של הפרויקט.`},{tier:`advanced`,badge:`🚀 קבוצת אתגר וחשיבה ביקורתית`,title:`משימת הערכה, ביקורת ויצירתיות`,task:`1. הביעו דעתכם: האם מעשהו של יונתן מעיד על מנהיגות? נמקו את עמדתכם בעזרת ראיה מהסיפור.
2. הציעו כותרת מקורית אחרת לקטע הקריאה ונמקו מדוע היא מתאימה למסר המרכזי.`,scaffold:`רמז: חשבו מה מאפיין מנהיג שאינו רק מדבר אלא פועל ראשון.`}],station4Evidence:`דף משימה עצמאי — ראיות להבנת הנקרא ✍️
ענו על השאלות הבאות באופן עצמאי כדי להוכיח את הבנתכם:

1. (איתור מידע): מה היה החשש הראשוני של הילדים לפני שהחלו בעבודה?
2. (הסקה): מדוע לדעתכם זכה יונתן להערכה רבה, אף על פי שלא דיבר הרבה?
3. (הוכחה מהטקסט): העתיקו משפט אחד מתוך הטקסט המעיד על הצלחת הפרויקט.
4. (הבעת עמדה): איזה פרויקט התנדבותי הייתם מציעים להקים בבית ספרנו? נמקו את בחירתכם.

כתבו את תשובתכם המלאה בתיבת המعנה למטה ולחצו על "שלח תשובה למורה" 📤`,station5Prompt:`תחנת הקציר וסיכום הלמידה 🎒✨
הגענו לסיום שיעור הבנת הנקרא!
1. איזה לקח או תובנה מרכזית לקחתם מתוך קטע הקריאה היום?
2. ענו על שאלות כרטיס היציאה בכנות ובעצמאות.
3. שתפו פעולה והביאו את ערך העשייה וההתמדה אל הכיתה שלכם!`}:y?{hookPrompt:`لغز المشهد المحيّر في محطة السكة الحديد 🚆:
تخيّل وسيلة نقل تنقل آلاف الركاب دفعة واحدة بسرعة فائقة تفوق الرياح، وتطير فوق القضبان دون أن تلامسها ودون ضجيج أو دخان!
ما هذا الابتكار الهندسي المذهل؟ وكيف تحولت قاطرات الفحم القديمة إلى قطارات مغناطيسية تسبح في الهواء؟ شاركنا توقعك!`,riddle:{riddleText:`أنا شريان حيوي سريع، أنساب فوق القضبان كالبرق، أحمل ملايين المسافرين وأربط المدن بالقرى بأمان، كنت قديماً أنفث الدخان بفعل الفحم، وأصبحت اليوم أنطلق بالطاقة الكهربائية النظيفة. فمن أنا؟`,clues:[`🔑 تلميح 1: أسير على خطوط حديدية مخصصة.`,`🔑 تلميح 2: لي محطات في كل مدينة وأنقل الركاب والبضائع بأمان.`],options:[`السيارة الهجينة`,`القطار السريع 🎯`,`الطائرة النفاثة`,`السفينة البحرية`],solution:`القطار السريع`,explanation:`تطور القطار عبر العصور من قاطرات الفحم البخارية إلى القطارات الكهربائية والمغناطيسية الحديثة.`},station2Prompt:`نص القراءة المركزي: سرّ القطار السريع ورحلة عبر الزمن 🚆📖

في صباح يوم ربيعي مشرق، تجمع طلاب الصف الرابع في محطة القطارات المركزية، تملؤهم الدهشة وهم يراقبون انطلاق القطار السريع الحديث الذي ينساب بنعومة وسرعة فائقة فوق القضبان. كانت مقدمته الانسيابية تلمع كالسهم، وصوته الهادئ يوحي بقوة هندسية جبارة تديرها التكنولوجيا الحديثة.

استقبلهم المرشد في إحدى المقطورات المريحة، وأخذهم في رحلة عبر تاريخ هذا الاختراع المذهل؛ فأوضح لهم أن أول قطار في التاريخ كان يعمل بالمحرك البخاري ويحتاج إلى كميات هائلة من الفحم الحجري والمياه ليولد البخار الذي يدفع العجلات، وكان يطلق دخاناً كثيفاً في السماء. ومع تطور العلم، تحولت القطارات إلى قطارات ديزل ثم قطارات كهربائية نظيفة وسريعة.

ثم لفت المرشد أنظارهم إلى قطارات المستقبل الفائقة السرعة، مثل "القطار المغناطيسي" (ماجليف)، الذي لا يلامس القضبان بل يطفو فوقها بفضل قوى التنافر المغناطيسي، مما يقلل الاحتكاك تماماً ويجعله ينطلق بسرعة تزيد عن خمسمائة كيلومتر في الساعة بأمان تام ورفاهية عالية دون أي انبعاثات ضارة بالبيئة.

وفي ختام الجولة، تأمل الطلاب خارطة شبكة السكك الحديدية الممتدة كالجسور الشريانية، وأدركوا أن القطار ليس مجرد وسيلة نقل عادية، بل هو رمز لتقدم البشرية وشريان اقتصادي واجتماعي يربط بين الشعوب والمدن ويختصر المسافات الطويلة في ساعات معدودة.

📌 معجم المفردات والتراكيب الجديدة:
• انسيابية: تصميم ناعم ومقاوم للهواء يمنح سرعة وحركة مرنة.
• التنافر المغناطيسي: قوة فيزيائية تدفع قطبين مغناطيسيين متشابهين للتباعد مما يسمح للقطار بالطفو فوق السكة دون احتكاك.
• شريان اقتصادي: مسار حيوي لنقل التجارة والمسافرين وإنعاش الحياة والعمل بين المدن.`,station3Tasks:[{tier:`support`,badge:`🌱 فريق الانطلاق والتمكن`,title:`مهمة استخراج المعلومات الصريحة من نص القطار`,task:`أجب من واقع نص القطار القرائي:
١. ما الوقود الذي اعتمدت عليه أولى القطارات في التاريخ؟ وما الأثر البيئي الذي كانت تسببه؟
٢. اذكر الميزة التكنولوجية الفريدة لقطار "ماجليف" المغناطيسي التي تجعله ينطلق بسرعة فائقة.`,scaffold:`تلميح: راجع الفقرة الثانية والثالثة من النص القرائي.`},{tier:`core`,badge:`⭐ فريق الممارسة والإتقان`,title:`مهمة الاستنتاج وفهم العلاقات في نص القطار`,task:`١. بيّن كيف أسهم تطور القطارات عبر الزمن في حماية البيئة وتقليل التلوث.
٢. لماذا وصف الكاتب شبكة القطارات بأنها "شريان اقتصادي واجتماعي"؟ وضّح ذلك بأسلوبك مستشهداً بما ورد في النص.`,scaffold:`تلميح: قارن بين قطار الفحم وقطار الكهرباء، وفكّر في أثر ربط المدن على التجارة والناس.`},{tier:`advanced`,badge:`🚀 فريق الرواد والتحدي`,title:`مهمة التفكير الناقد والإبداع في تكنولوجيا النقل`,task:`١. برأيك، هل يمكن أن تشكل القطارات المغناطيسية الفائقة بديلاً آمناً واقتصادياً عن الطائرات في التنقل بين المدن الكبرى؟ علل إجابتك بحجتين منطقيتين من النص ومن معلوماتك.
٢. اقترح فكرة مقطورة ذكية ومبتكرة لقطار المستقبل واذكر أهم مميزاتها للركاب.`,scaffold:`تلميح: فكّر في استهلاك الطاقة، سرعة الوصول لوسط المدن، والراحة والأمان.`}],station4Evidence:`ورقة الدليل الفردي المستقل — إثبات فهم نص (القطار السريع) 🚆✍️
الآن حان وقت إثبات فهمك المستقل للنص القرائي. أجب عن الأسئلة الأربعة التالية بمفردك:

١. (تحديد واستخراج): ما الخاصية الفيزيائية التي تسمح لقطار "ماجليف" بالطفو دون ملامسة القضبان؟
٢. (السبب والنتيجة): لماذا صُممت مقدمة القطار السريع بشكل انسيابي يشبه السهم؟
٣. (دليل واقتباس): استخرج من النص جملة تدل على أن القطار يساهم في تقريب المسافات واختصار أوقات السفر.
٤. (التفكير والتطبيق): لو كنت المهندس المسؤول عن مسار القطار السريع في بلادنا، ما المدينتان اللتان ستقترح ربطهما أولاً؟ ولماذا؟

اكتب إجاباتك الواضحة في خانة الحل أدناه ثم اضغط "إرسال إجابتي للمعلم" 📤`,station5Prompt:`تأملات الحصاد ونقل الأثر — رحلة القطار 🎒✨
وصلنا إلى ختام رحلتنا المعرفية الممتعة في عالم القطارات!
١. ما أهم حقيقة علمية أو تاريخية أدهشتك اليوم عن تطور القطارات؟
٢. القطار يسير بنظام والتزام دقيق بالمواعيد والمسار — كيف تطبق قيمة "الالتزام والدقة" في تنظيم أوقاتك المدرسية والشخصية؟
٣. أجب عن أسئلة بطاقة الخروج بصدق واستقلالية.`}:{hookPrompt:`لغز وتحدي المدخل لدرس (${p}):\nتأمل هذا الموقف المثير: حدثت مفارقة تجعلنا نتساءل: كيف يمكننا التفسير بدقة ودون غموض؟ ما الذي يثير فضولك وما أول فكرة تخطر ببالك؟`,riddle:null,station2Prompt:`نص القراءة المركزي: سرّ النجاح والعمل المشترك 📖

في صباح يوم خريفي مشرق، اجتمع طلاب الصف في فناء المدرسة، حيث أعلنت المعلمة عن انطلاق مبادرة نوعية: زراعة حديقة مدرسية بيئية تخدم المجتمع. في البداية، تردد بعض الطلاب ظانين أن التربة جافة وأن العمل شاق ويحتاج جهداً كبيراً.

لكن سامر، وهو طالب عُرف بهدوئه ومثابرته، بادر فوراً وتقدم نحو الزاوية المهملة وبدأ يزيل الأحجار بروح العزيمة. وسرعان ما ألهم زملاءه فانضموا إليه واحداً تلو الآخر؛ هذا يحمل الشتلات، وتلك تسقي الماء بانتظام، والآخر ينظم الممرات. وخلال أسابيع قليلة، تحولت البقعة القاحلة إلى واحة خضراء مبهجة تبث الأمل.

وفي يوم افتتاح الحديقة، قالت المديرة بابتسامة فخر: "إن هذه الحديقة ليست مجرد نباتات وأزهار، بل هي برهان حي على أن الإرادة الصادقة والتعاون المثمر يحولان أصعب التحديات إلى نجاحات باهرة."

📌 معجم المفردات والتراكيب الجديدة:
• يزيل الأحجار: ينظف الأرض ويهيئها للغرس.
• واحة خضراء: مكان مفعم بالحياة والجمال.
• مثابرة: الاستمرار في العمل دون كلل أو تراجع.`,station3Tasks:[{tier:`support`,badge:`🌱 فريق الانطلاق والتمكن`,title:`مهمة استخراج المعلومات الصريحة`,task:`أجب من واقع النص القرائي:
١. ما المبادرة التي أعلنت عنها المعلمة في فناء المدرسة؟
٢. ماذا فعل سامر في البداية حتى تشجع باقي الزملاء؟`,scaffold:`تلميح: راجع الفقرة الأولى والثانية من النص.`},{tier:`core`,badge:`⭐ فريق الممارسة والإتقان`,title:`مهمة الاستنتاج وتفسير العلاقات`,task:`١. كيف تغير موقف الطلاب من بداية القصة إلى نهايتها؟ وما سبب هذا التحول؟
٢. فسر بأسلوبك قول المديرة: "إن هذه الحديقة ليست مجرد نباتات وأزهار".`,scaffold:`تلميح: تأمل الأثر المعنوي والتربوي للمبادرة.`},{tier:`advanced`,badge:`🚀 فريق الرواد والتحدي`,title:`مهمة النقد والتقييم والإبداع`,task:`١. ما رأيك في تصرف سامر؟ وهل يعد تصرفه قدوة للمبادرة الذاتية؟ علل رأيك بدليل من النص.
٢. اقترح عنواناً إبداعياً جديداً للنص القرائي مع بيان سبب اختيارك.`,scaffold:`تلميح: ركز على سمات المبادرة والمثابرة.`}],station4Evidence:`ورقة الدليل الفردي المستقل — أدلة فهم المقروء [ ${p} ] ✍️\nأجب عن الأسئلة الآتية بمفردك لإثبات فهمك المستقل:\n\n١. (استخراج صريح): ما التحدي الذي كان يخشاه بعض الطلاب في بداية المبادرة؟\n٢. (استنتاج): ما الصفة الأبرز التي تميزت بها شخصية سامر؟\n٣. (الاستشهاد بدليل): استخرج جملة صريحة من النص تثبت نجاح المشروع في النهاية.\n٤. (إبداء الرأي): لو كنت مكان الطلاب، ما الإضافة التي ستقترحها لتطوير الحديقة؟ ولماذا؟\n\nاكتب إجاباتك بوضوح في صندوق الحل ثم اضغط "إرسال إجابتي للمعلم" 📤`,station5Prompt:`محطة الحصاد ونقل الأثر 🎒✨\nوصلنا إلى ختام رحلتنا التعليمية الرائعة! حان وقت رصد ثمار تعلمكم اليوم:\n١. ما الفكرة الجوهرية التي اكتسبتموها عن (${p})؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف تستفيد مما تعلّمته في حياتك اليومية ومحيطك؟`},M=e=>{if(!e||!e.stations)return e;let t=(g+` `+p).toLowerCase(),n=t.match(/فيلم|فيديو|مقطع|video|film|movie|סרטון/i),r=t.match(/أحجية|احجية|لغز|فزورة|غموض|riddle|mystery|חידה/i),i=t.match(/بازل|puzzle|ترتيب|تركيب|jigsaw|פאזל/i);e.subject=e.subject||m,e.language=_,_===`hebrew`?((!e.objective||/[\u0600-\u06FF]/.test(e.objective))&&(e.objective=b?`התלמיד יקרא ויבין קטע קריאה בעברית בנושא (${p}), ויענה על שאלות הבנה ברמות חשיבה מגוונות תוך ביסוס מתוך הטקסט.`:x?`התלמיד יבין את המשמעות הערכית של (${p}), ינתח דילמות מוסריות, ויתחייב למעשה חיובי.`:`התלמיד ירכוש ויישם את מיומנויות השיעור (${p}) וינמק את שלביו בעברית תקינה.`),(!e.successCriteria||/[\u0600-\u06FF]/.test(e.successCriteria))&&(e.successCriteria=b?`מענה עצמאי על שאלות איתור מידע, הסקה והערכה תוך הבאת הוכחה וציטוט מקטע הקריאה.`:`ביצוע נכון של שלוש משימות מתמיינות, הצגת דף ראיות אישי, וניסוח תובנה יישומית.`)):_===`english`&&((!e.objective||/[\u0600-\u06FF]/.test(e.objective))&&(e.objective=b?`Students will read and comprehend a grade-level English passage on (${p}), answering multi-tiered questions.`:`Students will understand and apply the core concepts and skills of (${p}) with precise reasoning.`),(!e.successCriteria||/[\u0600-\u06FF]/.test(e.successCriteria))&&(e.successCriteria=`Successful completion of tiered practice tasks, text evidence demonstration, and reflective exit ticket response.`));let o=e.stations[`1_hook`];if(o){let e=t.includes(`تميز`)||t.includes(`التميز`)||t.includes(`نجاح`)||t.includes(`تفوق`),a=k(p+` `+g),s={title:a.title,embedUrl:a.embedUrl,youtubeUrl:a.youtubeUrl,searchQuery:a.searchQuery,reflectionQuestion:a.reflectionQuestion},c=_===`hebrew`?{riddleText:`אני סוד הקשור לנושא (${p}). בהתחלה אני נראה כחידה מסתורית, אך כאשר תחקרו את מאפייניי ותגלו את הרמזים, אהפוך למפתח שלכם להצלחה! מהו ההסבר ההגיוני שמאחוריי?`,clues:[`🔑 רמז 1: חשבו על הקשר הישיר בין המילים והרעיונות שראינו.`,`🔑 רמז 2: התבוננו במאפיין המרכזי שאינו משתנה.`],options:[`הסבר אקראי ללא ראיות`,`המושג המרכזי והמדויק של ${p} 🎯`,`התעלמות מהרמזים`,`ניחוש בלבד`],solution:`המושג המרכזי והמדויק של (${p}) 🎯`,explanation:`הפתרון טמון בחשיבה מדויקת, קישור בין רמזים לראיות והבנת מטרת השיעור!`}:_===`english`?{riddleText:`I am a hidden concept related to (${p}). Explore my clues to reveal how I connect our lesson today! What is the logical explanation behind me?`,clues:[`🔑 Clue 1: Think about the core patterns of our topic.`,`🔑 Clue 2: Eliminate random guesses and look for solid evidence.`],options:[`Random guess`,`The core rule of ${p} 🎯`,`No evidence`,`Giving up`],solution:`The core rule of (${p}) 🎯`,explanation:`Applying logical reasoning and evidence unlocks our learning goal!`}:e?{riddleText:`لستُ شيئاً تشتريه بالمال، ولا حجراً تجده في الرمال. إن بدأتَ عملاً أتقنته، وإن واجهك فشلٌ تحديته وتجاوزته! لا أرضى بالعادي بل أطمح للأفضل دائماً... فمن أكون؟`,clues:[`🔑 تلميح 1: كلمة تبدأ بحرف التاء، وترتبط بالإتقان والشغف والاجتهاد.`,`🔑 تلميح 2: هو شعار مدرستنا مشيرفة، والسر وراء كل عالم ومبتكر ومبدع!`],options:[`الكسل والانتظار`,`العمل العادي`,`التميّز والإتقان ⭐`,`الاستسلام السريع`],solution:`التميّز والإتقان المستمر ⭐`,explanation:`التميز ليس موهبة نولد بها فحسب، بل هو قرار واختيار يومي بالسعي والاجتهاد والتطور المستمر كما سنكتشف في محطات درسنا اليوم!`}:{riddleText:`أنا سرٌّ يرتبط بـ (${p})، أظهر في البداية كلغز محير، ولكن حينما تفكر في أسبابه وتستكشف خصائصه، أصبح مفتاحك للحل والنجاح... فما هو التفسير العلمي المنطقي وراء هذا الموقف؟`,clues:[`🔑 تلميح 1: فكر في العلاقة المباشرة بين المعطيات وما تعلمته سابقاً.`,`🔑 تلميح 2: استبعد التخمينات العشوائية وركز على الخاصية الأساسية التي لا تتغير.`],options:[`تفسير عشوائي بدون دليل`,`المفهوم العلمي المنطقي لـ ${p} 🎯`,`تجاهل الموقف`,`الاعتماد على الحظ`],solution:`المفهوم العلمي المنطقي لـ (${p}) 🎯`,explanation:`الحل يكمن في تطبيق التفكير المنطقي وربط الملاحظة بالدليل للوصول للهدف التعليمي للحصة.`},l=_===`hebrew`?{instruction:`סדרו את שלבי החקר והיישום של (${p}) ברצף הנכון להשלמת הפאזל:`,pieces:[{id:`p1`,text:`1. התבוננות, חקר המצב וזיהוי המושג 🔍`,order:1},{id:`p2`,text:`2. ניתוח הנתונים וקישור הרמזים 🧩`,order:2},{id:`p3`,text:`3. ניסוח המסקנה ויישום הכלל הלשוני/המדעי ⚙️`,order:3},{id:`p4`,text:`4. אימות התשובה והצגת ראיות הבנה עצמאיות ✅`,order:4}],targetConcept:`המסלול השלם להבנת ויישום (${p})`,successMessage:`🎉 מצוין! פאזל הלמידה הושלם בהצלחה וזכיתם במפתח הזהב!`}:_===`english`?{instruction:`Arrange the steps of exploring and applying (${p}) in proper order:`,pieces:[{id:`p1`,text:`1. Observe the problem and identify key concepts 🔍`,order:1},{id:`p2`,text:`2. Analyze evidence and patterns 🧩`,order:2},{id:`p3`,text:`3. Deduce the main rule and formula ⚙️`,order:3},{id:`p4`,text:`4. Verify results with independent evidence ✅`,order:4}],targetConcept:`Mastering (${p})`,successMessage:`🎉 Well done! The puzzle is completed and the key concept is unlocked!`}:{instruction:`رتب خطوات استكشاف وتطبيق (${p}) بالترتيب الصحيح لاكتمال البازل المعرفي:`,pieces:[{id:`p1`,text:`١. الملاحظة واستكشاف الموقف وتحديد المشكلة 🔍`,order:1},{id:`p2`,text:`٢. تحليل المعطيات وربط العلاقات ببعضها 🧩`,order:2},{id:`p3`,text:`٣. صياغة الاستنتاج وتطبيق القاعدة الحسابية/العلمية ⚙️`,order:3},{id:`p4`,text:`٤. التحقق من صحة الحل وتقديم الدليل الفردي ✅`,order:4}],targetConcept:`المسار المتكامل لفهم وتطبيق (${p})`,successMessage:`🎉 ممتاز! اكتمل بازل المعرفة بنجاح وحصلتم على المفتاح الذهبي للمحطة!`},u=`riddle`;r?u=`riddle`:i?u=`puzzle`:n?u=`video`:o.interactiveActivity?.type&&(u=o.interactiveActivity.type),o.interactiveActivity={type:u,title:u===`riddle`?_===`hebrew`?`חידת הפתיחה: ${p}`:_===`english`?`Opening Riddle: ${p}`:`أحجية ولغز: ${p}`:u===`puzzle`?_===`hebrew`?`פאזל האתגר: ${p}`:_===`english`?`Challenge Puzzle: ${p}`:`بازل التحدي: ${p}`:s.title,riddle:{...c,...o.interactiveActivity?.riddle||{}},puzzle:{...l,...o.interactiveActivity?.puzzle||{}},video:{...s,...o.interactiveActivity?.video||{},embedUrl:o.interactiveActivity?.video?.embedUrl||s.embedUrl,youtubeUrl:o.interactiveActivity?.video?.youtubeUrl||s.youtubeUrl}},o.media={type:`video`,title:o.interactiveActivity.video.title,searchQuery:o.interactiveActivity.video.searchQuery,youtubeUrl:o.interactiveActivity.video.youtubeUrl,embedUrl:o.interactiveActivity.video.embedUrl,reflectionQuestion:o.interactiveActivity.video.reflectionQuestion}}let c=e.stations[`2_understanding`],l=b?A(_):null,u=y&&(!c?.studentPrompt||!/قطار|القطار|רכבת|train/i.test(c.studentPrompt));c&&(s&&s.trim()?(c.studentPrompt=s.trim(),e.readingPassage={hasPassage:!0,fullText:s.trim(),title:p,isCustom:!0}):((!c.studentPrompt||!c.studentPrompt.trim()||_===`hebrew`&&/[\u0600-\u06FF]/.test(c.studentPrompt)||u)&&(b&&l?c.studentPrompt=l.station2Prompt:c.studentPrompt=_===`hebrew`?`מושגי יסוד והסבר מעמיק לשיעור (${p}):\n• חקרו את המאפיינים המרכזיים של המושג.\n• התבוננו בדוגמאות ובמשפטים והשוו ביניהם.\n• רשמו את הכלל המרכזי במחברת ושתפו את חבריכם.`:_===`english`?`Core Concepts and Meaning for (${p}):\n• Explore key concepts and structures.\n• Observe examples and compare them carefully.\n• Write down the main rule in your notebook.`:`المفاهيم العلمية الأساسية لـ (${p}):\n• استكشف الخصائص الجوهرية التي تميز هذا المفهوم.\n• لاحظ النماذج والأمثلة الحية وقارن بينها بدقة.\n• دوّن القاعدة الأساسية في دفترك العلمي.`),(b||a===`ai_passage`)&&(e.readingPassage={hasPassage:!0,fullText:c.studentPrompt,title:p,isCustom:!1})),(!c.teacherGuidance||!c.teacherGuidance.trim()||_===`hebrew`&&/[\u0600-\u06FF]/.test(c.teacherGuidance))&&(c.teacherGuidance=_===`hebrew`?`הנחיות למורה לתחנת הבנת המשמעות:
1. הנחו קריאה מודרכת פעילה ובררו את מילות המפתח.
2. שאלו שאלות מנחות לניסוח התובנה המרכזית על ידי התלמידים.
3. ודאו שהמושג ברור לכולם לפני המעבר לתרגול.`:_===`english`?`Teacher guidance for Station 2:
1. Guide students through active exploration.
2. Ask guiding questions to help students deduce the rule.
3. Reinforce the core objective.`:`إرشادات المعلم لمحطة بناء المعنى:
١. وجّه الطلاب نحو النمذجة والاستكشاف الصفي النشط.
٢. اطرح أسئلة توجيهية تساعد الطلاب على صياغة الاستنتاج بأنفسهم.
٣. ركّز على تثبيت المفهوم المركزي ومعايير التمييز بدقة.`),(!c.scaffold||!c.scaffold.trim())&&(c.scaffold=_===`hebrew`?`רמז מסייע: היעזרו בביאור המילים בצד.`:_===`english`?`Helpful hint: Refer to the visual graphic organizer.`:`منظم بصري أو خطوة استرشادية مساندة.`));let d=e.stations[`3_practice`];d&&((!d.studentPrompt||!d.studentPrompt.trim()||_===`hebrew`&&/[\u0600-\u06FF]/.test(d.studentPrompt))&&(d.studentPrompt=_===`hebrew`?`ברוכים הבאים לתחנת היישום והתרגול! 🛠️\nבמשימה זו ניישם את מה שלמדנו בנושא (${p}).\n• עבדו בקבוצות לפי שלוש רמות אתגר.\n• שתפו פעולה ונמקו את תשובותיכם בעברית ברורה!`:_===`english`?`Welcome to the Practice & Application Station! 🛠️\nIn this station, we will apply what we learned about (${p}).\n• Work collaboratively in your assigned tiered group.\n• Discuss challenges and justify every answer in English!`:`مرحباً بكم يا أبطال في محطة التطبيق والتدريب! 🛠️\nفي هذه المحطة سنقوم بتطبيق ما تعلمناه حول (${p}) وتعميق فهمنا العملي.\n• ستعمل الفرق وفق ٣ مستويات متمايزة (الانطلاق والتمكن، الممارسة والإتقان، الرواد والتحدي).\n• تعاونوا داخل مجموعتكم، ناقشوا التحديات، وبرروا كل خطوة تبريراً سليماً!`),b&&l&&(u||!d.tasks||d.tasks.length===0)&&(d.tasks=l.station3Tasks),(!d.teacherGuidance||!d.teacherGuidance.trim())&&(d.teacherGuidance=_===`hebrew`?`הנחיות למורה להנחיית הקבוצות ומעקב אחר הרמות השונות.`:`إرشادات المعلم لإدارة محطة التطبيق والتدريب ومتابعة الفرق المتمايزة والسقالات.`),(!d.scaffold||!d.scaffold.trim())&&(d.scaffold=_===`hebrew`?`רמז מסייע: חזרו לטקסט ולכלל מהתחנה הקודמת.`:_===`english`?`Scaffold hint: Check the rule from Station 2.`:`تلميح مساند: ارجع إلى القاعدة المركزية للمحطة السابقة واستند إليها في كل تمرين.`),Array.isArray(d.tasks)&&(d.tasks=d.tasks.map(e=>({...e,title:e.title||(_===`hebrew`?e.tier===`support`?`משימת זינוק והבנה`:e.tier===`core`?`משימת שליטה ותרגול`:`משימת אתגר וחשיבה`:_===`english`?e.tier===`support`?`Launch & Support Task`:e.tier===`core`?`Core Practice Task`:`Advanced Challenge Task`:e.tier===`support`?`مهمة الانطلاق والتمكن`:e.tier===`core`?`مهمة الممارسة والإتقان`:`مهمة الرواد والتحدي`)}))));let f=e.stations[`4_evidence`];if(f){let e=(f.studentPrompt||``).toLowerCase(),t=f.studentPrompt&&(f.studentPrompt.includes(`שאלה`)||f.studentPrompt.includes(`question`)||f.studentPrompt.includes(`سؤال`)||f.studentPrompt.includes(`١.`)||f.studentPrompt.includes(`1.`)||f.studentPrompt.includes(`؟`)||f.studentPrompt.includes(`?`));b&&l&&(u||!f.studentPrompt||!f.studentPrompt.trim()||!t&&(e.includes(`דף משימה`)||e.includes(`worksheet`)||e.includes(`ورقة الدليل`)||e.includes(`ارفعوا أوراقكم`)))?f.studentPrompt=l.station4Evidence:(!f.studentPrompt||!f.studentPrompt.trim()||!t&&(e.includes(`דף משימה`)||e.includes(`worksheet`)||e.includes(`ورقة الدليل`)||e.includes(`ارفعوا أوراقكم`)))&&(f.studentPrompt=_===`hebrew`?`דף משימה עצמי וראיות להבנה — [ ${p} ] ✍️\nענו על השאלות הבאות באופן עצמאי כדי להוכיח הבנה מדויקת:\n\n1. שאלה ראשונה (יישום ישיר): כתבו את המושג או הכלל במילים שלכם עם דוגמה.\n2. שאלה שנייה (הסבר ונימוק): נמקו מדוע תשובתכם נכונה בעזרת כלל שלמדנו.\n3. שאלת חשיבה והעברה: תנו משפט או דוגמה משלכם המיישמת את הכלל.\n\nכתבו את תשובתכם בבירור בשטח המענה למטה ולחצו "שלח תשובה למורה" 📤`:_===`english`?`Individual Evidence of Understanding Worksheet — [ ${p} ] ✍️\nAnswer the following questions independently to demonstrate your mastery:\n\n1. Question 1 (Direct Application): State the main concept or rule in your own words with an example.\n2. Question 2 (Reasoning & Evidence): Explain why your answer is correct using the lesson rule.\n3. Question 3 (Transfer & Extension): Write your own sentence or real-world example applying this concept.\n\nType your answers clearly below and click "Submit to Teacher" 📤`:`ورقة الدليل الفردي المستقل — [ ${p} ] ✍️\nالآن حان وقت إثبات فهمك المستقل. أجب عن أسئلة ورقة الدليل التالية:\n\n• السؤال الأول (تطبيق مباشر): اكتب المفهوم أو النتيجة الأساسية لـ (${p}) بأسلوبك.\n• السؤال الثاني (تحليل وتعليل): كيف تثبت صحة إجابتك بالدليل العلمي والمنطقي؟\n• السؤال الثالث (مسألة واستنتاج): إذا طُلب منك توضيح ذلك لزميلك، ما المثال الواقعي الذي ستضربه له؟\n\nتذكّر: اكتب إجابتك بوضوح وتفصيل في مساحة الحل أدناه ثم اضغط "إرسال إجابتي للمعلم" 📤`),(!f.individualTask||!f.individualTask.trim())&&(f.individualTask=f.studentPrompt),(!f.teacherGuidance||!f.teacherGuidance.trim())&&(f.teacherGuidance=_===`hebrew`?`הנחיות למורה להערכת דף הראיות האישי.`:`إرشادات المعلم لتقييم الدليل الفردي والتأكد من استقلالية كل طالب أثناء الحل.`),(!f.scaffold||!f.scaffold.trim())&&(f.scaffold=_===`hebrew`?`זכרו: קראו את השאלה בעיון ונמקו בבירור.`:_===`english`?`Remember: Read each question carefully and justify your answer.`:`تذكّر: اقرأ السؤال بدقة، وركّز على تقديم دليل مقنع.`)}let h=e.stations[`5_harvest`];return h&&((!h.studentPrompt||!h.studentPrompt.trim()||_===`hebrew`&&/[\u0600-\u06FF]/.test(h.studentPrompt))&&(h.studentPrompt=_===`hebrew`?`תחנת הקציר וסיכום הלמידה 🎒✨\nהגענו לסיום השיעור! זה הזמן לאסוף את פירות הלמידה שלכם היום:\n1. מה הרעיון המרכזי שלמדתם על (${p})?\n2. ענו בכנות ובעצמאות על שאלות כרטיס היציאה.\n3. חשבו: כיצד תוכלו להשתמש במה שלמדתם בחייכם?`:_===`english`?`Lesson Harvest & Transfer Station 🎒✨\nWe have reached the conclusion of our lesson! Let's reflect on your learning today:\n1. What is the core idea you learned about (${p})?\n2. Complete your exit ticket questions honestly.\n3. Think: Where and how can you use this knowledge in daily life?`:`محطة الحصاد ونقل الأثر 🎒✨\nوصلنا إلى ختام رحلتنا التعليمية الرائعة! حان وقت رصد ثمار تعلمكم اليوم:\n١. ما الفكرة الجوهرية التي اكتسبتموها عن (${p})؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف تستفيد مما تعلّمته في حياتك اليومية ومحيطك؟`),(!h.teacherGuidance||!h.teacherGuidance.trim())&&(h.teacherGuidance=_===`hebrew`?`הנחיות למורה לאיסוף כרטיסי היציאה וסיכום המהלך.`:`إرشادات المعلم لإغلاق الحصة ومراجعة مخرجات بطاقات الخروج ونقل الأثر.`),(!h.scaffold||!h.scaffold.trim())&&(h.scaffold=_===`hebrew`?`חשבו: מה הפתיע אתכם או חידש לכם היום?`:_===`english`?`Reflect: What was the most interesting thing you discovered today?`:`تأمل: كيف تطوّر فهمك وثقتك بالمفهوم منذ بداية الدرس حتى الآن؟`),h.exitTicket||(h.exitTicket=_===`hebrew`?{q1:`מה הרעיון המרכזי שלמדתי היום?`,q2:`מה עזר לי להבין?`,q3:`מה עדיין דורש הסבר נוסף מבחינתי?`,q4_transfer:`איפה אוכל להשתמש במה שלמדתי?`}:_===`english`?{q1:`What is the main idea I learned today?`,q2:`What helped me understand best?`,q3:`What do I still need more help with?`,q4_transfer:`Where can I apply what I learned?`}:{q1:`ما أهم فكرة تعلّمتها اليوم؟`,q2:`ما الذي ساعدني على الفهم؟`,q3:`ما الذي ما زلت أحتاج إلى توضيحه؟ (يمكنك اختيار: لا أحتاج إلى توضيح إضافي)`,q4_transfer:`أين أستطيع استخدام ما تعلّمته؟`})),e};if(d)for(let e of[`gemini-2.0-flash`,`gemini-1.5-flash`,`gemini-1.5-pro`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${d}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:`${E}\n\nStrict JSON response only matching schema:`}]}],generationConfig:{temperature:.35,maxOutputTokens:4200,responseMimeType:`application/json`}})},28e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text,n=O(e);if(n&&n.stations&&n.stations[`1_hook`])return M(n)}}catch(t){console.warn(`Gemini full journey (${e}) notice:`,t)}if(f)for(let e of[`llama-3.3-70b-versatile`,`llama-3.1-8b-instant`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${f}`},body:JSON.stringify({model:e,messages:[{role:`system`,content:`You are an elite bilingual curriculum and educational design expert for elementary schools. Output 100% valid JSON only adhering strictly to the requested language (${_}).`},{role:`user`,content:E}],response_format:{type:`json_object`},temperature:.35,max_tokens:3800})},28e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content,n=O(e);if(n&&n.stations&&n.stations[`1_hook`])return M(n)}}catch(t){console.warn(`Groq full journey (${e}) notice:`,t)}return M((()=>{if(_===`hebrew`){if(b){let e=A(`hebrew`);return{title:p,subject:m||`עברית - הבנת הנקרא`,language:`hebrew`,grade:h,objective:`התלמיד יקרא קטע קריאה בעברית (${p}), יבין את תוכנו המרכזי והמשתמע, ויענה על שאלות הבנה ברמות חשיבה מגוונות תוך ביסוס תשובותיו מתוך הטקסט.`,successCriteria:`מענה מדויק על שאלות איתור מידע, הסקת מסקנה אחת לפחות, והבעת עמדה אישית מנומקת המגובה בראיה מקטע הקריאה.`,suggestedDuration:45,stations:{"1_hook":{name:`אתגר וסקרנות`,number:1,icon:`🔥`,studentPrompt:e.hookPrompt,teacherGuidance:`עוררו את סקרנות התלמידים לקראת הקריאה, הזמינו השערות על פי הכותרת והנושא, ורשמו את מטרת השיעור על הלוח.`,suggestedDuration:6,scaffold:`רמז: התבוננו במילים המרכזיות בכותרת וחשבו מה הנושא הראשי.`,...e.riddle?{interactiveActivity:{type:`riddle`,title:`חידת הפתיחה על הרכבת`,riddle:e.riddle}}:{}},"2_understanding":{name:`הבנת המשמעות`,number:2,icon:`🧩`,pedagogicalMode:`guided_exploration`,pedagogicalModeName:`הבנה ובניית משמעות`,studentPrompt:e.station2Prompt,teacherGuidance:`הנחו קריאה מודרכת (קריאה קולית או שקטה), הסבירו מילים קשות ובדקו הבנה ראשונית של מהלך האירועים בטקסט.`,suggestedDuration:12,scaffold:`היעזרו בביאור המילים בצד לקריאה רציפה.`},"3_practice":{name:`יישום ותרגול`,number:3,icon:`🛠️`,suggestedDuration:15,workMode:`groups`,studentPrompt:`משימות הבנה מדורגות בקבוצות על קטע הקריאה 🛠️
עבדו יחד בקבוצות, דונו בשאלות ונמקו כל תשובה מתוך הטקסט שקראנו!`,teacherGuidance:`עברו בין הקבוצות, ודאו שתלמידי הזינוק מוצאים את המידע הגלוי, ותלמידי השליטה והאתגר מנמקים מתוך הטקסט.`,tasks:e.station3Tasks},"4_evidence":{name:`ראיות הבנה`,number:4,icon:`🔎`,suggestedDuration:7,criterion:`מענה עצמאי על שאלות ההבנה תוך הבאת הוכחה וציטוט מהטקסט.`,studentPrompt:e.station4Evidence,individualTask:e.station4Evidence,allowedHelp:[`הבהרת שאלות`,`הפניה לפסקה המתאימה`],evalLevels:{mastered:`הוכיח הבנה מעמיקה וביסס מתוך הטקסט`,partial:`ענה על חלק מהשאלות ללא ביסוס מספק`,needs_support:`זקוק לתיווך באיתור מידע`,insufficient_data:`אין מספיק ראיות`}},"5_harvest":{name:`סיכום וקציר`,number:5,icon:`🎒`,suggestedDuration:5,studentPrompt:e.station5Prompt,teacherGuidance:`אספו את כרטיסי היציאה, סכמו את המסר המרכזי של הסיפור וקשרו להישגי התלמידים.`,exitTicket:{q1:`מהו הדבר המשמעותי ביותר שלמדתי היום?`,q2:`איזה חלק בקטע הקריאה עורר בי הכי הרבה עניין?`,q3:`מה עדיין דורש ממני תרגול או הבהרה?`,q4_transfer:`כיצד אוכל ליישם את התובנה מהשיעור בחיי היום-יום?`}}}}}else if(x)return{title:p,subject:m||`חינוך לערכים ומנהיגות`,language:`hebrew`,grade:h,objective:`התלמיד יבין את המשמעות העמוקה של (${p}), ינתח דילמות מוסריות וחברתיות, ויתחייב ליישום הערך במעשים יומיומיים.`,successCriteria:`השתתפות בניתוח דילמה מוסרית, ניסוח שני נימוקים ערכיים, וקבלת התחייבות אישית למעשה חיובי בסביבתו.`,suggestedDuration:45,stations:{"1_hook":{name:`אתגר וסקרנות`,number:1,icon:`🔥`,studentPrompt:`פתיחה מעוררת מחשבה לשיעור (${p}):\nתארו לעצמכם מצב: נשאר לכם חטיף אחד אחרון שאתם מאוד אוהבים, וחבר שלכם שכח את ארוחת העשר ומביט בכם בעצב. מה עובר לכם בראש ברגע הראשון? האם קל או קשה לחלוק? שתפו בכנות!`,teacherGuidance:`הציגו את הדילמה ללא שיפוטיות, אפשרו מגוון קולות, וחברו את הדיון לערך המרכזי של השיעור.`,suggestedDuration:6,scaffold:`חשבו: מה גורם לנו להרגיש טוב באמת לאורך זמן?`},"2_understanding":{name:`הבנת המשמעות`,number:2,icon:`🧩`,pedagogicalMode:`guided_exploration`,pedagogicalModeName:`בירור המושג הערכי`,studentPrompt:`בירור המושג: מהי נתינה אמיתית וכיצד היא משנה אותנו? 🌟\n\nנתינה איננה רק מסירת חפץ או כסף. נתינה אמיתית היא להקדיש זמן, להעניק חיוך מעודד, להקשיב לחבר בשעת קושי, או לוותר על נוחות אישית כדי לעזור למישהו אחר.\n\nחוקרים גילו שכאשר אדם עושה מעשה טוב עבור הזולת, המוח שלו מפריש חומרים שגורמים לתחושת שמחה וסיפוק עמוקה. כלומר: "הנותן מקבל כפליים".\n\nשלושת עמודי התווך של (${p}):\n1. רגישות והבחנה: לראות מי סביבנו זקוק לעזרה עוד לפני שהוא מבקש.\n2. עשייה מכל הלב: לתת מתוך אכפתיות אמיתית ולא כדי לקבל פרס או תמורה.\n3. התמדה: להפוך את הנתינה להרגל יומיומי ולא למאורע חד-פעמי.`,teacherGuidance:`הנחו שיח ערכי מעמיק, בקשו דוגמאות מוחשיות מחיי בית הספר, וסכמו את עמודי התווך.`,suggestedDuration:12,scaffold:`חשבו על פעם אחת שבה עזרתם למישהו ואיך הרגשתם לאחר מכן.`},"3_practice":{name:`יישום ותרגול`,number:3,icon:`🛠️`,suggestedDuration:15,workMode:`groups`,studentPrompt:`משימת חקר ופתרון מצבים ערכיים בקבוצות 🛠️
לפניכם משימות מדורגות לתרגום ערך הנתינה למעשים קונקרטיים בחיי היום-יום. שתפו פעולה ונמקו כל החלטה!`,teacherGuidance:`עברו בין הקבוצות ועודדו דיון פתוח ומנומק המתרגם עקרונות תיאורטיים להתנהגות מעשית.`,tasks:[{tier:`support`,badge:`🌱 קבוצת זינוק`,title:`זיהוי מעשי נתינה יומיומיים`,task:`כתבו 3 דרכים שונות שבהן תלמיד יכול לגלות נתינה בכיתה מבלי להוציא אגורה אחת (למשל: עזרה בלימודים, שיתוף במשחק, מילה טובה).`,scaffold:`רמז: חשבו על מעשים של חברות והקשבה.`},{tier:`core`,badge:`⭐ קבוצת שליטה`,title:`ניתוח דילמה חברתית`,task:`תלמיד חדש הגיע לכיתה והוא עומד לבדו בהפסקה. חבריכם רוצים להמשיך במשחק כדורגל סוער.
מה הייתם עושים? הציעו פתרון שמגשים את ערך הנתינה וההכללה תוך שמירה על כבוד כולם.`,scaffold:`רמז: איך אפשר לשלב אותו במשחק או למצוא פתרון יצירתי?`},{tier:`advanced`,badge:`🚀 קבוצת אתגר ומנהיגות`,title:`יוזמה חברתית בבית הספר`,task:`תכננו "מיזם נתינה שבועי" עבור בית הספר שלנו:
1. מה מטרת המיזם?
2. מי קהל היעד?
3. מהם הצעדים המעשיים ליישומו?
הציגו את היוזמה בקצרה.`,scaffold:`רמז: חשבו על יוזמה פשוטה אך משפיעה (כגון: פינת חברות, סיוע בהפסקות).`}]},"4_evidence":{name:`ראיות הבנה`,number:4,icon:`🔎`,suggestedDuration:7,criterion:`הצגת שיקול דעת מוסרי עצמאי ונימוק החלטה ערכית בדף הראיות.`,studentPrompt:`דף משימה עצמאי — הכרעה בדילמה מוסרית אישית ✍️
ענו על השאלות הבאות באופן עצמאי ומנומק:

1. הסבירו במילים שלכם: מדוע אומרים ש"הנתינה מעשירה את הנותן יותר מאשר את המקבל"?
2. תארו מקרה שבו ויתרתם על משהו אישי למען חבר או בן משפחה. מה הרגשתם?
3. דילמה אישית: אם אתם ממהרים מאוד לשיעור ורואים תלמיד צעיר שבכה כי נפל לו הקלמר, כיצד תפעלו ומדוע?

כתבו את תשובתכם בבירור בתיבת המענה למטה ולחצו "שלח תשובה למורה" 📤`,individualTask:`דף משימה עצמאי לבירור ערכי והכרעה בדילמה.`,allowedHelp:[`הבהרת ההוראות`],evalLevels:{mastered:`הביע עמדה מוסרית בוגרת ומנומקת היטב`,partial:`ענה באופן חלקי ללא נימוק מעמיק`,needs_support:`זקוק להכוונה בהבנת הדילמה`,insufficient_data:`אין מספיק ראיות`}},"5_harvest":{name:`סיכום וקציר`,number:5,icon:`🎒`,suggestedDuration:5,studentPrompt:`תחנת הקציר — התחייבות אישית למעשה טוב 🎒✨
הגענו לסיום השיעור!
ערכים אינם נשארים במחברת — הם חיים במעשים שלנו.
ענו על שאלות כרטיס היציאה וקחו על עצמכם התחייבות אישית אחת להשבוע!`,teacherGuidance:`אספו את ההתחייבויות האישיות של התלמידים ועודדו אותם ליישמן במהלך השבוע.`,exitTicket:{q1:`מהו הדבר המשמעותי ביותר שהבנתי היום על ערך הנתינה?`,q2:`איזה חלק בשיעור גרם לי לחשוב מחדש על ההתנהגות שלי?`,q3:`האם יש מצב שבו קשה לי לתת או לחלוק, וכיצד אוכל להתגבר על כך?`,q4_transfer:`מעשה הנתינה הקונקרטי שאבצע עוד היום או מחר הוא:`}}}};return{title:p,subject:m||`לשון עברית`,language:`hebrew`,grade:h,objective:`התלמיד ירכוש ויישם את המיומנויות והמושגים המרכזיים של השיעור (${p}) וינמק את שלביו בעברית תקינה.`,successCriteria:`פתרון עצמאי של שלוש משימות מתמיינות, הצגת דף ראיות אישי מנומק, והעברת הידע למצב חיים מעשי.`,suggestedDuration:45,stations:{"1_hook":{name:`אתגר וסקרנות`,number:1,icon:`🔥`,studentPrompt:`פתיחה מאתגרת לשיעור (${p}):\nלפניכם תופעה מרתקת ומעוררת מחשבה: כיצד נוכל להסביר אותה במדויק וללא ספקות? מה הרעיון הראשון שעולה בדעתכם? שתפו והציעו השערה!`,teacherGuidance:`הציגו את המצב ועודדו השערות שונות מן התלמידים.`,suggestedDuration:6,scaffold:`רמז: חשבו על הקשר למה שלמדנו בשיעור הקודם.`},"2_understanding":{name:`הבנת המשמעות`,number:2,icon:`🧩`,pedagogicalMode:`guided_exploration`,pedagogicalModeName:`הבנה ובניית משמעות`,studentPrompt:`בניית המושגים והכלל המרכזי לשיעור (${p}):\n1. המושג המרכזי: הגדרה ומאפיינים מובהקים.\n2. הכלל היישומי: שלושת השלבים להגעה לתוצאה מדויקת.\n3. דוגמה מודגמת ומנומקת שלב אחר שלב.\n\nהעתיקו את הכלל למחברת והתבוננו בדוגמה.`,teacherGuidance:`הנחו את התלמידים לגילוי הכלל באופן פעיל.`,suggestedDuration:12,scaffold:`היעזרו בטבלת המושגים.`},"3_practice":{name:`יישום ותרגול`,number:3,icon:`🛠️`,suggestedDuration:15,workMode:`groups`,studentPrompt:`משימות תרגול מדורגות בקבוצות סביב (${p}) 🛠️\nפעלו יחד, דונו באתגרים ונמקו כל צעד בעברית בהירה!`,teacherGuidance:`עקבו אחר הקבוצות ותמכו באמצעות סולמות הרמז.`,tasks:[{tier:`support`,badge:`🌱 קבוצת זינוק`,title:`משימת זינוק מונחית`,task:`פתרו תרגיל ישיר בנושא (${p}) ובחרו את התשובה הנכונה עם נימוק קצר.`,scaffold:`רמז: חזרו לדוגמה הראשונה בתחנה 2.`},{tier:`core`,badge:`⭐ קבוצת שליטה`,title:`משימת שליטה ותרגול`,task:`יישמו את הכלל המרכזי של (${p}) על 3 מקרים חדשים במחברת ונמקו כל שלב.`,scaffold:`רמז: ודאו שכל תנאי הכלל מתקיימים.`},{tier:`advanced`,badge:`🚀 קבוצת אתגר`,title:`משימת אתגר וחשיבה`,task:`זהו את הטעות המוסתרת בדוגמה המוצגת, הסבירו אותה, וחברו תרגיל אתגר לחבריכם.`,scaffold:`רמז: התמקדו במקרי קצה ומורכבות.`}]},"4_evidence":{name:`ראיות הבנה`,number:4,icon:`🔎`,suggestedDuration:7,criterion:`הצגת תשובה עצמאית ומנומקת המוכיחה שליטה ב-(${p}).`,studentPrompt:`דף משימה עצמאי וראיות הבנה — (${p}) ✍️\nענו על השאלות בעצמכם:\n1. יישום ישיר: כתבו את המושג או הכלל במילים שלכם עם דוגמה מקורית.\n2. נימוק: מדוע תשובתכם נכונה על פי הכלל שלמדנו?\n3. העברה: תנו דוגמה ממצב אמיתי שבו הכלל בא לידי ביטוי.\n\nכתבו בבירור בתיבה למטה ולחצו "שלח תשובה למורה" 📤`,individualTask:`משימת ראיות הבנה עצמאית.`,allowedHelp:[`רמז קל`,`הבהרת הוראות`],evalLevels:{mastered:`השיג את היעד`,partial:`השיג חלקית`,needs_support:`זקוק לתמיכה`,insufficient_data:`אין מספיק ראיות`}},"5_harvest":{name:`סיכום וקציר`,number:5,icon:`🎒`,suggestedDuration:5,studentPrompt:`תחנת הקציר וסיכום הלמידה 🎒✨
אספו את פירות הלמידה שלכם היום וענו על שאלות כרטיס היציאה!`,teacherGuidance:`אספו את כרטיסי היציאה וסכמו את השיעור.`,exitTicket:{q1:`מה הרעיון המרכזי שלמדתי היום?`,q2:`מה עזר לי להבין בצורה הטובה ביותר?`,q3:`מה עדיין דורש הסבר נוסף מבחינתי?`,q4_transfer:`איפה אוכל להשתמש במה שלמדתי בחיי היומיום?`}}}}}return _===`english`?{title:p,subject:m||`English Language`,language:`english`,grade:h,objective:`Students will understand and apply the core concepts and skills of (${p}) with precise reasoning in English.`,successCriteria:`Successfully complete tiered practice tasks, provide textual evidence on the independent worksheet, and reflect in the exit ticket.`,suggestedDuration:45,stations:{"1_hook":{name:`Inquiry & Curiosity`,number:1,icon:`🔥`,studentPrompt:`Welcome to our lesson on (${p})! 🌟\nObserve this exciting riddle: What hidden pattern connects our topic to our everyday communication? Share your prediction!`,teacherGuidance:`Spark curiosity and invite initial student thoughts. Write the goal on the board.`,suggestedDuration:6,scaffold:`Hint: Think about keywords in the title.`},"2_understanding":{name:`Meaning & Concept Building`,number:2,icon:`🧩`,pedagogicalMode:`guided_exploration`,pedagogicalModeName:`Direct & Guided Inquiry`,studentPrompt:`Core Concepts for (${p}):\n1. Main Definition: Key features and vocabulary.\n2. Guided Steps: The 3 steps to successful application.\n3. Model Example: Step-by-step demonstration.\n\nReview the examples and write the main rule in your notebook.`,teacherGuidance:`Lead structured modeling and check for understanding before practice.`,suggestedDuration:12,scaffold:`Use the visual organizer and keywords.`},"3_practice":{name:`Tiered Practice & Collaboration`,number:3,icon:`🛠️`,suggestedDuration:15,workMode:`groups`,studentPrompt:`Welcome to the Practice Station! 🛠️
Work in your assigned tiered group, discuss solutions, and justify every step in English!`,teacherGuidance:`Facilitate group discussions and provide prompt scaffolds.`,tasks:[{tier:`support`,badge:`🌱 Launch Team`,title:`Direct Guided Practice`,task:`Complete direct exercises on (${p}) with clues provided.`,scaffold:`Hint: Check the first model in Station 2.`},{tier:`core`,badge:`⭐ Mastery Team`,title:`Core Application Task`,task:`Apply the main rule of (${p}) to 3 new cases and explain your reasoning.`,scaffold:`Hint: Verify against our success criteria.`},{tier:`advanced`,badge:`🚀 Challenge Team`,title:`Advanced Extension Task`,task:`Analyze a complex error in a given model, correct it, and formulate an original challenge.`,scaffold:`Hint: Focus on subtle edge cases.`}]},"4_evidence":{name:`Evidence of Mastery`,number:4,icon:`🔎`,suggestedDuration:7,criterion:`Independent and justified solution demonstrating mastery of (${p}).`,studentPrompt:`Independent Evidence Worksheet — [ ${p} ] ✍️\nAnswer the questions independently:\n1. State the core concept in your own words with an example.\n2. Explain why your answer is correct using the rule.\n3. Give a real-world transfer example.\n\nType your answer below and click "Submit to Teacher" 📤`,individualTask:`Independent evidence worksheet.`,allowedHelp:[`Minor clarification`],evalLevels:{mastered:`Mastered the goal`,partial:`Partially achieved`,needs_support:`Needs support`,insufficient_data:`Insufficient evidence`}},"5_harvest":{name:`Harvest & Transfer`,number:5,icon:`🎒`,suggestedDuration:5,studentPrompt:`Harvest Station 🎒✨
Reflect on today's learning journey and complete your exit ticket honestly!`,teacherGuidance:`Review student exit tickets and close the lesson.`,exitTicket:{q1:`What is the main idea I learned today?`,q2:`What helped me understand best?`,q3:`What do I still need more clarification on?`,q4_transfer:`Where can I apply what I learned outside of school?`}}}}:{title:p,subject:m||`عام`,language:`arabic`,grade:h,objective:b?`أن يقرأ الطالب النص القرائي لـ (${p}) قراءة واعية، ويستوعب مضامينه الصريحة والضمنية، ويجيب عن أسئلة الفهم بمستوياتها المتعددة بدقة.`:x?`أن يستوعب الطالب القيمة التربوية لـ (${p})، ويحلل مواقف اجتماعية واقعية، ويتعهد بممارسة سلوك إيجابي في محيطه.`:`أن يتمكن الطالب من استيعاب وتطبيق المهارات والمفاهيم الأساسية لدرس (${p}) وتبرير خطواته بدقة.`,successCriteria:b?`حل أسئلة الفهم الثلاثة (استخراج، استنتاج، وتقييم)، وتقديم دليل فردي موثق من النص القرائي.`:`حل وتطبيق ثلاثة تمارين متنوعة بنجاح، وتقديم دليل فردي يثبت الفهم المستقل، ونقل الأثر لموقف حياتي.`,suggestedDuration:45,stations:(()=>{if(b){let e=A(`arabic`);return{"1_hook":{name:`مشوّق ومحفّز`,number:1,icon:`🔥`,studentPrompt:e.hookPrompt,teacherGuidance:`اعرض الموقف وناقش فضول الطلاب دون إعلان الحل فوراً. اكتب الهدف ومعيار النجاح بخط بارز على اللوح.`,suggestedDuration:6,scaffold:`فكر في العلاقة بين المعطيات وما درسته في الحصة السابقة.`,...e.riddle?{interactiveActivity:{type:`riddle`,title:`لغز القطار السريع`,riddle:e.riddle}}:{}},"2_understanding":{name:`فهم وبناء المعنى`,number:2,icon:`🧩`,pedagogicalMode:`guided_exploration`,pedagogicalModeName:`الاستكشاف الموجّه وبناء المعنى`,studentPrompt:e.station2Prompt,teacherGuidance:`وجّه الطلاب لقراءة واعية للنص واستخراج الدلالات والمفردات الصعبة وتلخيص الفكرة العامة.`,suggestedDuration:12,scaffold:`الاستعانة بمعجم المفردات والتراكيب في أسفل النص.`},"3_practice":{name:`التطبيق والتدريب`,number:3,icon:`🛠️`,suggestedDuration:15,workMode:`groups`,studentPrompt:`مهمات التدريب المتمايزة داخل الفرق لدرس (${p}) 🛠️\nتعاونوا معاً، ناقشوا التحديات، وبرروا كل خطوة تبريراً علمياً سليماً!`,teacherGuidance:`تابع الفرق وقدّم السقالات المساندة للفئات المستهدفة للتأكد من استخراج الأدلة من النص.`,tasks:e.station3Tasks},"4_evidence":{name:`أدلة الفهم`,number:4,icon:`🔎`,suggestedDuration:7,criterion:`تقديم إجابة فردية مستقلة ومبررة تثبت امتلاك مهارة (${p}) دون مساعدة واستخراج الأدلة من النص.`,studentPrompt:e.station4Evidence,individualTask:e.station4Evidence,allowedHelp:[`تلميح بسيط`,`توضيح التعليمات`],evalLevels:{mastered:`حقق الهدف بدقة وقدم دليلاً مكتملاً`,partial:`حققه جزئياً ويحتاج تعزيزاً في التبرير`,needs_support:`يحتاج دعماً وتوجيهاً إضافياً`,insufficient_data:`الدليل غير كافٍ للحكم`}},"5_harvest":{name:`حصاد ونقل الأثر`,number:5,icon:`🎒`,suggestedDuration:5,studentPrompt:e.station5Prompt,teacherGuidance:`اجمع بطاقات الخروج وراجع مستويات الفهم والتأمل لدى الطلاب.`,exitTicket:{q1:y?`ما أهم معلومة تعلمتها اليوم عن تطور القطارات؟`:`ما أهم فكرة تعلّمتها اليوم؟`,q2:y?`ما الجزء الأكثر إثارة في النص القرائي؟`:`ما الذي ساعدني على الفهم؟`,q3:`ما الذي ما زلت أحتاج إلى توضيحه؟ (يمكنك اختيار: لا أحتاج إلى توضيح إضافي)`,q4_transfer:y?`كيف يمكنني تطبيق قيمة الالتزام والانضباط في حياتي اليومية؟`:`أين أستطيع استخدام ما تعلّمته في حياتي خارج المدرسة؟`}}}}return{"1_hook":{name:`مشوّق ومحفّز`,number:1,icon:`🔥`,studentPrompt:`لغز وتحدي المدخل لدرس (${p}):\nتأمل هذا الموقف المثير: حدثت مفارقة تجعلنا نتساءل: كيف يمكننا التفسير بدقة ودون غموض؟ ما الذي يثير فضولك وما أول فكرة تخطر ببالك؟`,teacherGuidance:`اعرض الموقف وناقش فضول الطلاب دون إعلان الحل فوراً. اكتب الهدف ومعيار النجاح بخط بارز على اللوح.`,suggestedDuration:6,scaffold:`فكر في العلاقة بين المعطيات وما درسته في الحصة السابقة.`},"2_understanding":{name:`فهم وبناء المعنى`,number:2,icon:`🧩`,pedagogicalMode:`guided_exploration`,pedagogicalModeName:`الاستكشاف الموجّه وبناء المعنى`,studentPrompt:`بناء المفاهيم والقاعدة الذهبية لـ (${p}):\n١. المفهوم الأساسي: التعريف والخصائص المركزية.\n٢. القاعدة التطبيقية: الخطوات الثلاث للوصول للحل الصحيح.\n٣. مثال محلول توضيحي خطوة بخطوة.`,teacherGuidance:`وجّه الطلاب لملاحظة النمط واستخراج القاعدة بأنفسهم قبل التلخيص الجماعي.`,suggestedDuration:12,scaffold:`مخطط بصري ملخص للقاعدة وللكلمات المفتاحية.`},"3_practice":{name:`التطبيق والتدريب`,number:3,icon:`🛠️`,suggestedDuration:15,workMode:`groups`,studentPrompt:`مهمات التدريب المتمايزة داخل الفرق لدرس (${p}) 🛠️\nتعاونوا معاً، ناقشوا التحديات، وبرروا كل خطوة تبريراً علمياً سليماً!`,teacherGuidance:`تابع الفرق وقدّم السقالات المساندة للفئات المستهدفة.`,tasks:[{tier:`support`,badge:`🌱 فريق الانطلاق والتمكن`,title:`مهمة الانطلاق والتمكن`,task:`حل تمرين مباشر حول (${p}): اختر الإجابة المناسبة من بين الخيارات مع توضيح بسيط للسبب.`,scaffold:`تلميح: راجع القاعدة من المحطة السابقة.`},{tier:`core`,badge:`⭐ فريق الممارسة والإتقان`,title:`مهمة الممارسة والإتقان`,task:`طبق القاعدة الأساسية لـ (${p}) على ثلاث فقرات جديدة في دفترك، مع كتابة تعليل موجز لكل خطوة.`,scaffold:`تلميح: تأمل الخطوات خطوة بخطوة.`},{tier:`advanced`,badge:`🚀 فريق الرواد والتحدي`,title:`مهمة الرواد والتحدي`,task:`اكتشف الخطأ الخفي في نموذج الحل المعروض وفسر سببه، ثم صغ مسألة جديدة لتحدي زملائك في باقي الفرق.`,scaffold:`تلميح: ركز على التحليل والتعليل.`}]},"4_evidence":{name:`أدلة الفهم`,number:4,icon:`🔎`,suggestedDuration:7,criterion:`تقديم إجابة فردية مستقلة ومبررة تثبت امتلاك مهارة (${p}) دون مساعدة.`,studentPrompt:`ورقة الدليل الفردي المستقل — [ ${p} ] ✍️\nالآن حان وقت إثبات فهمك المستقل. أجب عن أسئلة ورقة الدليل التالية:\n\n• السؤال الأول (تطبيق مباشر): اكتب المفهوم أو النتيجة الأساسية لـ (${p}) بأسلوبك.\n• السؤال الثاني (تحليل وتعليل): كيف تثبت صحة إجابتك بالدليل العلمي والمنطقي؟\n• السؤال الثالث (مسألة واستنتاج): إذا طُلب منك توضيح ذلك لزميلك، ما المثال الواقعي الذي ستضربه له؟\n\nتذكّر: اكتب إجابتك بوضوح وتفصيل في مساحة الحل أدناه ثم اضغط "إرسال إجابتي للمعلم" 📤`,individualTask:`مهمة التحقق الفردي المستقل مع الأسئلة الصريحة.`,allowedHelp:[`تلميح بسيط`,`توضيح التعليمات`],evalLevels:{mastered:`حقق الهدف بدقة وقدم دليلاً مكتملاً`,partial:`حققه جزئياً ويحتاج تعزيزاً في التبرير`,needs_support:`يحتاج دعماً وتوجيهاً إضافياً`,insufficient_data:`الدليل غير كافٍ للحكم`}},"5_harvest":{name:`حصاد ونقل الأثر`,number:5,icon:`🎒`,suggestedDuration:5,studentPrompt:`محطة الحصاد ونقل الأثر 🎒✨\nوصلنا إلى ختام رحلتنا التعليمية الرائعة! حان وقت رصد ثمار تعلمكم اليوم:\n١. ما الفكرة الجوهرية التي اكتسبتموها عن (${p})؟\n٢. أجب بصدق واستقلالية عن أسئلة بطاقة الخروج.\n٣. فكّر: كيف تستفيد مما تعلّمته في حياتك اليومية ومحيطك؟`,teacherGuidance:`اجمع بطاقات الخروج وراجع مستويات الفهم والتأمل لدى الطلاب.`,exitTicket:{q1:`ما أهم فكرة تعلّمتها اليوم؟`,q2:`ما الذي ساعدني على الفهم؟`,q3:`ما الذي ما زلت أحتاج إلى توضيحه؟ (يمكنك اختيار: لا أحتاج إلى توضيح إضافي)`,q4_transfer:`أين أستطيع استخدام ما تعلّمته في حياتي خارج المدرسة؟`}}}})()}})())},ne=async(e,t=[],n=`مستكشفنا البطل`)=>{let{geminiKey:r,groqKey:i}=await D(),a=`أنت "جني البحث العلمي السحري" 🧞‍♂️✨ في مدرسة مشيرفة الابتدائية، المساعد السحري الذكي للأطفال في رحلة البحث العلمي والاكتشاف.
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
- ممنوع تماماً كتابة أي نصوص بالإنجليزية أو مسودات تفكير.`,o=[{role:`system`,content:a}];if(Array.isArray(t)){let e=t.slice(-6);for(let t of e)t.sender===`user`?o.push({role:`user`,content:t.text}):t.sender===`genie`&&t.text&&o.push({role:`assistant`,content:t.text})}if(o.push({role:`user`,content:e}),i)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${i}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:o,temperature:.7,max_tokens:1200})},1e4);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e&&e.trim()){let t=M(e.trim());if(t)return t}}}catch(t){console.warn(`Genie AI (${e}) failed:`,t)}if(r){let t=[`gemini-1.5-flash`,`gemini-2.0-flash`,`gemini-1.5-pro`],i=`${a}\n\nسؤال الطالب ${n}: "${e}"`;for(let e of t)try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${r}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:i}]}],generationConfig:{temperature:.7,maxOutputTokens:1200}})},1e4);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim()){let t=M(e.trim());if(t)return t}}}catch(t){console.warn(`Genie AI Gemini (${e}) failed:`,t)}}return`شبيك لبيك يا بطلنا المبدع ${n}! 🧞‍♂️✨\nسؤالك العلمي مدهش جداً! تذكر أن كل بحث علمي يبدأ بـ:\n1. 🔍 ملاحظة شيء يثير دهشتك.\n2. ❓ صياغة سؤال واضح ومحدد (ما تأثير... على...؟).\n3. 💡 وضع فرضية ذكية قابلة للاختبار.\n4. 🧪 تجربة ممتعة تسجل فيها أرقامك وملاحظاتك!\nما هي فكرة التجربة التي ترغب في استكشافها معاً؟ 🪄🌱`},re=async({rawText:e=``,fileBase64:t=``,mimeType:n=`text/plain`,fileName:r=``})=>{if(e&&typeof e==`string`)try{let t=e.trim();if(t.startsWith(`{`)&&t.endsWith(`}`)){let e=JSON.parse(t);if(e.stations&&(e.stations.m||e.stations.f||e.stations.t||e.stations.y||e.stations.h))return{title:e.title||r.replace(/\.[^/.]+$/,``)||`تخطيط درس مستورد`,subject:e.subject||`عام`,grade:e.grade||`المرحلة الابتدائية`,duration:Number(e.duration)||45,objective:e.objective||``,author:e.author||`مستورد من الحاسوب`,stations:_(e.stations)}}}catch{}let{geminiKey:i,groqKey:a}=await D(),o=/[\u0590-\u05FF]/.test(e||``)||/[\u0590-\u05FF]/.test(r||``),s=o?`אתה המומחה הפדגוגי הבכיר של מודל "מַפְתֵּי"חַ" (מודל מפתיח) בבית הספר היסודי מושירפה.
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
}`,c=e=>{if(!e)return null;let t=e.trim();t.startsWith("```json")?t=t.slice(7):t.startsWith("```")&&(t=t.slice(3)),t.endsWith("```")&&(t=t.slice(0,-3)),t=t.trim();let n=t.indexOf(`{`),i=t.lastIndexOf(`}`);n!==-1&&i!==-1&&i>n&&(t=t.substring(n,i+1));try{let e=JSON.parse(t);if(e.stations&&(e.stations.m||e.stations.f||e.stations.t||e.stations.y||e.stations.h))return{title:e.title||r.replace(/\.[^/.]+$/,``)||`تخطيط درس مستورد`,subject:e.subject||`عام`,grade:e.grade||`المرحلة الابتدائية`,duration:Number(e.duration)||45,objective:e.objective||``,author:`مستورد من الحاسوب ومُعالج بموديل مِفْتَاح`,stations:_(e.stations)}}catch(e){console.warn(`Failed parsing AI JSON response:`,e)}return null};if(i)for(let r of[`gemini-1.5-flash`,`gemini-2.0-flash`,`gemini-1.5-pro`])try{let a=[];if(t&&(n===`application/pdf`||n.startsWith(`image/`))?(a.push({inlineData:{mimeType:n,data:t}}),a.push({text:s})):e&&a.push({text:`${s}\n\nنص ملف التخطيط المرفوع من الحاسوب:\n"""\n${e.slice(0,15e3)}\n"""`}),a.length>0){let e=await j(`https://generativelanguage.googleapis.com/v1beta/models/${r}:generateContent?key=${i}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:a}],generationConfig:{temperature:.4,maxOutputTokens:3800,responseMimeType:`application/json`}})},14e3);if(e.ok){let t=(await e.json()).candidates?.[0]?.content?.parts?.[0]?.text,n=c(t);if(n)return n}}}catch(e){console.warn(`Gemini upload parser (${r}) failed:`,e)}if(a&&e)for(let t of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`,`openai/gpt-oss-20b`])try{let n=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${a}`},body:JSON.stringify({model:t,messages:[{role:`system`,content:o?`אתה יועץ פדגוגי של מודל מפתיח. עליך להמיר את מערך השיעור המועלה ל-JSON של 5 התחנות.`:`أنت خبير بيداغوجي لنموذج مِفتاح. حول التخطيط المرفوع إلى JSON يحوي المحطات الخمس بدقة.`},{role:`user`,content:`${s}\n\nنص ملف التخطيط المرفوع:\n"""\n${e.slice(0,15e3)}\n"""`}],temperature:.4,max_tokens:3800,response_format:{type:`json_object`}})},13e3);if(n.ok){let e=(await n.json()).choices?.[0]?.message?.content,t=c(e);if(t)return t}}catch(e){console.warn(`Groq upload parser (${t}) failed:`,e)}let l=(e||``).split(`
`).map(e=>e.trim()).filter(Boolean),u=r.replace(/\.[^/.]+$/,``).replace(/[-_]/g,` `)||`تخطيط درس مستورد من الحاسوب`,d=`عام`,f=`المرحلة الابتدائية`,p=``;for(let e=0;e<Math.min(l.length,15);e++){let t=l[e];/عنوان|موضوع الدرس|נושא השיעור/i.test(t)?u=t.replace(/.*[:\-–]/,``).trim()||u:/مادة|المادة|الموضوع|تחום דעת/i.test(t)?d=t.replace(/.*[:\-–]/,``).trim()||d:/صف|الصف|כיתה/i.test(t)?f=t.replace(/.*[:\-–]/,``).trim()||f:/هدف|الهدف|الأهداف|מטרה/i.test(t)&&(p=t.replace(/.*[:\-–]/,``).trim()||p)}let m=l.length,h=Math.max(1,Math.floor(m/5)),g=(e,t)=>l.slice(e,t).join(`

`);return{title:u,subject:d,grade:f,duration:45,objective:p||`استيعاب المفاهيم الأساسية وتطبيقها في أنشطة متنوعة وفق نموذج مِفتاح.`,author:`مستورد من الحاسوب`,stations:{m:g(0,h)||`🔥 [م - مشوّق ومحفّز]: إثارة الفضول واستدعاء المعرفة السابقة وتهيئة الطلاب وتحديد هدف التعلم ومعيار النجاح.`,f:g(h,h*2)||`💡 [ف - فهم وبناء المعنى]: تقديم المفهوم الأساسي بلغة واضحة ونمذجة المعلم للمهارة خطوة بخطوة وتوضيح معايير النجاح.`,t:g(h*2,h*3)||`🛠️ [ت - تطبيق وتدريب]: مهمة أساسية مشتركة، سقالات دعم، تحديات للمتقدمين، وتفعيل مجموعة الدعم الفوري المؤقتة.`,y:g(h*3,h*4)||`🔎 [ي - يقين من الفهم]: أداة فحص فردية لقياس دليل حدوث التعلم وتحديد قرارات المعلم الثلاثة (تقدم / تدريب إضافي / دعم مختلف).`,h:g(h*4,m)||`🎒 [ح - حصاد وزوّادة]: تأمل ذاتي وتذكرة خروج تلخص الزوّادة المعرفية والوجدانية وسؤال نقل الأثر للبيت.`}}},ie=async({stationNumber:e=1,problemTitle:t=``,problemDetail:n=``,whyProblem:r=``,extraContext:i=``})=>{let{geminiKey:a,groqKey:o}=await D(),s={1:`أنت "مرشد حاضنة ستيم الذكي" لمدرسة مشيرفة الابتدائية.
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
2. اقترح عبارة وسام وشعار تميز يستحقه الفريق.`},c=s[e]||s[1];if(o)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${o}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:[{role:`system`,content:`أنت مرشد بيداغوجي ذكي لحاضنة ستيم بمدرسة مشيرفة الابتدائية. قدم إرشادات تشجيعية وعملية باللغة العربية الفصحى.`},{role:`user`,content:c}],temperature:.6,max_tokens:650})},8e3);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e&&e.trim())return M(e.trim())}}catch(t){console.warn(`Groq STEAM Station Guide (${e}) failed:`,t)}if(a)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${a}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:c}]}],generationConfig:{temperature:.6,maxOutputTokens:650}})},8e3);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return M(e.trim())}}catch(t){console.warn(`Gemini STEAM Station Guide (${e}) failed:`,t)}return`أحسنت يا بطل الابتكار! 🌟 في هذه المحطة، ركّز على ربط ما تلاحظه في مدرستنا مشيرفة بالحلول العملية. كل فكرة مهما كانت بسيطة هي بداية لاختراع عظيم! 🚀💡`},ae=async({stationNumber:e=1,ageTrack:t=`upper`,problemText:n=``,questionText:r=``,evidenceText:i=``,subjectKey:a=``,solutionsList:o=``,planText:s=``,testDataText:c=``,reflectionText:l=``})=>{let{geminiKey:u,groqKey:d}=await D(),f=t===`lower`,p=f?`أنت تتحدث مع تلميذ في الصفوف الأولى (1-3). استخدم جملاً قصيرة جداً ومرحة، كلمات سهلة ومشجعة، وأمثلة حسية ملموسة.`:`أنت تتحدث مع تلميذ في الصفوف العليا (4-6). استخدم أسلوباً علمياً مشوقاً، وركز على الدليل، والتحديد، والقياس.`,m=``;switch(e){case 1:m=`المحطة 1: ألاحظ: ما المشكلة؟
رسالة المحطة: «انظر حولك: ما الشيء الذي تتمنى تحسينه في المدرسة أو البيت أو الحي؟»
ما كتبه الطالب: "${n}"
المطلوب منك:
1. اطرح عليه سؤالين استقصائيين مثل: "متى لاحظت ذلك؟" و "ما الذي رأيته بنفسك في مدرسة مشيرفة؟".
2. ساعده على التمييز بين موضوع عام (مثل "الكهرباء" أو "النظافة") ومشكلة محددة قابلة للملاحظة.
3. اقترح له صياغة أوضح وأدق للمشكلة ليراجعها ويختار ما يناسبه.`;break;case 2:m=`المحطة 2: أحدّد: ماذا أريد أن أعرف أو أغيّر؟
المشكلة الملاحظة: "${n}"
سؤال التحدي الحالي: "${r}"
المطلوب منك:
1. اشرح للطالب الفرق بين: ما شاهده كواقع، وتفسيره المحتمل، وفكرته للحل.
2. ساعده على تضييق السؤال ليصبح سؤال بحث أو تحدياً هندسياً عملياً يبدأ بـ "كيف يمكننا... دون أن...؟".
3. ذكّره بالحدود العملية (الوقت المتاح، المواد الممكنة في المدرسة، وما يمكن قياسه).`;break;case 3:m=`المحطة 3: أستكشف: ماذا نعرف قبل أن نقترح حلًا؟
المشكلة: "${n}"
ما كتبه كدليل: "${i}"
المطلوب منك:
1. نبّه الطالب بلطف إذا كان قد كتب تخميناً أو حكماً شخصياً على أنه حقيقة، وسل: "كيف عرفت ذلك؟ وما مصدر هذه المعلومة؟".
2. ساعده على التمييز بين "وجدت دليلاً على..." و "ما زلت لا أعرف...".
3. اقترح عليه مصدرين أو فكرتين بسيطتين لجمع أدلة حقيقية من بيئة المدرسة.`;break;case 4:m=`المحطة 4: أرى المشكلة بعيون المواد (العدسة: ${a||`المواد الدراسية`})
المشكلة: "${n}"
المطلوب منك:
بين للطالب كيف ينظر معلم ${a||`المادة`} لهذه المشكلة، واقترح عليه فكرة لسؤال أو مهمة قصيرة جداً خاصة بهذه المادة تجعل مشروعه أكثر عمقاً وتكاملاً.`;break;case 5:m=`المحطة 5: أتخيل وأقارن حلولًا
المشكلة: "${n}"
الحلول المقترحة: "${o}"
المطلوب منك:
1. ساعد الطالب في مقارنة حلوله بحسب المعايير (هل يعالج المشكلة؟ هل يمكن تنفيذه؟ ما مواده؟ كيف سنعرف أنه نجح؟).
2. اسأله عن ميزة كل فكرة وأهم قيد أو عائق أمامها (دون أن تختار الحل نيابة عنه!).`;break;case 6:m=`المحطة 6: أخطّط وأبني
المشروع والحل المختار: "${s}"
المطلوب منك:
1. ساعد في ترتيب خطوات العمل في 3-4 خطوات متسلسلة.
2. اقترح عليه كيف يوزع الأدوار بإنصاف بين أعضاء الفريق.
3. قدم نصيحة لاختيار خامات آمنة وقليلة التكلفة في المدرسة أو البيت.`;break;case 7:m=`المحطة 7: أجرّب وأقيس
ما كتبه عن التجربة والبيانات: "${c}"
المطلوب منك:
1. شجع الطالب على قياس ما قبل التجربة وما بعد التجربة (Before / After).
2. اسأله: "هل تدعم هذه الأرقام استنتاجك؟ وما الذي قد يكون أثر على النتيجة؟".
3. اقترح طريقة بسيطة لعرض الأرقام (جدول أو رسم مبسط).`;break;case 8:m=`المحطة 8: أتبصّر وأعيد المحاولة
رسالة المحطة: «ماذا نجح؟ ماذا لم ينجح؟ ما الذي ستغيّره، ولماذا؟»
ما كتبه الطالب: "${l}"
المطلوب منك:
1. أكد للطالب أن إعادة المحاولة والتعديل جزء أساسي وممتع في رحلة الابتكار وليست إخفاقاً أبداً.
2. اقترح عليه فكرتين لتطوير نسخته الثانية (V2).`;break;case 9:m=`المحطة 9: أشارك الأثر
ملخص المشروع: "${n} | ${s}"
المطلوب منك:
1. صغ عبارة ملهمة وموجزة تعبر عن فخر المدرسة بهذا الابتكار.
2. اطرح السؤال الختامي: "لمن يفيد الحل؟ وما الخطوة التالية لتطبيقه على نطاق أوسع في مدرستنا؟".`;break;default:m=`قدم نصيحة تفكير هندسي وبحثي لتلميذ المرحلة الابتدائية حول: "${n}".`}let h=`أنت "مرشد مختبر التميّز" في مدرسة مشيرفة الابتدائية.
${p}
قواعدك الصارمة:
- لا تعطِ حلاً جاهزاً أبداً؛ دورك أن تسأل، وتلفت النظر للثغرات، وتساعد في صياغة الفكرة.
- الرد بلغة عربية فصحى مشوقة، مقسم لنقاط قصيرة، مع إيموجيز مشجعة (💡 🔬 🔍 🛠️ 🎯).
- الحد الأقصى للرد: 3 إلى 4 أسطر فقط لتناسب تركيز التلميذ.

المهمة الحالية:
${m}`;if(d)for(let e of[`qwen/qwen3.8-27b`,`openai/gpt-oss-120b`,`allam-2-7b`])try{let t=await j(`https://api.groq.com/openai/v1/chat/completions`,{method:`POST`,headers:{Authorization:`Bearer ${d}`,"Content-Type":`application/json`},body:JSON.stringify({model:e,messages:[{role:`system`,content:`أنت مرشد مختبر التميز بمدرسة مشيرفة.`},{role:`user`,content:h}],temperature:.5,max_tokens:500})},7500);if(t.ok){let e=(await t.json()).choices?.[0]?.message?.content;if(e&&e.trim())return M(e.trim())}}catch(t){console.warn(`Groq ExcellenceLab AI (${e}) error:`,t)}if(u)for(let e of[`gemini-2.5-flash`,`gemini-3.6-flash`,`gemini-flash-latest`])try{let t=await j(`https://generativelanguage.googleapis.com/v1beta/models/${e}:generateContent?key=${u}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:h}]}],generationConfig:{temperature:.5,maxOutputTokens:500}})},7500);if(t.ok){let e=(await t.json()).candidates?.[0]?.content?.parts?.[0]?.text;if(e&&e.trim())return M(e.trim())}}catch(t){console.warn(`Gemini ExcellenceLab AI (${e}) error:`,t)}return f?`أحسنت يا بطل! 🌟 فكرتك جميلة جداً، فكر في شيء شاهدته بنفسك في مدرستنا، وتذكر أن العلماء الصغار يلاحظون الأشياء بذكاء! 🔍💡`:`خطوة ممتازة نحو التفكير العلمي! 🌟 احرص على أن تميز بين ما رأيته كدليل مؤكد وما تتوقعه، واجعل سؤالك محدداً بدقة. 🎯🔬`};export{y as A,q as C,re as D,$ as E,b as M,x as N,G as O,K as S,ie as T,L as _,W as a,I as b,N as c,Y as d,X as f,Z as g,Q as h,M as i,g as j,S as k,R as l,ee as m,H as n,P as o,te as p,z as r,V as s,B as t,U as u,F as v,ae as w,J as x,ne as y};