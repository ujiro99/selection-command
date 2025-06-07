import { SORT_ORDER, OPEN_MODE } from '@/const'

const lang = {
  name: 'Français',
  shorName: 'fr',
  languageName: 'French',
  errorPage: {
    error: "Une erreur est survenue lors de l'envoi.",
    afterShortTime: 'Veuillez réessayer dans quelques instants.',
  },
  commandShare: {
    title: 'Partager une commande',
    formTitle: 'Formulaire de partage de commande',
  },
  tagPicker: {
    notFound: 'Non trouvé',
    create: 'Voulez-vous le créer ?',
  },
  inputForm: {
    title: {
      label: 'Titre',
      description: 'Sera affiché comme titre de la commande.',
      placeholder: 'Titre de la commande',
      message: {
        min3: 'Le titre doit contenir au moins 3 caractères.',
        max100: 'Le titre ne peut pas dépasser 100 caractères.',
      },
    },
    searchUrl: {
      label: 'URL de recherche',
      description: '`%s` sera remplacé par le texte sélectionné.',
      placeholder: 'URL de recherche',
      faviconAlt: "Favicon de l'URL de recherche",
      message: {
        url: "Le format de l'URL n'est pas valide.",
        unique: 'Cette URL est déjà enregistrée.',
      },
    },
    description: {
      label: 'Description de la commande',
      description: 'Sera affiché comme description de la commande.',
      placeholder: 'Description de la commande',
      message: {
        max200: 'La description ne peut pas dépasser 200 caractères.',
      },
    },
    tags: {
      label: 'Tags',
      description: 'Sera affiché comme catégorie de la commande.',
      message: {
        max5: 'Les tags ne peuvent pas dépasser 20 caractères.',
        max20: "Vous pouvez ajouter jusqu'à 5 tags.",
      },
    },
    iconUrl: {
      label: "URL de l'icône",
      description: 'Sera affiché comme icône du menu.',
      placeholder: "URL de l'icône",
      message: {
        url: "Le format de l'URL n'est pas valide.",
      },
    },
    openMode: {
      label: "Mode d'ouverture",
      description: "Méthode d'affichage du résultat.",
      options: {
        [OPEN_MODE.POPUP]: 'Popup',
        [OPEN_MODE.WINDOW]: 'Fenêtre',
        [OPEN_MODE.TAB]: 'Onglet',
        [OPEN_MODE.PAGE_ACTION]: 'Action de page',
      },
    },
    openModeSecondary: {
      label: 'Ctrl + Clic',
      description: "Méthode d'affichage du résultat lors d'un Ctrl + Clic.",
    },
    spaceEncoding: {
      label: 'Encodage des espaces',
      description: 'Remplace les espaces dans le texte sélectionné.',
      options: {
        plus: 'Plus (+)',
        percent: 'Pourcentage (%20)',
      },
    },
    formDescription: 'Demande de partage de commande.',
    formOptions: 'Options',
    confirm: 'Vérifier les informations saisies',
    pageAction: {
      label: 'Action de page',
      description: 'Action à exécuter',
    },
    PageActionOption: {
      startUrl: {
        label: 'URL de la page de départ',
        description: "URL de la page où l'action de page commencera.",
        faviconAlt: "Favicon de l'URL de la page de départ",
      },
    },
  },
  confirmForm: {
    formDescription: 'Les informations suivantes sont-elles correctes ?',
    caution:
      '※ Les informations envoyées seront publiées sur ce site.\nVeuillez éviter de partager des informations personnelles ou confidentielles.',
    back: 'Modifier',
    submit: 'Partager',
  },
  SendingForm: {
    sending: 'Envoi en cours...',
  },
  completeForm: {
    formDescription: "L'envoi est terminé.",
    thanks:
      "Merci d'avoir partagé votre commande !\nIl peut falloir 2 à 3 jours pour que le développeur l'intègre au site.\nVeuillez patienter jusqu'à sa publication.",
    aboudDelete:
      "Pour demander la suppression après l'envoi, veuillez utiliser le lien ci-dessous.",
    supportHub: 'Aller au Hub de support',
  },
  errorForm: {
    formDescription: "Une erreur est survenue lors de l'envoi...",
    message:
      'Veuillez réessayer dans quelques instants ou contacter le développeur via le lien ci-dessous.',
    supportHub: 'Aller au Hub de support',
  },
  notFound: {
    title: 'Page non trouvée',
    message:
      "La page que vous essayez d'accéder n'existe pas.\nVeuillez vérifier l'URL.",
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: 'URL de recherche',
    [SORT_ORDER.title]: 'Titre',
    [SORT_ORDER.download]: 'Téléchargements',
    [SORT_ORDER.star]: 'Étoiles',
    [SORT_ORDER.addedAt]: "Date d'ajout",
    new: 'Plus récent',
    old: 'Plus ancien',
  },
  about: {
    terms: "Conditions d'utilisation",
    privacy: 'Politique de confidentialité',
    cookie: 'Politique des cookies',
  },
  cookieConsent: {
    title: 'À propos des cookies',
    message:
      "Ce site utilise des cookies pour améliorer votre expérience. Consultez notre politique des cookies pour plus d'informations.",
    accept: 'Accepter',
    decline: 'Refuser',
  },
  uninstallForm: {
    title: 'Désinstallation terminée.',
    description:
      "Merci d'avoir utilisé Selection Command jusqu'à présent. Nous sommes désolés de vous voir partir, mais nous serions reconnaissants si vous pouviez répondre à l'enquête ci-dessous pour nous aider à améliorer l'extension.",
    reinstall:
      "Si vous l'avez désinstallé par erreur, vous pouvez le réinstaller via le lien ci-dessous.",
    reasonTitle:
      'Veuillez nous indiquer la raison de la désinstallation. (Choix multiples possibles)',
    otherReasonPlaceholder: 'Veuillez préciser la raison',
    detailsTitle: 'Si possible, veuillez nous donner plus de détails.',
    detailsPlaceholder:
      'Détails de la raison de désinstallation,\nCe que vous souhaitiez faire ou les difficultés rencontrées,\nSites où cela ne fonctionnait pas, etc.',
    submit: 'Envoyer',
    submitting: 'Envoi en cours...',
    success: {
      title: "L'enquête a été envoyée avec succès.",
      message:
        'Merci pour votre réponse. Nous apprécions vos commentaires.\nSi vous souhaitez nous contacter directement en dehors de ce formulaire, veuillez envoyer un e-mail à takeda.yujiro@gmail.com avec un objet explicite.',
    },
    error: "L'envoi a échoué. Veuillez réessayer dans quelques instants.",
    reasons: {
      difficult_to_use: "Je ne sais pas comment l'utiliser",
      not_user_friendly: 'Difficile à utiliser',
      not_working: 'Ne fonctionne pas comme prévu',
      missing_features: 'Fonctionnalités manquantes',
      too_many_permissions: 'Trop de permissions requises',
      found_better: "J'ai trouvé un meilleur produit",
      no_longer_needed: "Je n'en ai plus besoin",
      language_not_supported: "Ma langue n'est pas prise en charge",
      other: 'Autre',
    },
  },
}
export default lang
