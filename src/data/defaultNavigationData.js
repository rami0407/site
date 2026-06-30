// Default navigation links for Musheirifa Elementary School
export const defaultNavigation = [
  { id: "nav_1", label: "الرئيسية", type: "section", target: "home", order: 1 },
  { id: "nav_2", label: "المبادرات", type: "section", target: "initiatives", order: 2 },
  { id: "nav_3", label: "الرزنامة", type: "section", target: "calendar", order: 3 },
  { id: "nav_4", label: "الأخبار", type: "section", target: "news", order: 4 },
  { id: "nav_5", label: "كلمة المدير", type: "section", target: "principal", order: 5 },
  { id: "nav_6", label: "روابط هامة", type: "section", target: "links", order: 6 },
  { id: "nav_7", label: "الكتب واللباس الموحد", type: "section", target: "books", order: 7 },
  { id: "nav_8", label: "المعرض", type: "section", target: "gallery", order: 8 },
  { id: "nav_9", label: "اتصل بنا", type: "section", target: "contact", order: 9 }
];

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
