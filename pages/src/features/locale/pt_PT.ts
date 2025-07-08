import { SORT_ORDER, OPEN_MODE } from '@/const'
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from '@/const'

const lang = {
  name: 'Português (Portugal)',
  shorName: 'pt_PT',
  languageName: 'Portuguese (Portugal)',
  errorPage: {
    error: 'Ocorreu um erro ao enviar.',
    afterShortTime: 'Por favor, tente novamente mais tarde.',
  },
  commandShare: {
    title: 'Compartilhar Comando',
    formTitle: 'Formulário de Compartilhamento de Comando',
  },
  tagPicker: {
    notFound: 'Não encontrado',
    create: 'Criar?',
  },
  inputForm: {
    title: {
      label: 'Título',
      description: 'Será exibido como título do comando.',
      placeholder: 'Título do comando',
      message: {
        min3: 'O título deve ter no mínimo 3 caracteres.',
        max100: 'O título deve ter no máximo 100 caracteres.',
      },
    },
    searchUrl: {
      label: 'URL de Pesquisa',
      description: 'Substitui `%s` pelo texto selecionado.',
      placeholder: 'URL de Pesquisa',
      faviconAlt: 'Favicon da URL de pesquisa',
      message: {
        url: 'Formato de URL inválido.',
        unique: 'Já está registrado.',
      },
    },
    description: {
      label: 'Descrição do Comando',
      description: 'Será exibido como descrição do comando.',
      placeholder: 'Descrição do comando',
      message: {
        max200: 'A descrição deve ter no máximo 200 caracteres.',
      },
    },
    tags: {
      label: 'Tags',
      description: 'Será exibido como classificação do comando.',
      message: {
        max5: 'As tags devem ter no máximo 20 caracteres.',
        max20: 'Máximo de 5 tags permitidas.',
      },
    },
    iconUrl: {
      label: 'URL do Ícone',
      description: 'Será exibido como ícone no menu.',
      placeholder: 'URL do Ícone',
      message: {
        url: 'Formato de URL inválido.',
      },
    },
    openMode: {
      label: 'Modo de Abertura',
      description: 'Método de exibição do resultado.',
      options: {
        [OPEN_MODE.POPUP]: 'Popup',
        [OPEN_MODE.WINDOW]: 'Janela',
        [OPEN_MODE.TAB]: 'Aba',
        [OPEN_MODE.PAGE_ACTION]: 'Ação da Página',
      },
    },
    openModeSecondary: {
      label: 'Ctrl + Clique',
      description:
        'Método de exibição do resultado ao pressionar Ctrl + Clique.',
    },
    spaceEncoding: {
      label: 'Codificação de Espaço',
      description: 'Substitui espaços no texto selecionado.',
      options: {
        plus: 'Plus(+)',
        percent: 'Percent(%20)',
      },
    },
    formDescription: 'Solicitar compartilhamento de comando.',
    formOptions: 'Opções',
    confirm: 'Confirmar Entrada',
    pageAction: {
      label: 'Ação da Página',
      description: 'Operação a ser executada',
    },
    PageActionOption: {
      startUrl: {
        label: 'URL da Página Inicial',
        description: 'URL da página onde a ação da página será iniciada.',
        faviconAlt: 'Favicon da URL da página inicial',
      },
    },
  },
  confirmForm: {
    formDescription: 'As informações abaixo estão corretas?',
    caution:
      '※ As informações enviadas serão publicadas neste site.\nPor favor, não compartilhe informações pessoais ou confidenciais.',
    back: 'Editar',
    submit: 'Compartilhar',
  },
  SendingForm: {
    sending: 'Enviando...',
  },
  completeForm: {
    formDescription: 'Envio concluído.',
    thanks:
      'Obrigado por compartilhar seu comando!\nPode levar de 2 a 3 dias para os desenvolvedores refletirem no site.\nPor favor, aguarde até a publicação.',
    aboudDelete: 'Para solicitar a exclusão após o envio, use o link abaixo.',
    supportHub: 'Ir para o Hub de Suporte',
  },
  errorForm: {
    formDescription: 'Ocorreu um erro ao enviar...',
    message:
      'Por favor, tente novamente mais tarde ou entre em contato com os desenvolvedores através do link abaixo.',
    supportHub: 'Ir para o Hub de Suporte',
  },
  notFound: {
    title: 'Página não encontrada',
    message:
      'A página que você tentou acessar não existe.\nPor favor, verifique o URL.',
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: 'URL de Pesquisa',
    [SORT_ORDER.title]: 'Título',
    [SORT_ORDER.download]: 'Downloads',
    [SORT_ORDER.star]: 'Estrelas',
    [SORT_ORDER.addedAt]: 'Data de Registro',
    new: 'Novo',
    old: 'Antigo',
  },
  about: {
    terms: 'Termos de Uso',
    privacy: 'Política de Privacidade',
    cookie: 'Política de Cookies',
  },
  cookieConsent: {
    title: 'Sobre o uso de Cookies',
    message:
      'Este site usa cookies para fornecer uma melhor experiência. Consulte nossa Política de Cookies para mais detalhes.',
    accept: 'Aceitar',
    decline: 'Recusar',
  },
  uninstallForm: {
    title: 'Desinstalação concluída.',
    description:
      'Obrigado por usar o Selection Command até agora. É uma pena que você esteja partindo, mas para melhorar a extensão no futuro, agradeceríamos se você pudesse responder à pesquisa abaixo.',
    reinstall:
      'Se você desinstalou por engano, pode reinstalar através do link abaixo.',
    wantedToUseTitle: 'Que funcionalidades desejava utilizar? (múltipla escolha)',
    wantedToUsePlaceholder: 'Por favor, diga-nos o que pretendia fazer',
    reasonTitle: 'Por que você desinstalou? (Múltipla escolha)',
    otherReasonPlaceholder: 'Por favor, especifique o motivo',
    detailsTitle: 'Se possível, por favor, forneça mais detalhes.',
    detailsPlaceholder:
      'Detalhes do motivo da desinstalação,\nO que você queria fazer ou o que foi difícil,\nSites onde não funcionou, etc.',
    submit: 'Enviar',
    submitting: 'Enviando...',
    success: {
      title: 'Pesquisa enviada com sucesso.',
      message:
        'Obrigado pela sua resposta. Agradecemos seus valiosos comentários.\nSe você tiver mais feedback além deste formulário, por favor, entre em contato com takeda.yujiro@gmail.com com um assunto claro.',
    },
    error: 'Falha ao enviar. Por favor, tente novamente mais tarde.',
    wantedToUse: {
      search_selected_text: 'Pesquisar texto selecionado',
      ai_chatbot: 'Chatbot de IA (como ChatGPT)',
      link_preview: 'Pré-visualização de ligações',
      [OTHER_OPTION]: 'Outro',
    },
    reasons: {
      difficult_to_use: 'Não soube como usar',
      not_user_friendly: 'Pouco intuitivo',
      not_working: 'Não funcionou como esperado',
      missing_features: 'Faltam funcionalidades necessárias',
      too_many_permissions: 'Requereu permissões a mais',
      found_better: 'Encontrei uma alternativa melhor',
      no_longer_needed: 'Já não é necessário',
      language_not_supported: 'Idioma não suportado',
      search_engine_is_not_available: 'Motor de busca não disponível',
      i_dont_know_how_to_add_commands: 'Não sei como adicionar comandos',
      settings_are_complicated: 'As configurações são muito complicadas',
      [UNINSTALL_OTHER_OPTION]: 'Outro',
    },
  },
}
export default lang
