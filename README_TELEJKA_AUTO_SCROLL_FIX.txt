TELEJKA TEST — AUTO SCROLL FIX V3

Qo‘shilgan o‘zgarish:
- Kategoriya/test kartasi tanlanganda sahifa avtomatik ravishda pastdagi "Savollar sonini tanlang" va "Testni boshlash" qismiga silliq scroll qiladi.
- Javob tanlanganda izoh/manba chiqishi saqlangan.
- Telejka test bazasi 67 ta savol bilan saqlangan.

GitHubga joylash:
1) category-tests.html faylini eski fayl o‘rniga almashtiring.
2) category-tests.js faylini eski fayl o‘rniga almashtiring.
3) data/telejka-tests-data.js faylini data papkasida qoldiring yoki yangilang.
4) Commit qiling.
5) GitHub Pages ochilgandan keyin Ctrl + F5 bosing.

O‘zgartirilgan asosiy joy:
category-tests.js ichida scrollToStartControls() funksiyasi qo‘shildi va category radio change eventiga ulandi.
