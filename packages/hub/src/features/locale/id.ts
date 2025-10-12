import { SORT_ORDER, OPEN_MODE } from "@/const"
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from "@/const"

const lang = {
  name: "Bahasa Indonesia",
  shorName: "id",
  languageName: "Indonesian",
  errorPage: {
    error: "Terjadi kesalahan saat mengirim.",
    afterShortTime: "Silakan coba lagi nanti.",
  },
  commandShare: {
    title: "Bagikan Perintah",
    formTitle: "Formulir Berbagi Perintah",
  },
  tagPicker: {
    notFound: "Tidak ditemukan",
    create: "Buat?",
  },
  inputForm: {
    title: {
      label: "Judul",
      description: "Akan ditampilkan sebagai judul perintah.",
      placeholder: "Judul perintah",
      message: {
        min3: "Judul minimal 3 karakter.",
        max100: "Judul maksimal 100 karakter.",
      },
    },
    searchUrl: {
      label: "URL Pencarian",
      description: "Mengganti `%s` dengan teks yang dipilih.",
      placeholder: "URL Pencarian",
      faviconAlt: "Favicon URL pencarian",
      message: {
        url: "Format URL tidak valid.",
        unique: "Sudah terdaftar.",
      },
    },
    description: {
      label: "Deskripsi Perintah",
      description: "Akan ditampilkan sebagai deskripsi perintah.",
      placeholder: "Deskripsi perintah",
      message: {
        max200: "Deskripsi maksimal 200 karakter.",
      },
    },
    tags: {
      label: "Tag",
      description: "Akan ditampilkan sebagai klasifikasi perintah.",
      message: {
        max5: "Tag maksimal 20 karakter.",
        max20: "Maksimal 5 tag.",
      },
    },
    iconUrl: {
      label: "URL Ikon",
      description: "Akan ditampilkan sebagai ikon di menu.",
      placeholder: "URL Ikon",
      message: {
        url: "Format URL tidak valid.",
      },
    },
    openMode: {
      label: "Mode Buka",
      description: "Metode tampilan hasil.",
      options: {
        [OPEN_MODE.POPUP]: "Popup",
        [OPEN_MODE.WINDOW]: "Jendela",
        [OPEN_MODE.TAB]: "Tab",
        [OPEN_MODE.BACKGROUND_TAB]: "Tab Latar Belakang",
        [OPEN_MODE.PAGE_ACTION]: "Aksi Halaman",
      },
    },
    openModeSecondary: {
      label: "Ctrl + Klik",
      description: "Metode tampilan hasil saat Ctrl + Klik.",
    },
    spaceEncoding: {
      label: "Pengkodean Spasi",
      description: "Mengganti spasi dalam teks yang dipilih.",
      options: {
        plus: "Plus(+)",
        percent: "Percent(%20)",
      },
    },
    formDescription: "Meminta berbagi perintah.",
    formOptions: "Opsi",
    confirm: "Konfirmasi Masukan",
    pageAction: {
      label: "Aksi Halaman",
      description: "Operasi yang akan dijalankan",
    },
    PageActionOption: {
      startUrl: {
        label: "URL Halaman Awal",
        description: "URL halaman di mana tindakan halaman akan dimulai.",
        faviconAlt: "Favicon URL halaman awal",
      },
      openMode: {
        label: "Metode Tampilan Jendela",
        description: "Cara jendela ditampilkan.",
      },
    },
  },
  confirmForm: {
    formDescription: "Apakah informasi di bawah ini sudah benar?",
    caution:
      "※ Informasi yang dikirim akan dipublikasikan di situs ini.\nMohon jangan bagikan informasi pribadi atau rahasia.",
    back: "Edit",
    submit: "Bagikan",
  },
  SendingForm: {
    sending: "Mengirim...",
  },
  completeForm: {
    formDescription: "Pengiriman selesai.",
    thanks:
      "Terima kasih telah berbagi perintah Anda!\nMungkin perlu 2-3 hari bagi pengembang untuk mencerminkan di situs.\nMohon tunggu hingga dipublikasikan.",
    aboudDelete:
      "Untuk meminta penghapusan setelah pengiriman, gunakan tautan di bawah.",
    supportHub: "Pergi ke Hub Dukungan",
  },
  errorForm: {
    formDescription: "Terjadi kesalahan saat mengirim...",
    message:
      "Silakan coba lagi nanti atau hubungi pengembang melalui tautan di bawah.",
    supportHub: "Pergi ke Hub Dukungan",
  },
  notFound: {
    title: "Halaman Tidak Ditemukan",
    message: "Halaman yang Anda coba akses tidak ada.\nSilakan periksa URL.",
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: "URL Pencarian",
    [SORT_ORDER.title]: "Judul",
    [SORT_ORDER.download]: "Unduhan",
    [SORT_ORDER.star]: "Bintang",
    [SORT_ORDER.addedAt]: "Tanggal Pendaftaran",
    new: "Baru",
    old: "Lama",
  },
  about: {
    terms: "Ketentuan Penggunaan",
    privacy: "Kebijakan Privasi",
    cookie: "Kebijakan Cookie",
  },
  cookieConsent: {
    title: "Tentang Penggunaan Cookie",
    message:
      "Situs ini menggunakan cookie untuk memberikan pengalaman yang lebih baik. Lihat Kebijakan Cookie kami untuk detail lebih lanjut.",
    accept: "Terima",
    decline: "Tolak",
  },
  uninstallForm: {
    title: "Pencopotan Selesai.",
    description:
      "Terima kasih telah menggunakan Selection Command sampai sekarang. Sayang sekali Anda pergi, tetapi untuk meningkatkan ekstensi di masa depan, kami akan berterima kasih jika Anda dapat menjawab survei di bawah ini.",
    reinstall:
      "Jika Anda mencopot secara tidak sengaja, Anda dapat menginstal ulang melalui tautan di bawah.",
    wantedToUseTitle: "Fitur apa yang ingin Anda gunakan? (pilihan ganda)",
    wantedToUsePlaceholder: "Silakan beritahu kami apa yang ingin Anda lakukan",
    reasonTitle: "Mengapa Anda mencopot? (Pilihan ganda)",
    otherReasonPlaceholder: "Silakan tentukan alasannya",
    detailsTitle: "Jika memungkinkan, mohon berikan detail lebih lanjut.",
    detailsPlaceholder:
      "Detail alasan pencopotan,\nApa yang ingin Anda lakukan atau apa yang sulit,\nSitus di mana tidak berfungsi, dll.",
    submit: "Kirim",
    submitting: "Mengirim...",
    success: {
      title: "Survei berhasil dikirim.",
      message:
        "Terima kasih atas tanggapan Anda. Kami menghargai umpan balik berharga Anda.\nJika Anda memiliki umpan balik lebih lanjut selain formulir ini, silakan hubungi takeda.yujiro@gmail.com dengan subjek yang jelas.",
    },
    error: "Gagal mengirim. Silakan coba lagi nanti.",
    wantedToUse: {
      search_selected_text: "Mencari teks yang dipilih",
      ai_chatbot: "Chatbot AI (seperti ChatGPT)",
      link_preview: "Pratinjau tautan",
      [OTHER_OPTION]: "Lainnya",
    },
    reasons: {
      difficult_to_use: "Tidak tahu cara menggunakannya",
      not_user_friendly: "Tidak ramah pengguna",
      not_working: "Tidak berfungsi seperti yang diharapkan",
      missing_features: "Fitur yang diperlukan tidak ada",
      too_many_permissions: "Terlalu banyak izin yang diperlukan",
      found_better: "Menemukan alternatif yang lebih baik",
      no_longer_needed: "Tidak diperlukan lagi",
      language_not_supported: "Bahasa tidak didukung",
      search_engine_is_not_available:
        "Mesin pencari yang diinginkan tidak tersedia",
      i_dont_know_how_to_add_commands: "Tidak tahu cara menambah perintah",
      settings_are_complicated: "Pengaturan terlalu rumit",
      [UNINSTALL_OTHER_OPTION]: "Lainnya",
    },
  },
}
export default lang
