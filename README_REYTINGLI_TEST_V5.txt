V5 yangilanish: Kirish va profil yaratish alohida qilindi

GitHub'ga almashtiriladigan fayllar:
- ranked-test.html
- ranked-test.js
- ranked-test.css
- category-tests.html
- ranked-entry.css

Muhim:
- supabase-config.js fayliga tegmang. Unda Supabase URL va publishable key turadi.
- Supabase SQL'ni qayta ishga tushirish shart emas, agar V4 dagi BEST_RESULT_BY_COUNT_UPDATE.sql allaqachon Run qilingan bo'lsa.

Nima o'zgardi:
1) Oldin ro'yxatdan o'tgan xodim boshqa telefon yoki kompyuterdan kirsa, barcha ma'lumotlarni qayta to'ldirmaydi.
2) Faqat telefon raqam va o'zi oldin qo'ygan 4 xonali PIN bilan kiradi.
3) Yangi profil yaratish alohida blokga chiqarildi.
4) Profil yaratish faqat birinchi marta ishlatiladi.
5) Agar telefon raqam oldin ro'yxatdan o'tgan bo'lsa, yangi profil yaratishda xabar chiqadi va yuqoridagi Kirish bo'limidan kirish so'raladi.
6) PIN aniq 4 ta raqam bo'lishi shart qilindi.

Tekshirish:
1) Saytga telefon orqali kiring.
2) Yangi profil yarating.
3) Test yeching.
4) Boshqa qurilmadan ranked-test.html oching.
5) Faqat telefon + 4 xonali PIN yozing.
6) O'sha profil va reyting ochilishi kerak.
