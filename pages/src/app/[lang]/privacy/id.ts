import { HUB_URL } from '@/const'

const msg = `
Kebijakan Privasi ini menjelaskan bagaimana informasi pengguna ditangani dalam Selection Command Hub (selanjutnya disebut "Layanan"). Dengan menggunakan Layanan, Anda dianggap telah menyetujui Kebijakan Privasi ini.

## **1. Informasi yang Dikumpulkan**

Layanan mengumpulkan jenis informasi berikut:

### **1-1. Informasi Perintah yang Diposting oleh Pengguna**
Layanan mengumpulkan informasi perintah yang diposting oleh pengguna (misalnya, nama perintah, URL, deskripsi).  
Untuk detail pengaturan, silakan lihat [Ketentuan Layanan](${HUB_URL}/id/terms).  
*Catatan: Informasi ini hanya digunakan ketika pengguna memposting atau mengambil data dalam Layanan.*

### **1-2. Data Penggunaan**
Layanan menggunakan Google Analytics untuk mengumpulkan data penggunaan yang dianonimkan. Data ini meliputi:
- Riwayat interaksi (misalnya, transisi halaman, lokasi dan jumlah klik)
- Informasi perangkat (misalnya, jenis browser, sistem operasi)
- Cap waktu akses
- Alamat IP sumber (diproses untuk anonimisasi)
- Data statistik anonim lainnya yang disediakan oleh Google Analytics

### **1-3. Pengumpulan Informasi Pribadi**
Karena Layanan tidak menyediakan fitur pendaftaran atau login pengguna, tidak mengumpulkan informasi yang dapat diidentifikasi secara pribadi (misalnya, nama, alamat email, alamat fisik).

## **2. Tujuan Penggunaan Informasi**

Informasi yang dikumpulkan digunakan untuk tujuan berikut:
1. Menganalisis dan meningkatkan penggunaan Layanan
2. Menyediakan fitur yang diperlukan untuk mengoperasikan Layanan

## **3. Pengelolaan Informasi**

Layanan mengelola informasi yang dikumpulkan dengan tepat untuk mencegah akses tidak sah atau pelanggaran data. Data yang dikumpulkan melalui Google Analytics dikelola sesuai dengan [Kebijakan Privasi Google](https://www.google.com/analytics/terms/us.html).

## **4. Penyediaan kepada Pihak Ketiga**

Layanan tidak menyediakan informasi yang dikumpulkan kepada pihak ketiga kecuali jika diwajibkan oleh hukum. Namun, data yang dikumpulkan melalui Google Analytics diproses oleh Google.

## **5. Penggunaan Cookie**

Layanan menggunakan cookie melalui Google Analytics. Cookie disimpan di browser pengguna dan digunakan untuk meningkatkan fungsionalitas dan menganalisis perilaku pengguna dalam Layanan. Pengguna dapat menonaktifkan cookie melalui pengaturan browser mereka; namun, beberapa fitur mungkin tidak berfungsi dengan baik sebagai akibatnya.

## **6. Perubahan pada Kebijakan Privasi**

Kebijakan Privasi ini dapat diperbarui sesuai kebutuhan. Kebijakan yang direvisi akan berlaku setelah dipublikasikan di halaman ini.

## **7. Informasi Kontak**

Untuk pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui:
- [Halaman Dukungan Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

Berlaku mulai 01/10/2025
`
export default msg
