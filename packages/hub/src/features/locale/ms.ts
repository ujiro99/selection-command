import { SORT_ORDER, OPEN_MODE } from "@/const"
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from "@/const"

const lang = {
  name: "Bahasa Melayu",
  shorName: "ms",
  languageName: "Malay",
  errorPage: {
    error: "Ralat telah berlaku semasa menghantar.",
    afterShortTime: "Sila cuba sebentar lagi.",
  },
  commandShare: {
    title: "Kongsi Arahan",
    formTitle: "Borang Kongsi Arahan",
  },
  tagPicker: {
    notFound: "Tidak dijumpai",
    create: "Buat?",
  },
  inputForm: {
    title: {
      label: "Tajuk",
      description: "Akan dipaparkan sebagai tajuk arahan.",
      placeholder: "Tajuk arahan",
      message: {
        min3: "Tajuk minimum 3 aksara.",
        max100: "Tajuk maksimum 100 aksara.",
      },
    },
    searchUrl: {
      label: "URL Carian",
      description: "Ganti `%s` dengan teks yang dipilih.",
      placeholder: "URL Carian",
      faviconAlt: "Favicon URL carian",
      message: {
        url: "Format URL tidak sah.",
        unique: "Sudah didaftarkan.",
      },
    },
    description: {
      label: "Penerangan Arahan",
      description: "Akan dipaparkan sebagai penerangan arahan.",
      placeholder: "Penerangan arahan",
      message: {
        max200: "Penerangan maksimum 200 aksara.",
      },
    },
    tags: {
      label: "Tag",
      description: "Akan dipaparkan sebagai klasifikasi arahan.",
      message: {
        max5: "Tag mestilah maksimum 20 aksara.",
        max20: "Maksimum 5 tag dibenarkan.",
      },
    },
    iconUrl: {
      label: "URL Ikon",
      description: "Akan dipaparkan sebagai ikon dalam menu.",
      placeholder: "URL Ikon",
      message: {
        url: "Format URL tidak sah.",
      },
    },
    openMode: {
      label: "Mod Buka",
      description: "Kaedah paparan hasil.",
      options: {
        [OPEN_MODE.POPUP]: "Popup",
        [OPEN_MODE.WINDOW]: "Tetingkap",
        [OPEN_MODE.TAB]: "Tab",
        [OPEN_MODE.BACKGROUND_TAB]: "Tab Latar Belakang",
        [OPEN_MODE.PAGE_ACTION]: "Tindakan Halaman",
      },
    },
    openModeSecondary: {
      label: "Ctrl + Klik",
      description: "Kaedah paparan hasil semasa Ctrl + Klik.",
    },
    spaceEncoding: {
      label: "Pengekodan Ruang",
      description: "Menggantikan ruang dalam teks yang dipilih.",
      options: {
        plus: "Plus(+)",
        percent: "Percent(%20)",
      },
    },
    formDescription: "Meminta perkongsian arahan.",
    formOptions: "Pilihan",
    confirm: "Sahkan Input",
    pageAction: {
      label: "Tindakan Halaman",
      description: "Operasi yang akan dijalankan",
    },
    PageActionOption: {
      startUrl: {
        label: "URL Halaman Mula",
        description: "URL halaman di mana tindakan halaman akan bermula.",
        faviconAlt: "Favicon URL halaman mula",
      },
      openMode: {
        label: "Kaedah Paparan Tetingkap",
        description: "Bagaimana tetingkap dipaparkan.",
      },
    },
  },
  confirmForm: {
    formDescription: "Adakah maklumat di bawah ini betul?",
    caution:
      "※ Maklumat yang dihantar akan diterbitkan di laman web ini.\nSila jangan kongsi maklumat peribadi atau sulit.",
    back: "Edit",
    submit: "Kongsi",
  },
  SendingForm: {
    sending: "Menghantar...",
  },
  completeForm: {
    formDescription: "Penghantaran selesai.",
    thanks:
      "Terima kasih kerana berkongsi arahan anda!\nIa mungkin mengambil masa 2-3 hari untuk pembangun mencerminkan di laman web.\nSila tunggu sehingga diterbitkan.",
    aboudDelete:
      "Untuk meminta penghapusan selepas penghantaran, gunakan pautan di bawah.",
    supportHub: "Pergi ke Hub Sokongan",
  },
  errorForm: {
    formDescription: "Ralat telah berlaku semasa menghantar...",
    message:
      "Sila cuba sebentar lagi atau hubungi pembangun melalui pautan di bawah.",
    supportHub: "Pergi ke Hub Sokongan",
  },
  notFound: {
    title: "Halaman Tidak Dijumpai",
    message: "Halaman yang anda cuba akses tidak wujud.\nSila semak URL.",
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: "URL Carian",
    [SORT_ORDER.title]: "Tajuk",
    [SORT_ORDER.download]: "Muat Turun",
    [SORT_ORDER.star]: "Bintang",
    [SORT_ORDER.addedAt]: "Tarikh Pendaftaran",
    new: "Baru",
    old: "Lama",
  },
  about: {
    terms: "Terma Penggunaan",
    privacy: "Dasar Privasi",
    cookie: "Dasar Kuki",
  },
  cookieConsent: {
    title: "Mengenai Penggunaan Kuki",
    message:
      "Laman web ini menggunakan kuki untuk memberikan pengalaman yang lebih baik. Lihat Dasar Kuki kami untuk maklumat lanjut.",
    accept: "Terima",
    decline: "Tolak",
  },
  uninstallForm: {
    title: "Penyahpasangan Selesai.",
    description:
      "Terima kasih kerana menggunakan Selection Command sehingga kini. Sayang sekali anda pergi, tetapi untuk meningkatkan sambungan pada masa hadapan, kami akan berterima kasih jika anda boleh menjawab tinjauan di bawah.",
    reinstall:
      "Jika anda menyahpasang secara tidak sengaja, anda boleh memasang semula melalui pautan di bawah.",
    wantedToUseTitle: "Ciri apa yang anda mahu gunakan? (pilihan berganda)",
    wantedToUsePlaceholder: "Sila beritahu kami apa yang anda mahu lakukan",
    reasonTitle: "Mengapa anda menyahpasang? (Pilihan berganda)",
    otherReasonPlaceholder: "Sila nyatakan sebabnya",
    detailsTitle: "Jika boleh, sila berikan lebih banyak butiran.",
    detailsPlaceholder:
      "Butiran sebab penyahpasangan,\nApa yang anda mahu lakukan atau apa yang sukar,\nLaman web di mana ia tidak berfungsi, dll.",
    submit: "Hantar",
    submitting: "Menghantar...",
    success: {
      title: "Tinjauan berjaya dihantar.",
      message:
        "Terima kasih atas respons anda. Kami menghargai maklum balas berharga anda.\nJika anda mempunyai maklum balas selain daripada borang ini, sila hubungi takeda.yujiro@gmail.com dengan subjek yang jelas.",
    },
    error: "Gagal menghantar. Sila cuba sebentar lagi.",
    wantedToUse: {
      search_selected_text: "Mencari teks yang dipilih",
      ai_chatbot: "Chatbot AI (seperti ChatGPT)",
      link_preview: "Pratonton pautan",
      [OTHER_OPTION]: "Lain-lain",
    },
    reasons: {
      difficult_to_use: "Tidak tahu cara menggunakannya",
      not_user_friendly: "Tidak mesra pengguna",
      not_working: "Tidak berfungsi seperti yang dijangkakan",
      missing_features: "Ciri-ciri yang diperlukan tiada",
      too_many_permissions: "Memerlukan terlalu banyak kebenaran",
      found_better: "Menemui alternatif yang lebih baik",
      no_longer_needed: "Tidak diperlukan lagi",
      language_not_supported: "Bahasa tidak disokong",
      search_engine_is_not_available:
        "Enjin carian yang dikehendaki tidak tersedia",
      i_dont_know_how_to_add_commands: "Tidak tahu cara menambah arahan",
      settings_are_complicated: "Tetapan terlalu rumit",
      [UNINSTALL_OTHER_OPTION]: "Lain-lain",
    },
  },
}
export default lang
