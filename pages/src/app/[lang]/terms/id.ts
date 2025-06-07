import { HUB_URL } from '@/const'

const msg = `
Ketentuan Layanan ini (selanjutnya disebut "Ketentuan") menetapkan kondisi untuk menggunakan "Selection Command Hub" (selanjutnya disebut "Layanan") yang disediakan oleh Operator (selanjutnya disebut "kami"). Harap baca Ketentuan ini dengan seksama sebelum menggunakan Layanan. Dengan menggunakan Layanan, Anda dianggap telah menyetujui Ketentuan ini.

## 1. Penerapan
1. Ketentuan ini berlaku untuk semua hubungan antara kami dan pengguna terkait penggunaan Layanan.
2. Setiap aturan atau pedoman yang ditetapkan secara terpisah oleh kami terkait Layanan akan menjadi bagian dari Ketentuan ini.

## 2. Deskripsi Layanan
1. Layanan terkait dengan ekstensi Chrome "Selection Command" dan menyediakan fungsionalitas berikut:
   - Kemampuan bagi pengguna untuk memposting perintah (selanjutnya disebut "Data yang Diposting").
   - Kemampuan bagi pengguna untuk melihat dan mengambil perintah yang diposting oleh pengguna lain.
2. Data yang Diposting mencakup informasi berikut:
   - Judul halaman web.
   - URL halaman web.
   - Ikon halaman web.
   - Deskripsi dan klasifikasi perintah.
   - Informasi lain yang diperlukan untuk menampilkan halaman web.
3. Layanan tidak memerlukan pendaftaran pengguna dan dapat digunakan secara anonim.

## 3. Perilaku yang Dilarang
Pengguna dilarang melakukan aktivitas berikut saat menggunakan Layanan:
- Tindakan yang melanggar hukum atau ketertiban umum dan moral.
- Tindakan yang melanggar hak orang lain (misalnya, hak cipta, merek dagang, hak privasi).
- Memberikan informasi palsu, tidak akurat, atau berbahaya sebagai Data yang Diposting.
- Tindakan yang menyebabkan kerusakan pada Layanan atau pengguna lain.
- Tindakan lain yang kami anggap tidak pantas.

## 4. Penanganan Data yang Diposting
1. Pengguna sepenuhnya bertanggung jawab atas Data yang Diposting mereka. Setelah Data yang Diposting dikirimkan, tidak dapat diubah atau dihapus, jadi harap berhati-hati saat memposting konten.
2. Kami berhak untuk menghapus atau membuat Data yang Diposting menjadi pribadi jika diperlukan, tetapi tidak berkewajiban untuk melakukannya.
3. Jika pihak ketiga mengajukan klaim pelanggaran hak terkait Data yang Diposting, kami dapat memodifikasi atau menghapus data tersebut atas kebijaksanaan kami.
4. Reproduksi, duplikasi, atau penggunaan Data yang Diposting atau bagian dari Layanan yang tidak sah untuk tujuan selain menggunakan Layanan dilarang.

## 5. Hak Kekayaan Intelektual dan Izin Penggunaan
1. Semua hak kekayaan intelektual terkait Layanan adalah milik kami atau pemilik yang sah.
2. Pengguna mempertahankan kepemilikan Data yang Diposting mereka tetapi dianggap memberikan izin untuk digunakan oleh pihak lain dalam keadaan berikut:
   - Pengguna lain dapat melihat, mengambil, menggunakan, mengedit, dan mendistribusikan kembali Data yang Diposting dalam lingkup Layanan.
   - Kami dapat menggunakan, mempublikasikan, mengedit, dan mendistribusikan Data yang Diposting sesuai kebutuhan untuk mengoperasikan Layanan.

## 6. Penafian
1. Kami tidak menjamin bahwa Layanan akan memenuhi tujuan tertentu, memberikan kegunaan, atau memastikan keamanan bagi pengguna.
2. Kami tidak bertanggung jawab atas kerusakan atau sengketa yang timbul dari Data yang Diposting atau isinya.
3. Kami juga tidak bertanggung jawab atas kerusakan yang diakibatkan oleh gangguan atau penghentian Layanan.

## 7. Kebijakan Privasi
1. Penanganan informasi pribadi dan cookie terkait penggunaan layanan ini akan diatur oleh Kebijakan Privasi yang ditetapkan secara terpisah oleh kami.
2. Untuk detailnya, silakan lihat halaman berikut:
   - [Kebijakan Privasi](${HUB_URL}/id/privacy)

## 8. Penangguhan dan Pembatasan
1. Jika pengguna melanggar Ketentuan ini, kami dapat membatasi akses atau menangguhkan penggunaan Layanan mereka tanpa pemberitahuan sebelumnya.

## 9. Perubahan dan Pengakhiran
1. Kami berhak untuk mengubah atau mengakhiri Ketentuan ini dan/atau konten Layanan tanpa pemberitahuan sebelumnya.
2. Penggunaan Layanan yang berkelanjutan setelah perubahan dilakukan dianggap sebagai penerimaan Ketentuan baru.

## 10. Kontak Dukungan
Untuk pertanyaan atau permintaan dukungan terkait Layanan ini, silakan hubungi kami melalui:
- [Halaman Dukungan Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

## 11. Hukum yang Berlaku dan Yurisdiksi
1. Ketentuan ini akan diatur oleh hukum Jepang.
2. Dalam hal sengketa yang timbul dari Ketentuan ini atau Layanan, yurisdiksi eksklusif akan berada di pengadilan Jepang.

Berlaku mulai 01/10/2025
`
export default msg
