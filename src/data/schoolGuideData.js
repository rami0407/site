// Default school textbook lists, uniform rules, and letter to parents for Musheirifa Elementary School
export const defaultLetter = {
  title: "حضرة ولي امر الطالب/ة المحترم",
  salutation: "تحية عطرة وبعد:",
  content: `نتقدم اليكم بجزيل الشكر والتقدير على دعمكم وتعاونكم المستمر طوال العام الدراسي، فقد كنتم شركاء حقيقيين في تحقيق بيئة تعليمية ناجحة ومتميزة لأبنائنا. ان ما تحقق من إنجازات وتميز هو ثمرة هذا التعاون البناء بين البيت والمدرسة.

يسرنا ان نرفق لكم قائمة الكتب المعتمدة للعام الدراسي القادم 27/2026 , بالإضافة الى تفاصيل اللباس المدرسي الموحد، املين منكم الاطلاع والالتزام بما ورد فيها استعدادا لبداية عام دراسي جديد حافل بالعطاء والنجاح.`,
  valediction: "باحترام، مدير المدرسة والهيئة التدريسية"
};

export const defaultUniform = [
  { id: "u_1", grades: "الأول والثاني", description: "بلوزة باللون البوردو + بنطلون جينز + شعار المدرسة", colorCode: "#800020" },
  { id: "u_2", grades: "الثالث والرابع", description: "بلوزة تركيز (تركواز) + شعار المدرسة + بنطلون جينز", colorCode: "#40E0D0" },
  { id: "u_3", grades: "الخامس والسادس", description: "بلوزة كحلية + بنطلون جينز + شعار المدرسة", colorCode: "#000080" }
];

