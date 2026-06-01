TELEJKA TEST IZOH FIX V2

Bu patch javob belgilanganidan keyin pastida "Изоҳ / манба" blokini chiqaradi.

Nima o‘zgardi:
1) category-tests.js ichida startTest() endi har bir savoldan explanation / izoh / source / note maydonini olib activeQuiz ichiga saqlaydi.
2) renderQuestion() ichida feedback blokiga izoh/manba chiqarish qo‘shildi.
3) category-tests.html dagi script/link manzillariga ?v=telejka-izoh-v2 qo‘shildi. Bu GitHub Pages va brauzer cache sabab eski JS ishlashining oldini oladi.
4) data/telejka-tests-data.js ichida 67 ta savol va har birida explanation maydoni bor.

O‘rnatish:
- category-tests.html faylini eski fayl o‘rniga almashtiring.
- category-tests.js faylini eski fayl o‘rniga almashtiring.
- data/telejka-tests-data.js faylini data papkasiga joylang.
- GitHub’da commit qiling.
- GitHub Pages ochilganda Ctrl+F5 bosing.

Muhim:
Agar sahifada telejka kategoriyasi chiqib, lekin izoh chiqmasa, demak eski category-tests.js cache orqali ishlayapti yoki category-tests.js almashtirilmagan. Shu V2 patchdagi category-tests.html cache-buster bilan shu muammoni tuzatadi.
