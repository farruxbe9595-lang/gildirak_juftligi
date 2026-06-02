G‘ildirak juftligi — Umumiy reytingli test V4

O‘zgarishlar:
1) Test va natija oynalarida katta yuqori banner yashirildi, sahifa ekranga ixcham moslashadi.
2) Profil/start/reyting bloklari kompaktlashtirildi.
3) Natija endi foiz emas, to‘g‘ri javoblar soni bo‘yicha ko‘rsatiladi: masalan, "2 ta", "15 ta".
4) Reyting saralashi ham foizga emas, to‘g‘ri javoblar soniga asoslanadi:
   - to‘g‘ri javob ko‘p bo‘lsa yuqoriroq;
   - teng bo‘lsa vaqt tezroq bo‘lsa yuqoriroq;
   - yana teng bo‘lsa oldinroq yakunlagan yuqoriroq.
5) Bitta noto‘g‘ri javob tanlansa test avtomatik yakunlanadi va natija saqlanadi.

GitHub’ga yuklanadigan asosiy fayllar:
- ranked-test.html
- ranked-test.js
- ranked-test.css
- category-tests.html
- ranked-entry.css

EHTIYOT BO‘LING:
- supabase-config.js faylini almashtirmang, chunki unda sizning Supabase URL va publishable key turibdi.

Supabase uchun ixtiyoriy SQL:
- supabase/BEST_RESULT_BY_COUNT_UPDATE.sql

Bu SQL avvalgi takroriy natijalarni tozalaydi va har bir telefon bo‘yicha eng yaxshi natijani to‘g‘ri javoblar soni bo‘yicha qoldiradi.
Agar bazada test natijalari allaqachon yozilgan bo‘lsa, SQL Editor’da bir marta Run qilish mumkin.
