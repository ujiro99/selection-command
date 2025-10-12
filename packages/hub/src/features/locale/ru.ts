import { SORT_ORDER, OPEN_MODE } from "@/const"
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from "@/const"

const lang = {
  name: "Русский",
  shorName: "ru",
  languageName: "Russian",
  errorPage: {
    error: "Произошла ошибка при отправке.",
    afterShortTime: "Пожалуйста, попробуйте позже.",
  },
  commandShare: {
    title: "Поделиться командой",
    formTitle: "Форма отправки команды",
  },
  tagPicker: {
    notFound: "Не найдено",
    create: "Создать?",
  },
  inputForm: {
    title: {
      label: "Заголовок",
      description: "Будет отображаться как заголовок команды.",
      placeholder: "Заголовок команды",
      message: {
        min3: "Заголовок должен содержать минимум 3 символа.",
        max100: "Заголовок должен содержать максимум 100 символов.",
      },
    },
    searchUrl: {
      label: "URL поиска",
      description: "Заменяет `%s` на выбранный текст.",
      placeholder: "URL поиска",
      faviconAlt: "Фавикон URL поиска",
      message: {
        url: "Неверный формат URL.",
        unique: "Уже зарегистрировано.",
      },
    },
    description: {
      label: "Описание команды",
      description: "Будет отображаться как описание команды.",
      placeholder: "Описание команды",
      message: {
        max200: "Описание должно содержать максимум 200 символов.",
      },
    },
    tags: {
      label: "Теги",
      description: "Будут отображаться как классификация команды.",
      message: {
        max5: "Тег должен содержать максимум 20 символов.",
        max20: "Максимум 5 тегов.",
      },
    },
    iconUrl: {
      label: "URL иконки",
      description: "Будет отображаться как иконка в меню.",
      placeholder: "URL иконки",
      message: {
        url: "Неверный формат URL.",
      },
    },
    openMode: {
      label: "Режим открытия",
      description: "Способ отображения результата.",
      options: {
        [OPEN_MODE.POPUP]: "Всплывающее окно",
        [OPEN_MODE.WINDOW]: "Окно",
        [OPEN_MODE.TAB]: "Вкладка",
        [OPEN_MODE.BACKGROUND_TAB]: "Фоновая вкладка",
        [OPEN_MODE.PAGE_ACTION]: "Действие страницы",
      },
    },
    openModeSecondary: {
      label: "Ctrl + клик",
      description: "Способ отображения результата при Ctrl + клике.",
    },
    spaceEncoding: {
      label: "Кодировка пробела",
      description: "Заменяет пробелы в выбранном тексте.",
      options: {
        plus: "Плюс(+)",
        percent: "Процент(%20)",
      },
    },
    formDescription: "Запрос на отправку команды.",
    formOptions: "Опции",
    confirm: "Подтвердить ввод",
    pageAction: {
      label: "Действие страницы",
      description: "Операция для выполнения",
    },
    PageActionOption: {
      startUrl: {
        label: "URL начальной страницы",
        description: "URL страницы, с которой начнется действие страницы.",
        faviconAlt: "Фавикон URL начальной страницы",
      },
      openMode: {
        label: "Метод отображения окна",
        description: "Как отображается окно.",
      },
    },
  },
  confirmForm: {
    formDescription: "Верна ли следующая информация?",
    caution:
      "※ Отправленная информация будет опубликована на этом сайте.\nПожалуйста, не делитесь личной или конфиденциальной информацией.",
    back: "Редактировать",
    submit: "Поделиться",
  },
  SendingForm: {
    sending: "Отправка...",
  },
  completeForm: {
    formDescription: "Отправка завершена.",
    thanks:
      "Спасибо за отправку вашей команды!\nРазработчикам может потребоваться 2-3 дня, чтобы отразить изменения на сайте.\nПожалуйста, подождите публикации.",
    aboudDelete: "Для запроса удаления после отправки используйте ссылку ниже.",
    supportHub: "Перейти в центр поддержки",
  },
  errorForm: {
    formDescription: "Произошла ошибка при отправке...",
    message:
      "Пожалуйста, попробуйте позже или свяжитесь с разработчиками по ссылке ниже.",
    supportHub: "Перейти в центр поддержки",
  },
  notFound: {
    title: "Страница не найдена",
    message:
      "Страница, которую вы пытаетесь открыть, не существует.\nПожалуйста, проверьте URL.",
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: "URL поиска",
    [SORT_ORDER.title]: "Заголовок",
    [SORT_ORDER.download]: "Загрузки",
    [SORT_ORDER.star]: "Звезды",
    [SORT_ORDER.addedAt]: "Дата регистрации",
    new: "Новое",
    old: "Старое",
  },
  about: {
    terms: "Условия использования",
    privacy: "Политика конфиденциальности",
    cookie: "Политика использования файлов cookie",
  },
  cookieConsent: {
    title: "Об использовании файлов cookie",
    message:
      "Этот сайт использует файлы cookie для улучшения пользовательского опыта. Подробности смотрите в нашей Политике использования файлов cookie.",
    accept: "Принять",
    decline: "Отклонить",
  },
  uninstallForm: {
    title: "Удаление завершено.",
    description:
      "Спасибо за использование Selection Command до сих пор. Жаль, что вы уходите, но для улучшения расширения в будущем мы будем благодарны, если вы ответите на опрос ниже.",
    reinstall:
      "Если вы случайно удалили расширение, вы можете переустановить его по ссылке ниже.",
    wantedToUseTitle:
      "Какие функции вы хотели использовать? (множественный выбор)",
    wantedToUsePlaceholder: "Пожалуйста, расскажите, что вы хотели делать",
    reasonTitle: "Почему вы удалили расширение? (Множественный выбор)",
    otherReasonPlaceholder: "Пожалуйста, укажите причину",
    detailsTitle:
      "Если возможно, пожалуйста, предоставьте более подробную информацию.",
    detailsPlaceholder:
      "Подробности причины удаления,\nЧто вы хотели сделать или что было сложно,\nНа каких сайтах не работало и т.д.",
    submit: "Отправить",
    submitting: "Отправка...",
    success: {
      title: "Опрос успешно отправлен.",
      message:
        "Спасибо за ваш ответ. Мы ценим ваши ценные отзывы.\nЕсли у вас есть дополнительные отзывы помимо этой формы, пожалуйста, свяжитесь с takeda.yujiro@gmail.com с четким предметом.",
    },
    error: "Не удалось отправить. Пожалуйста, попробуйте позже.",
    wantedToUse: {
      search_selected_text: "Поиск выбранного текста",
      ai_chatbot: "AI-чатбот (как ChatGPT)",
      link_preview: "Предпросмотр ссылок",
      [OTHER_OPTION]: "Другое",
    },
    reasons: {
      difficult_to_use: "Не знал, как использовать",
      not_user_friendly: "Неудобный интерфейс",
      not_working: "Не работает как ожидалось",
      missing_features: "Отсутствуют нужные функции",
      too_many_permissions: "Требуется слишком много разрешений",
      found_better: "Нашел лучшую альтернативу",
      no_longer_needed: "Больше не нужен",
      language_not_supported: "Язык не поддерживается",
      search_engine_is_not_available: "Нужная поисковая система недоступна",
      i_dont_know_how_to_add_commands: "Не знаю, как добавить команды",
      settings_are_complicated: "Настройки слишком сложные",
      [UNINSTALL_OTHER_OPTION]: "Другое",
    },
  },
}
export default lang
