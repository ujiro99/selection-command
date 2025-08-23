import { HUB_URL } from "@/const"

const msg = `
Dasar Privasi ini menerangkan bagaimana maklumat pengguna dikendalikan dalam Selection Command Hub (selepas ini dirujuk sebagai "Perkhidmatan"). Dengan menggunakan Perkhidmatan, anda dianggap telah bersetuju dengan Dasar Privasi ini.

## **1. Maklumat yang Dikumpul**

Perkhidmatan mengumpul jenis maklumat berikut:

### **1-1. Maklumat Arahan yang Dihantar oleh Pengguna**
Perkhidmatan mengumpul maklumat arahan yang dihantar oleh pengguna (contohnya, nama arahan, URL, penerangan).  
Untuk butiran tetapan, sila rujuk [Terma Perkhidmatan](${HUB_URL}/ms/terms).  
*Nota: Maklumat ini hanya digunakan apabila pengguna menghantar atau mengambil data dalam Perkhidmatan.*

### **1-2. Data Penggunaan**
Perkhidmatan menggunakan Google Analytics untuk mengumpul data penggunaan yang dianonimkan. Data ini termasuk:
- Sejarah interaksi (contohnya, peralihan halaman, lokasi dan bilangan klik)
- Maklumat peranti (contohnya, jenis pelayar, sistem pengendalian)
- Cap masa akses
- Alamat IP sumber (diproses untuk anonimisasi)
- Data statistik anonim lain yang disediakan oleh Google Analytics

### **1-3. Pengumpulan Maklumat Peribadi**
Oleh kerana Perkhidmatan tidak menyediakan fungsi pendaftaran atau log masuk pengguna, ia tidak mengumpul sebarang maklumat yang boleh dikenal pasti secara peribadi (contohnya, nama, alamat e-mel, alamat fizikal).

## **2. Tujuan Penggunaan Maklumat**

Maklumat yang dikumpul digunakan untuk tujuan berikut:
1. Menganalisis dan meningkatkan penggunaan Perkhidmatan
2. Menyediakan ciri-ciri yang diperlukan untuk mengendalikan Perkhidmatan

## **3. Pengurusan Maklumat**

Perkhidmatan menguruskan maklumat yang dikumpul dengan sewajarnya untuk mencegah akses tanpa kebenaran atau pelanggaran data. Data yang dikumpul melalui Google Analytics dikendalikan mengikut [Dasar Privasi Google](https://www.google.com/analytics/terms/us.html).

## **4. Penyediaan kepada Pihak Ketiga**

Perkhidmatan tidak menyediakan maklumat yang dikumpul kepada pihak ketiga kecuali jika dikehendaki oleh undang-undang. Walau bagaimanapun, data yang dikumpul melalui Google Analytics diproses oleh Google.

## **5. Penggunaan Kuki**

Perkhidmatan menggunakan kuki melalui Google Analytics. Kuki disimpan dalam pelayar pengguna dan digunakan untuk meningkatkan fungsi dan menganalisis tingkah laku pengguna dalam Perkhidmatan. Pengguna boleh melumpuhkan kuki melalui tetapan pelayar mereka; walau bagaimanapun, beberapa ciri mungkin tidak berfungsi dengan baik sebagai akibatnya.

## **6. Perubahan pada Dasar Privasi**

Dasar Privasi ini mungkin dikemas kini mengikut keperluan. Dasar yang disemak akan berkuat kuasa selepas diterbitkan di halaman ini.

## **7. Maklumat Hubungan**

Untuk pertanyaan mengenai Dasar Privasi ini, sila hubungi kami melalui:
- [Halaman Sokongan Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

Berkuat kuasa mulai 01/10/2025
`
export default msg
