import { SORT_ORDER, OPEN_MODE } from "@/const"
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from "@/const"

const lang = {
  name: "Deutsch",
  shorName: "de",
  languageName: "German",
  errorPage: {
    error: "Beim Senden ist ein Fehler aufgetreten.",
    afterShortTime: "Bitte versuchen Sie es in Kürze erneut.",
  },
  commandShare: {
    title: "Befehl teilen",
    formTitle: "Formular zum Teilen eines Befehls",
  },
  tagPicker: {
    notFound: "Nicht gefunden",
    create: "Möchten Sie es erstellen?",
  },
  inputForm: {
    title: {
      label: "Titel",
      description: "Wird als Titel des Befehls angezeigt.",
      placeholder: "Titel des Befehls",
      message: {
        min3: "Der Titel muss mindestens 3 Zeichen lang sein.",
        max100: "Der Titel darf maximal 100 Zeichen lang sein.",
      },
    },
    searchUrl: {
      label: "Such-URL",
      description: "`%s` wird durch den ausgewählten Text ersetzt.",
      placeholder: "Such-URL",
      faviconAlt: "Favicon der Such-URL",
      message: {
        url: "Das URL-Format ist ungültig.",
        unique: "Diese URL ist bereits registriert.",
      },
    },
    description: {
      label: "Befehlsbeschreibung",
      description: "Wird als Beschreibung des Befehls angezeigt.",
      placeholder: "Befehlsbeschreibung",
      message: {
        max200: "Die Beschreibung darf maximal 200 Zeichen lang sein.",
      },
    },
    tags: {
      label: "Tags",
      description: "Wird als Kategorie des Befehls angezeigt.",
      message: {
        max5: "Tags dürfen maximal 20 Zeichen lang sein.",
        max20: "Sie können bis zu 5 Tags hinzufügen.",
      },
    },
    iconUrl: {
      label: "Icon-URL",
      description: "Wird als Menü-Icon angezeigt.",
      placeholder: "Icon-URL",
      message: {
        url: "Das URL-Format ist ungültig.",
      },
    },
    openMode: {
      label: "Öffnungsmodus",
      description: "Methode zur Anzeige des Ergebnisses.",
      options: {
        [OPEN_MODE.POPUP]: "Popup",
        [OPEN_MODE.WINDOW]: "Fenster",
        [OPEN_MODE.TAB]: "Tab",
        [OPEN_MODE.PAGE_ACTION]: "Seitenaktion",
      },
    },
    openModeSecondary: {
      label: "Strg + Klick",
      description: "Methode zur Anzeige des Ergebnisses bei Strg + Klick.",
    },
    spaceEncoding: {
      label: "Leerzeichenkodierung",
      description: "Ersetzt Leerzeichen im ausgewählten Text.",
      options: {
        plus: "Plus (+)",
        percent: "Prozent (%20)",
      },
    },
    formDescription: "Anfrage zum Teilen eines Befehls.",
    formOptions: "Optionen",
    confirm: "Eingegebene Informationen überprüfen",
    pageAction: {
      label: "Seitenaktion",
      description: "Auszuführende Aktion",
    },
    PageActionOption: {
      startUrl: {
        label: "Startseiten-URL",
        description: "URL der Seite, auf der die Seitenaktion beginnen soll.",
        faviconAlt: "Favicon der Startseiten-URL",
      },
    },
  },
  confirmForm: {
    formDescription: "Sind die folgenden Informationen korrekt?",
    caution:
      "※ Die gesendeten Informationen werden auf dieser Website veröffentlicht.\nBitte vermeiden Sie das Teilen persönlicher oder vertraulicher Informationen.",
    back: "Bearbeiten",
    submit: "Teilen",
  },
  SendingForm: {
    sending: "Wird gesendet...",
  },
  completeForm: {
    formDescription: "Der Sendevorgang ist abgeschlossen.",
    thanks:
      "Vielen Dank für das Teilen Ihres Befehls!\nEs kann 2-3 Tage dauern, bis der Entwickler ihn in die Website integriert.\nBitte warten Sie, bis er veröffentlicht wird.",
    aboudDelete:
      "Um nach dem Senden eine Löschung zu beantragen, verwenden Sie bitte den folgenden Link.",
    supportHub: "Zum Support-Hub",
  },
  errorForm: {
    formDescription: "Beim Senden ist ein Fehler aufgetreten...",
    message:
      "Bitte versuchen Sie es in Kürze erneut oder kontaktieren Sie den Entwickler über den folgenden Link.",
    supportHub: "Zum Support-Hub",
  },
  notFound: {
    title: "Seite nicht gefunden",
    message:
      "Die Seite, auf die Sie zugreifen möchten, existiert nicht.\nBitte überprüfen Sie die URL.",
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: "Such-URL",
    [SORT_ORDER.title]: "Titel",
    [SORT_ORDER.download]: "Downloads",
    [SORT_ORDER.star]: "Sterne",
    [SORT_ORDER.addedAt]: "Hinzugefügt am",
    new: "Neueste",
    old: "Älteste",
  },
  about: {
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutzerklärung",
    cookie: "Cookie-Richtlinie",
  },
  cookieConsent: {
    title: "Über Cookies",
    message:
      "Diese Website verwendet Cookies, um Ihr Erlebnis zu verbessern. Weitere Informationen finden Sie in unserer Cookie-Richtlinie.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
  },
  uninstallForm: {
    title: "Deinstallation abgeschlossen.",
    description:
      "Vielen Dank für die bisherige Nutzung von Selection Command. Es tut uns leid, Sie gehen zu sehen, aber wir wären dankbar, wenn Sie die folgende Umfrage beantworten könnten, um uns bei der Verbesserung der Erweiterung zu helfen.",
    reinstall:
      "Wenn Sie es versehentlich deinstalliert haben, können Sie es über den folgenden Link neu installieren.",
    wantedToUseTitle:
      "Welche Funktionen wollten Sie nutzen? (Mehrfachauswahl möglich)",
    wantedToUsePlaceholder:
      "Bitte teilen Sie uns mit, was Sie erreichen wollten",
    reasonTitle:
      "Bitte teilen Sie uns den Grund für die Deinstallation mit. (Mehrfachauswahl möglich)",
    otherReasonPlaceholder: "Bitte geben Sie den Grund an",
    detailsTitle: "Wenn möglich, geben Sie bitte weitere Details an.",
    detailsPlaceholder:
      "Details zum Deinstallationsgrund,\nWas Sie tun wollten oder welche Schwierigkeiten Sie hatten,\nWebsites, auf denen es nicht funktionierte, etc.",
    submit: "Senden",
    submitting: "Wird gesendet...",
    success: {
      title: "Die Umfrage wurde erfolgreich gesendet.",
      message:
        "Vielen Dank für Ihre Antwort. Wir schätzen Ihr Feedback.\nWenn Sie uns außerhalb dieses Formulars direkt kontaktieren möchten, senden Sie bitte eine E-Mail an takeda.yujiro@gmail.com mit einem klaren Betreff.",
    },
    error:
      "Der Sendevorgang ist fehlgeschlagen. Bitte versuchen Sie es in Kürze erneut.",
    wantedToUse: {
      search_selected_text: "Text-Suche",
      ai_chatbot: "KI-Chatbot (wie ChatGPT)",
      link_preview: "Link-Vorschau",
      [OTHER_OPTION]: "Sonstiges",
    },
    reasons: {
      difficult_to_use: "Ich wusste nicht, wie man es benutzt",
      not_user_friendly: "Nicht benutzerfreundlich",
      not_working: "Funktionierte nicht wie erwartet",
      missing_features: "Fehlende benötigte Funktionen",
      too_many_permissions: "Zu viele Berechtigungen erforderlich",
      found_better: "Bessere Alternative gefunden",
      no_longer_needed: "Wird nicht mehr benötigt",
      language_not_supported: "Sprache wird nicht unterstützt",
      search_engine_is_not_available: "Gewünschte Suchmaschine nicht verfügbar",
      i_dont_know_how_to_add_commands: "Weiß nicht, wie man Befehle hinzufügt",
      settings_are_complicated: "Einstellungen sind zu kompliziert",
      [UNINSTALL_OTHER_OPTION]: "Sonstiges",
    },
  },
}
export default lang
