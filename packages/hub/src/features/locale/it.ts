import { SORT_ORDER, OPEN_MODE } from "@/const"
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from "@/const"

const lang = {
  name: "Italiano",
  shorName: "it",
  languageName: "Italian",
  errorPage: {
    error: "Si è verificato un errore durante l'invio.",
    afterShortTime: "Per favore, riprova più tardi.",
  },
  commandShare: {
    title: "Condividi Comando",
    formTitle: "Modulo di Condivisione Comando",
  },
  tagPicker: {
    notFound: "Non trovato",
    create: "Creare?",
  },
  inputForm: {
    title: {
      label: "Titolo",
      description: "Verrà visualizzato come titolo del comando.",
      placeholder: "Titolo del comando",
      message: {
        min3: "Il titolo deve essere di almeno 3 caratteri.",
        max100: "Il titolo deve essere di massimo 100 caratteri.",
      },
    },
    searchUrl: {
      label: "URL di Ricerca",
      description: "Sostituisce `%s` con il testo selezionato.",
      placeholder: "URL di Ricerca",
      faviconAlt: "Favicon dell'URL di ricerca",
      message: {
        url: "Formato URL non valido.",
        unique: "Già registrato.",
      },
    },
    description: {
      label: "Descrizione del Comando",
      description: "Verrà visualizzata come descrizione del comando.",
      placeholder: "Descrizione del comando",
      message: {
        max200: "La descrizione deve essere di massimo 200 caratteri.",
      },
    },
    tags: {
      label: "Tag",
      description: "Verranno visualizzati come classificazione del comando.",
      message: {
        max5: "I tag devono essere di massimo 20 caratteri.",
        max20: "Massimo 5 tag consentiti.",
      },
    },
    iconUrl: {
      label: "URL Icona",
      description: "Verrà visualizzata come icona nel menu.",
      placeholder: "URL Icona",
      message: {
        url: "Formato URL non valido.",
      },
    },
    openMode: {
      label: "Modalità Apertura",
      description: "Metodo di visualizzazione del risultato.",
      options: {
        [OPEN_MODE.POPUP]: "Popup",
        [OPEN_MODE.WINDOW]: "Finestra",
        [OPEN_MODE.TAB]: "Scheda",
        [OPEN_MODE.BACKGROUND_TAB]: "Scheda in background",
        [OPEN_MODE.PAGE_ACTION]: "Azione Pagina",
      },
    },
    openModeSecondary: {
      label: "Ctrl + Click",
      description:
        "Metodo di visualizzazione del risultato durante Ctrl + Click.",
    },
    spaceEncoding: {
      label: "Codifica Spazio",
      description: "Sostituisce gli spazi nel testo selezionato.",
      options: {
        plus: "Plus(+)",
        percent: "Percent(%20)",
      },
    },
    formDescription: "Richiedi condivisione comando.",
    formOptions: "Opzioni",
    confirm: "Conferma Inserimento",
    pageAction: {
      label: "Azione Pagina",
      description: "Operazione da eseguire",
    },
    PageActionOption: {
      startUrl: {
        label: "URL Pagina Iniziale",
        description: "URL della pagina da cui inizierà l'azione della pagina.",
        faviconAlt: "Favicon dell'URL della pagina iniziale",
      },
      openMode: {
        label: "Metodo di visualizzazione della finestra",
        description: "Come viene visualizzata la finestra.",
      },
    },
  },
  confirmForm: {
    formDescription: "Le informazioni seguenti sono corrette?",
    caution:
      "※ Le informazioni inviate saranno pubblicate su questo sito.\nPer favore, non condividere informazioni personali o riservate.",
    back: "Modifica",
    submit: "Condividi",
  },
  SendingForm: {
    sending: "Invio in corso...",
  },
  completeForm: {
    formDescription: "Invio completato.",
    thanks:
      "Grazie per aver condiviso il tuo comando!\nPotrebbero essere necessari 2-3 giorni agli sviluppatori per riflettere le modifiche sul sito.\nPer favore, attendi la pubblicazione.",
    aboudDelete:
      "Per richiedere l'eliminazione dopo l'invio, usa il link sottostante.",
    supportHub: "Vai all'Hub di Supporto",
  },
  errorForm: {
    formDescription: "Si è verificato un errore durante l'invio...",
    message:
      "Per favore, riprova più tardi o contatta gli sviluppatori tramite il link sottostante.",
    supportHub: "Vai all'Hub di Supporto",
  },
  notFound: {
    title: "Pagina Non Trovata",
    message:
      "La pagina che stai cercando di accedere non esiste.\nPer favore, controlla l'URL.",
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: "URL di Ricerca",
    [SORT_ORDER.title]: "Titolo",
    [SORT_ORDER.download]: "Download",
    [SORT_ORDER.star]: "Stelle",
    [SORT_ORDER.addedAt]: "Data di Registrazione",
    new: "Nuovo",
    old: "Vecchio",
  },
  about: {
    terms: "Termini di Utilizzo",
    privacy: "Informativa sulla Privacy",
    cookie: "Informativa sui Cookie",
  },
  cookieConsent: {
    title: "Sull'Uso dei Cookie",
    message:
      "Questo sito utilizza i cookie per fornire una migliore esperienza. Consulta la nostra Informativa sui Cookie per maggiori dettagli.",
    accept: "Accetta",
    decline: "Rifiuta",
  },
  uninstallForm: {
    title: "Disinstallazione Completata.",
    description:
      "Grazie per aver utilizzato Selection Command finora. È un peccato che tu stia andando via, ma per migliorare l'estensione in futuro, saremmo grati se potessi rispondere al sondaggio sottostante.",
    reinstall:
      "Se hai disinstallato per errore, puoi reinstallare tramite il link sottostante.",
    wantedToUseTitle: "Quali funzionalità volevi utilizzare? (scelta multipla)",
    wantedToUsePlaceholder: "Raccontaci cosa volevi fare",
    reasonTitle: "Perché hai disinstallato? (Scelta multipla)",
    otherReasonPlaceholder: "Per favore, specifica il motivo",
    detailsTitle: "Se possibile, per favore, fornisci maggiori dettagli.",
    detailsPlaceholder:
      "Dettagli del motivo della disinstallazione,\nCosa volevi fare o cosa era difficile,\nSiti in cui non funzionava, ecc.",
    submit: "Invia",
    submitting: "Invio in corso...",
    success: {
      title: "Sondaggio inviato con successo.",
      message:
        "Grazie per la tua risposta. Apprezziamo il tuo prezioso feedback.\nSe hai ulteriori feedback oltre a questo modulo, contatta takeda.yujiro@gmail.com con un oggetto chiaro.",
    },
    error: "Invio fallito. Per favore, riprova più tardi.",
    wantedToUse: {
      search_selected_text: "Ricerca testo selezionato",
      ai_chatbot: "Chatbot AI (come ChatGPT)",
      link_preview: "Anteprima link",
      [OTHER_OPTION]: "Altro",
    },
    reasons: {
      difficult_to_use: "Non sapevo come usarlo",
      not_user_friendly: "Non facile da usare",
      not_working: "Non ha funzionato come previsto",
      missing_features: "Mancavano funzionalità necessarie",
      too_many_permissions: "Richieste troppe autorizzazioni",
      found_better: "Ho trovato un'alternativa migliore",
      no_longer_needed: "Non più necessario",
      language_not_supported: "Lingua non supportata",
      search_engine_is_not_available: "Motore di ricerca non disponibile",
      i_dont_know_how_to_add_commands: "Non so come aggiungere comandi",
      settings_are_complicated: "Le impostazioni sono troppo complicate",
      [UNINSTALL_OTHER_OPTION]: "Altro",
    },
  },
}
export default lang
