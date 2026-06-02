G‘ILDIRAK JUFTLIGI PLATFORMASI — UMUMIY REYTINGLI TEST MODULI

Ushbu ZIP mavjud GitHub repo ustiga qo‘shiladigan tayyor moduldir.
Mavjud data/category-tests-data.js fayli o‘zgartirilmaydi, chunki umumiy reytingli test aynan shu fayldagi barcha kategoriya savollarini avtomatik yig‘adi.

QO‘SHILGAN / ALMASHTIRILADIGAN FAYLLAR:
1) ranked-test.html        — yangi umumiy reytingli test oynasi
2) ranked-test.css         — reytingli test dizayni
3) ranked-test.js          — profil, test, vaqt, reyting, localStorage/Supabase logikasi
4) supabase-config.js      — Supabase keyingi bosqich konfiguratsiyasi
5) category-tests.html     — testlar bo‘limi tepasiga “Umumiy reytingli savollar” kartasi qo‘shilgan tayyor fayl
6) supabase/SUPABASE_SCHEMA.sql — keyingi bosqichda Supabase jadval yaratish SQL fayli

O‘RNATISH:
1) ZIP faylni oching.
2) Ichidagi fayllarni GitHub repo ildiziga tashlang.
3) category-tests.html faylini almashtirishga ruxsat bering.
4) Mavjud data/category-tests-data.js faylini O‘CHIRMANG.
5) GitHub’ga commit qiling.
6) GitHub Pages ochilgach: category-tests.html -> Umumiy reytingli savollar tugmasini bosing.

HOZIRGI HOLAT:
- Supabase enabled=false bo‘lgani uchun natijalar localStorage’da ishlaydi.
- Test UI, profil, vaqt, reyting hisoblash, savollarni aralashtirish tayyor.
- Supabase ulanganidan keyin telefon+PIN orqali bir odam telefon va kompyuterdan kirganda bitta profil bo‘lib ishlaydi.

SUPABASE KEYINGI BOSQICH:
1) Supabase loyiha ochiladi.
2) supabase/SUPABASE_SCHEMA.sql SQL Editor’da ishga tushiriladi.
3) supabase-config.js ichida enabled=true, url va anonKey qo‘yiladi.
4) Keyin umumiy reyting barcha qurilmada ko‘rinadi.

ESLATMA:
Agar butun repoga emas, alohida fayl sifatida yuklasangiz, data/category-tests-data.js albatta repo ichida qolishi kerak.


2026-06 YANGILANISH:
1) Umumiy reytingli testda 20/30/50/Barchasi tanlash joyi olib tashlandi.
2) Test avtomatik bazadagi barcha savollar bilan boshlanadi.
3) Reyting jadvali profil ichida emas, alohida ommaviy blok sifatida yon tomonda ko‘rinadi.
4) Jadvalda har bir telefon raqam uchun faqat eng yaxshi natija ko‘rinadi.
5) Yangi natija oldingidan yaxshi bo‘lsa, eski natija avtomatik yangilanadi. Yomonroq natija reytingni buzmaydi.
6) Mavjud Supabase bazani tozalash uchun supabase/BEST_RESULT_ONLY_UPDATE.sql faylini SQL Editor’da bir marta Run qiling.
