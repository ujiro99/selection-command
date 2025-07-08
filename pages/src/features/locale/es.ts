import { SORT_ORDER, OPEN_MODE } from '@/const'
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from '@/const'

const lang = {
  name: 'Español',
  shorName: 'es',
  languageName: 'Spanish',
  errorPage: {
    error: 'Ocurrió un error al enviar.',
    afterShortTime: 'Por favor, inténtelo de nuevo en unos momentos.',
  },
  commandShare: {
    title: 'Compartir comando',
    formTitle: 'Formulario para compartir comando',
  },
  tagPicker: {
    notFound: 'No encontrado',
    create: '¿Desea crearlo?',
  },
  inputForm: {
    title: {
      label: 'Título',
      description: 'Se mostrará como título del comando.',
      placeholder: 'Título del comando',
      message: {
        min3: 'El título debe tener al menos 3 caracteres.',
        max100: 'El título no puede tener más de 100 caracteres.',
      },
    },
    searchUrl: {
      label: 'URL de búsqueda',
      description: '`%s` será reemplazado por el texto seleccionado.',
      placeholder: 'URL de búsqueda',
      faviconAlt: 'Favicon de la URL de búsqueda',
      message: {
        url: 'El formato de la URL no es válido.',
        unique: 'Esta URL ya está registrada.',
      },
    },
    description: {
      label: 'Descripción del comando',
      description: 'Se mostrará como descripción del comando.',
      placeholder: 'Descripción del comando',
      message: {
        max200: 'La descripción no puede tener más de 200 caracteres.',
      },
    },
    tags: {
      label: 'Etiquetas',
      description: 'Se mostrará como categoría del comando.',
      message: {
        max5: 'Las etiquetas no pueden tener más de 20 caracteres.',
        max20: 'Puede agregar hasta 5 etiquetas.',
      },
    },
    iconUrl: {
      label: 'URL del icono',
      description: 'Se mostrará como icono del menú.',
      placeholder: 'URL del icono',
      message: {
        url: 'El formato de la URL no es válido.',
      },
    },
    openMode: {
      label: 'Modo de apertura',
      description: 'Método para mostrar el resultado.',
      options: {
        [OPEN_MODE.POPUP]: 'Ventana emergente',
        [OPEN_MODE.WINDOW]: 'Ventana',
        [OPEN_MODE.TAB]: 'Pestaña',
        [OPEN_MODE.PAGE_ACTION]: 'Acción de página',
      },
    },
    openModeSecondary: {
      label: 'Ctrl + Clic',
      description: 'Método para mostrar el resultado al hacer Ctrl + Clic.',
    },
    spaceEncoding: {
      label: 'Codificación de espacios',
      description: 'Reemplaza los espacios en el texto seleccionado.',
      options: {
        plus: 'Más (+)',
        percent: 'Porcentaje (%20)',
      },
    },
    formDescription: 'Solicitud para compartir comando.',
    formOptions: 'Opciones',
    confirm: 'Verificar información ingresada',
    pageAction: {
      label: 'Acción de página',
      description: 'Acción a ejecutar',
    },
    PageActionOption: {
      startUrl: {
        label: 'URL de página inicial',
        description: 'URL de la página donde comenzará la acción de página.',
        faviconAlt: 'Favicon de la URL de página inicial',
      },
    },
  },
  confirmForm: {
    formDescription: '¿La siguiente información es correcta?',
    caution:
      '※ La información enviada se publicará en este sitio.\nPor favor, evite compartir información personal o confidencial.',
    back: 'Modificar',
    submit: 'Compartir',
  },
  SendingForm: {
    sending: 'Enviando...',
  },
  completeForm: {
    formDescription: 'El envío se ha completado.',
    thanks:
      '¡Gracias por compartir su comando!\nPuede tomar de 2 a 3 días para que el desarrollador lo integre en el sitio.\nPor favor, espere hasta que se publique.',
    aboudDelete:
      'Para solicitar la eliminación después del envío, utilice el enlace a continuación.',
    supportHub: 'Ir al Centro de soporte',
  },
  errorForm: {
    formDescription: 'Ocurrió un error al enviar...',
    message:
      'Por favor, inténtelo de nuevo en unos momentos o contacte al desarrollador a través del enlace a continuación.',
    supportHub: 'Ir al Centro de soporte',
  },
  notFound: {
    title: 'Página no encontrada',
    message:
      'La página a la que intenta acceder no existe.\nPor favor, verifique la URL.',
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: 'URL de búsqueda',
    [SORT_ORDER.title]: 'Título',
    [SORT_ORDER.download]: 'Descargas',
    [SORT_ORDER.star]: 'Estrellas',
    [SORT_ORDER.addedAt]: 'Fecha de agregado',
    new: 'Más reciente',
    old: 'Más antiguo',
  },
  about: {
    terms: 'Términos de uso',
    privacy: 'Política de privacidad',
    cookie: 'Política de cookies',
  },
  cookieConsent: {
    title: 'Acerca de las cookies',
    message:
      'Este sitio utiliza cookies para mejorar su experiencia. Consulte nuestra política de cookies para más información.',
    accept: 'Aceptar',
    decline: 'Rechazar',
  },
  uninstallForm: {
    title: 'Desinstalación completada.',
    description:
      'Gracias por usar Selection Command hasta ahora. Lamentamos verlo partir, pero agradeceríamos si pudiera responder la encuesta a continuación para ayudarnos a mejorar la extensión.',
    reinstall:
      'Si lo ha desinstalado por error, puede reinstalarlo a través del enlace a continuación.',
    wantedToUseTitle: '¿Qué funciones quería usar? (selección múltiple)',
    wantedToUsePlaceholder: 'Díganos qué quería hacer',
    reasonTitle:
      'Por favor, indíquenos la razón de la desinstalación. (Selección múltiple posible)',
    otherReasonPlaceholder: 'Por favor, especifique la razón',
    detailsTitle: 'Si es posible, por favor proporcione más detalles.',
    detailsPlaceholder:
      'Detalles de la razón de desinstalación,\nLo que quería hacer o las dificultades encontradas,\nSitios donde no funcionaba, etc.',
    submit: 'Enviar',
    submitting: 'Enviando...',
    success: {
      title: 'La encuesta se ha enviado con éxito.',
      message:
        'Gracias por su respuesta. Apreciamos sus comentarios.\nSi desea contactarnos directamente fuera de este formulario, envíe un correo electrónico a takeda.yujiro@gmail.com con un asunto claro.',
    },
    error:
      'El envío ha fallado. Por favor, inténtelo de nuevo en unos momentos.',
    wantedToUse: {
      search_selected_text: 'Búsqueda de texto',
      ai_chatbot: 'Chatbot de IA (como ChatGPT)',
      link_preview: 'Vista previa de enlaces',
      [OTHER_OPTION]: 'Otro',
    },
    reasons: {
      difficult_to_use: 'No supe cómo usarlo',
      not_user_friendly: 'No es fácil de usar',
      not_working: 'No funcionó como esperaba',
      missing_features: 'Faltaban funciones necesarias',
      too_many_permissions: 'Requería demasiados permisos',
      found_better: 'Encontré una mejor alternativa',
      no_longer_needed: 'Ya no lo necesito',
      language_not_supported: 'Idioma no soportado',
      search_engine_is_not_available: 'Motor de búsqueda no disponible',
      i_dont_know_how_to_add_commands: 'No sé cómo agregar comandos',
      settings_are_complicated: 'Las configuraciones son demasiado complicadas',
      [UNINSTALL_OTHER_OPTION]: 'Otro',
    },
  },
}
export default lang
