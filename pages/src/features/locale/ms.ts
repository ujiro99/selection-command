import { SORT_ORDER, OPEN_MODE } from '@/const'

const lang = {
  name: 'Bahasa Melayu',
  shorName: 'ms',
  languageName: 'Malay',
  errorPage: {
    error: 'Ralat telah berlaku semasa menghantar.',
    afterShortTime: 'Sila cuba sebentar lagi.',
  },
  commandShare: {
    title: 'Kongsi Arahan',
    formTitle: 'Borang Kongsi Arahan',
  },
  tagPicker: {
    notFound: 'Tidak dijumpai',
    create: 'Buat?',
  },
  inputForm: {
    title: {
      label: 'Tajuk',
      description: 'Akan dipaparkan sebagai tajuk arahan.',
      message: {
        min3: 'Tajuk mestilah sekurang-kurangnya 3 aksara.',
        max100: 'Tajuk mestilah maksimum 100 aksara.',
      },
    },
    searchUrl: {
      label: 'URL Carian',
      description: 'Menggantikan `%s` dengan teks yang dipilih.',
      message: {
        url: 'Format URL tidak sah.',
        unique: 'Sudah didaftarkan.',
      },
    },
    description: {
      label: 'Penerangan Arahan',
      description: 'Akan dipaparkan sebagai penerangan arahan.',
      message: {
        max200: 'Penerangan mestilah maksimum 200 aksara.',
      },
    },
    tags: {
      label: 'Tag',
      description: 'Akan dipaparkan sebagai klasifikasi arahan.',
      message: {
        max5: 'Tag mestilah maksimum 20 aksara.',
        max20: 'Maksimum 5 tag dibenarkan.',
      },
    },
    iconUrl: {
      label: 'URL Ikon',
      description: 'Akan dipaparkan sebagai ikon dalam menu.',
      message: {
        url: 'Format URL tidak sah.',
      },
    },
    openMode: {
      label: 'Mod Buka',
      description: 'Kaedah paparan hasil.',
      options: {
        [OPEN_MODE.POPUP]: 'Popup',
        [OPEN_MODE.WINDOW]: 'Tetingkap',
        [OPEN_MODE.TAB]: 'Tab',
        [OPEN_MODE.PAGE_ACTION]: 'Tindakan Halaman',
      },
    },
    openModeSecondary: {
      label: 'Ctrl + Klik',
      description: 'Kaedah paparan hasil semasa Ctrl + Klik.',
    },
    spaceEncoding: {
      label: 'Pengekodan Ruang',
      description: 'Menggantikan ruang dalam teks yang dipilih.',
      options: {
        plus: 'Plus(+)',
        percent: 'Percent(%20)',
      },
    },
    formDescription: 'Meminta perkongsian arahan.',
    formOptions: 'Pilihan',
    confirm: 'Sahkan Input',
    pageAction: {
      label: 'Tindakan Halaman',
      description: 'Operasi yang akan dijalankan',
    },
    PageActionOption: {
      startUrl: {
        label: 'URL Halaman Mula',
        description: 'URL halaman di mana tindakan halaman akan dimulakan.',
      },
    },
  },
  confirmForm: {
    formDescription: 'Adakah maklumat di bawah ini betul?',
    caution:
      '※ Maklumat yang dihantar akan diterbitkan di laman web ini.\nSila jangan kongsi maklumat peribadi atau sulit.',
    back: 'Edit',
    submit: 'Kongsi',
  },
  SendingForm: {
    sending: 'Menghantar...',
  },
  completeForm: {
    formDescription: 'Penghantaran selesai.',
    thanks:
      'Terima kasih kerana berkongsi arahan anda!\nIa mungkin mengambil masa 2-3 hari untuk pembangun mencerminkan di laman web.\nSila tunggu sehingga diterbitkan.',
    aboudDelete:
      'Untuk meminta penghapusan selepas penghantaran, gunakan pautan di bawah.',
    supportHub: 'Pergi ke Hub Sokongan',
  },
  errorForm: {
    formDescription: 'Ralat telah berlaku semasa menghantar...',
    message:
      'Sila cuba sebentar lagi atau hubungi pembangun melalui pautan di bawah.',
    supportHub: 'Pergi ke Hub Sokongan',
  },
  notFound: {
    title: 'Halaman Tidak Dijumpai',
    message: 'Halaman yang anda cuba akses tidak wujud.\nSila semak URL.',
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: 'URL Carian',
    [SORT_ORDER.title]: 'Tajuk',
    [SORT_ORDER.download]: 'Muat Turun',
    [SORT_ORDER.star]: 'Bintang',
    [SORT_ORDER.addedAt]: 'Tarikh Pendaftaran',
    new: 'Baru',
    old: 'Lama',
  },
  about: {
    terms: 'Terma Penggunaan',
    privacy: 'Dasar Privasi',
    cookie: 'Dasar Kuki',
  },
  cookieConsent: {
    title: 'Mengenai Penggunaan Kuki',
    message:
      'Laman web ini menggunakan kuki untuk memberikan pengalaman yang lebih baik. Lihat Dasar Kuki kami untuk maklumat lanjut.',
    accept: 'Terima',
    decline: 'Tolak',
  },
  uninstallForm: {
    title: 'Penyahpasangan Selesai.',
    description:
      'Terima kasih kerana menggunakan Selection Command sehingga kini. Sayang sekali anda pergi, tetapi untuk meningkatkan sambungan pada masa hadapan, kami akan berterima kasih jika anda boleh menjawab tinjauan di bawah.',
    reinstall:
      'Jika anda menyahpasang secara tidak sengaja, anda boleh memasang semula melalui pautan di bawah.',
    reasonTitle: 'Mengapa anda menyahpasang? (Pilihan berganda)',
    otherReasonPlaceholder: 'Sila nyatakan sebabnya',
    detailsTitle: 'Jika boleh, sila berikan lebih banyak butiran.',
    detailsPlaceholder:
      'Butiran sebab penyahpasangan,\nApa yang anda mahu lakukan atau apa yang sukar,\nLaman web di mana ia tidak berfungsi, dll.',
    submit: 'Hantar',
    submitting: 'Menghantar...',
    success: {
      title: 'Tinjauan berjaya dihantar.',
      message:
        'Terima kasih atas respons anda. Kami menghargai maklum balas berharga anda.\nJika anda mempunyai maklum balas selain daripada borang ini, sila hubungi takeda.yujiro@gmail.com dengan subjek yang jelas.',
    },
    error: 'Gagal menghantar. Sila cuba sebentar lagi.',
    reasons: {
      difficult_to_use: 'Tidak tahu cara menggunakannya',
      not_user_friendly: 'Sukar digunakan',
      not_working: 'Tidak berfungsi seperti yang diharapkan',
      missing_features: 'Ciri yang diperlukan tidak ada',
      too_many_permissions: 'Terlalu banyak kebenaran yang diperlukan',
      found_better: 'Menemui produk yang lebih baik',
      no_longer_needed: 'Tidak lagi diperlukan',
      language_not_supported: 'Bahasa yang diingini tidak disokong',
      other: 'Lain-lain',
    },
  },
}
export default lang
