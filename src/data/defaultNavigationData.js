// Default navigation links for Musheirifa Elementary School
export const defaultTopNavigation = [
  { id: "top_books", label: "📚 الكتب واللباس الموحد", type: "page", target: "books", category: "top", order: 1 },
  { id: "top_links", label: "🔗 روابط هامة", type: "section", target: "links", category: "top", order: 2 },
  { id: "top_gallery", label: "🖼️ المعرض", type: "section", target: "gallery", category: "top", order: 3 },
  { id: "top_contact", label: "📞 اتصل بنا", type: "section", target: "contact", category: "top", order: 4 }
];

export const defaultMainNavigation = [
  { id: "nav_1", label: "الرئيسية", type: "section", target: "home", category: "main", order: 1 },
  { id: "nav_learning_corner", label: "🎮 ركن التعلم", type: "page", target: "learning-corner", category: "main", order: 2 },
  { id: "nav_2", label: "المبادرات", type: "section", target: "initiatives", category: "main", order: 3 },
  { id: "nav_challenge", label: "🏆 التحدي الأسبوعي", type: "page", target: "challenge", category: "main", order: 4 },
  { id: "nav_worksheets", label: "📑 أوراق العمل", type: "page", target: "worksheets", category: "main", order: 5 },
  { id: "nav_articles", label: "📚 مقالات علمية", type: "page", target: "articles", category: "main", order: 6 },
  { id: "nav_parent_polls", label: "📊 تصويت الأهالي", type: "page", target: "parent-polls", category: "main", order: 7 },
  { id: "nav_appointments", label: "📅 حجز لقاء مع المعلم", type: "page", target: "appointments", category: "main", order: 8 },
  { id: "nav_3", label: "الرزنامة", type: "section", target: "calendar", category: "main", order: 9 },
  { id: "nav_4", label: "الأخبار", type: "section", target: "news", category: "main", order: 8 },
  { id: "nav_5", label: "كلمة المدير", type: "section", target: "principal", category: "main", order: 9 }
];

export const defaultNavigation = [...defaultMainNavigation, ...defaultTopNavigation];

export const defaultPages = [
  {
    id: "school-rules",
    title: "دستور المدرسة والأنظمة العامة",
    content: `نعمل في مدرسة مشيرفة الابتدائية على توفير بيئة تعليمية آمنة ومحفزة لجميع الطلاب. هذا الدستور يحدد الحقوق والواجبات المتبادلة لضمان سير العملية التربوية بنجاح:

1. الالتزام باللباس المدرسي الموحد والمظهر اللائق كقيمة تعبر عن الانضباط والمساواة.
2. الحضور المنتظم والمبكر للمدرسة والالتزام بمواعيد الحصص والفرص.
3. المحافظة على ممتلكات المدرسة ونظافة الصفوف والساحات العامة.
4. الاحترام المتبادل بين الطلاب، وبين الطلاب والمعلمين، وتجنب أي مظاهر للعنف اللفظي أو البدني.
5. المشاركة الفعالة في الأنشطة المدرسية والتربوية والمنهجية.

نتمنى لجميع طلابنا عاماً دراسياً موفقاً ملؤه التميز والعطاء.`,
    createdAt: new Date().toISOString()
  }
];