export const defaultBooks = [
  // الصف الأول
  { id: "1_1", grade: "1", subject: "اللغة العربية", title: "الغيث الجزء 1+2+3", author: "وئام وتد", year: "2017", notes: "" },
  { id: "1_2", grade: "1", subject: "رياضيات", title: "الوسام جزء 1,2,3", author: "د.احمد هيبي", year: "الطبعة الجديدة", notes: "الرجاء شراء جميع الأجزاء من بداية السنة" },
  { id: "1_3", grade: "1", subject: "علوم وتكنولوجيا", title: "الكنز في العلوم والتكنولوجيا", author: "د. احمد هيبي ,محمود منصور", year: "2018", notes: "" },
  { id: "1_4", grade: "1", subject: "حذر", title: "المسار", author: "د. احمد هيبي", year: "", notes: "" },
  { id: "1_5", grade: "1", subject: "اللغة العبرية", title: "دوسيه + الوان + برستول + مقص ودبق", author: "", year: "", notes: "" },
  { id: "1_6", grade: "1", subject: "فنون", title: "دوسيه + الوان بندا + الوان خشب + مقص + دبق + دفتر رسم", author: "", year: "", notes: "" },

  // الصف الثاني
  { id: "2_1", grade: "2", subject: "اللغة العربية", title: "الغيث 1+2+3", author: "وئام وتد", year: "2017", notes: "الرجاء شراء جميع أجزاء الكتب من بداية السنة" },
  { id: "2_2", grade: "2", subject: "رياضيات", title: "الوسام جزء 1,2,3", author: "د.احمد هيبي", year: "طبعه الجديدة", notes: "الرجاء شراء جميع أجزاء الكتب من بداية السنة" },
  { id: "2_3", grade: "2", subject: "دين", title: "الكوثر دروس في تعليم الدين والتربية الاسلامية", author: "احمد وتد", year: "2019", notes: "" },
  { id: "2_4", grade: "2", subject: "علوم وتكنولوجيا", title: "الكنز في العلوم والتكنولوجيا", author: "احمد هيبي محمود منصور", year: "2018", notes: "" },
  { id: "2_5", grade: "2", subject: "موطن", title: "احبك موطني", author: "د. محمد حمزة", year: "2023", notes: "" },
  { id: "2_6", grade: "2", subject: "اللغة العبرية", title: "מדברים בעברית", author: "מט\"ח", year: "2018", notes: "" },
  { id: "2_7", grade: "2", subject: "فنون", title: "دوسيه + الوان بندا + الوان خشب + مقص + دبق + دفتر رسم", author: "", year: "", notes: "" },

  // الصف الثالث
  { id: "3_1", grade: "3", subject: "اللغة العربية", title: "الغيث الأجزاء 1,2", author: "وئام وتد", year: "2018", notes: "الرجاء شراء جميع أجزاء الكتب من بداية السنة" },
  { id: "3_2", grade: "3", subject: "رياضيات", title: "الوسام الجزء 1+2+3", author: "د. احمد هيبي", year: "طبعة جديدة", notes: "الرجاء شراء جميع أجزاء الكتب من بداية السنة" },
  { id: "3_3", grade: "3", subject: "دين", title: "الكوثر دروس في تعليم الدين والتربية الاسلامية", author: "احمد وتد", year: "2019", notes: "" },
  { id: "3_4", grade: "3", subject: "علوم وتكنولوجيا", title: "الكنز في العلوم والتكنولوجيا", author: "احمد هيبي محمود منصور", year: "2017", notes: "" },
  { id: "3_5", grade: "3", subject: "اللغة العبرية", title: "מדברים בעברית", author: "מט\"ח", year: "2018", notes: "" },
  { id: "3_6", grade: "3", subject: "اللغة الانجليزية", title: "Epic كتاب وكراس (تجريبي)", author: "English Adventure", year: "2022", notes: "" },
  { id: "3_7", grade: "3", subject: "موطن", title: "احبك موطني", author: "د. محمد حمزه", year: "2023", notes: "" },
  { id: "3_8", grade: "3", subject: "فنون", title: "دوسيه + الوان بندا + الوان خشب + مقص + دبق ودفتر رسم", author: "", year: "", notes: "" },

  // الصف الرابع
  { id: "4_1", grade: "4", subject: "اللغة العربية", title: "الفينيق", author: "احمد هيبي", year: "", notes: "" },
  { id: "4_2", grade: "4", subject: "رياضيات", title: "مسارات زائد الجزء10,11+ كتاب الهندسة", author: "מט\"ח", year: "", notes: "" },
  { id: "4_3", grade: "4", subject: "دين", title: "الكوثر دروس في تعليم الدين والتربية الإسلامية", author: "احمد وتد", year: "2019", notes: "" },
  { id: "4_4", grade: "4", subject: "علوم وتكنولوجيا", title: "العلوم والتكنولوجيا بنظرة جديدة", author: "جامعة تل ابيب", year: "2017", notes: "" },
  { id: "4_5", grade: "4", subject: "اللغة العبرية", title: "אופק לעתיد", author: "מרכז אתראא", year: "2017", notes: "" },
  { id: "4_6", grade: "4", subject: "اللغة الانجليزية", title: "Legendary كتاب وكراس (تجريبي)", author: "English Adventure", year: "2023", notes: "" },
  { id: "4_7", grade: "4", subject: "موطن", title: "احبك موطني", author: "د. محمد حمزة", year: "2023", notes: "" },
  { id: "4_8", grade: "4", subject: "فنون", title: "دوسيه + الوان بندا + الوان خشب + مقص + دبق ودفتر رسم", author: "", year: "", notes: "" },

  // الصف الخامس
  { id: "5_1", grade: "5", subject: "اللغة العربية", title: "الفينيق", author: "احمد هيبي", year: "", notes: "" },
  { id: "5_2", grade: "5", subject: "رياضيات", title: "مسارات زائد جزء13,14 + كتاب الهندسة", author: "מט\"ח", year: "", notes: "" },
  { id: "5_3", grade: "5", subject: "دين", title: "الكوثر دروس في تعليم الدين والتربية الاسلامية", author: "احمد وتد", year: "2019", notes: "" },
  { id: "5_4", grade: "5", subject: "علوم وتكنولوجيا", title: "العلوم والتكنولوجيا بنظرة جديدة", author: "جامعة تل ابيب", year: "2017", notes: "" },
  { id: "5_5", grade: "5", subject: "اللغة العبرية", title: "אופק לעתיد", author: "מרכז אתראא", year: "2020", notes: "" },
  { id: "5_6", grade: "5", subject: "اللغة الانجليزية", title: "Magical الكتاب والكراس", author: "Dr. Yael Bejarano", year: "2026", notes: "" },
  { id: "5_7", grade: "5", subject: "جغرافيا", title: "الخريطة والانسان", author: "د. محمد حمزة وعامر مريسات", year: "2022", notes: "" },
  { id: "5_8", grade: "5", subject: "حذر", title: "المسار", author: "د. احمد هيبي", year: "", notes: "" },
  { id: "5_9", grade: "5", subject: "فنون", title: "دوسيه + الوان بندا + الوان خشب + مقص + دبق + دفتر رسم", author: "", year: "", notes: "" },

  // الصف السادس
  { id: "6_1", grade: "6", subject: "اللغة العربية", title: "الفينيق", author: "احمد هيبي", year: "", notes: "" },
  { id: "6_2", grade: "6", subject: "رياضيات", title: "مسارات زائد الاجزاء16,17+كتاب الهندسة", author: "מט\"ח", year: "", notes: "" },
  { id: "6_3", grade: "6", subject: "دين", title: "الكوثر دروس في تعليم الدين والتربية الاسلامية", author: "احمد وتد", year: "2019", notes: "" },
  { id: "6_4", grade: "6", subject: "علوم وتكنولوجيا", title: "العلوم والتكنولوجيا بنظرة جديدة", author: "جامعة تل ابيب", year: "2017", notes: "" },
  { id: "6_5", grade: "6", subject: "اللغة العبرية", title: "אופק לעתיد", author: "מרכז אתראא", year: "", notes: "" },
  { id: "6_6", grade: "6", subject: "اللغة الانجليزية", title: "Ready الكتاب والكراس طبعة تجريبية", author: "Dr. Yael Bejarano", year: "", notes: "" },
  { id: "6_7", grade: "6", subject: "جغرافيا", title: "البيئة والانسان", author: "د.محمد حمزة وعامر مريسات", year: "2022", notes: "" },
  { id: "6_8", grade: "6", subject: "تاريخ", title: "الاثر الجديد", author: "د.احمد هيبي", year: "2026", notes: "" },
  { id: "6_9", grade: "6", subject: "فنون", title: "دوسيه + الوان بندا + الوان خشب + مقص + دبق + دفتر رسم", author: "", year: "", notes: "" }
];
