import { SORT_ORDER, OPEN_MODE } from '@/const'
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from '@/const'

const lang = {
  name: '한국어',
  shorName: 'ko',
  languageName: 'Korean',
  errorPage: {
    error: '전송 중 오류가 발생했습니다.',
    afterShortTime: '잠시 후 다시 시도해 주세요.',
  },
  commandShare: {
    title: '명령어 공유',
    formTitle: '명령어 공유 양식',
  },
  tagPicker: {
    notFound: '찾을 수 없음',
    create: '생성하시겠습니까?',
  },
  inputForm: {
    title: {
      label: '제목',
      description: '명령어의 제목으로 표시됩니다.',
      placeholder: '명령어 제목',
      message: {
        min3: '제목은 최소 3자 이상이어야 합니다.',
        max100: '제목은 최대 100자까지 가능합니다.',
      },
    },
    searchUrl: {
      label: '검색 URL',
      description: '`%s`를 선택한 텍스트로 대체합니다.',
      placeholder: '검색 URL',
      faviconAlt: '검색 URL의 파비콘',
      message: {
        url: 'URL 형식이 올바르지 않습니다.',
        unique: '이미 등록되어 있습니다.',
      },
    },
    description: {
      label: '명령어 설명',
      description: '명령어의 설명으로 표시됩니다.',
      placeholder: '명령어 설명',
      message: {
        max200: '설명은 최대 200자까지 가능합니다.',
      },
    },
    tags: {
      label: '태그',
      description: '명령어의 분류로 표시됩니다.',
      message: {
        max5: '태그는 최대 20자까지 가능합니다.',
        max20: '최대 5개의 태그가 가능합니다.',
      },
    },
    iconUrl: {
      label: '아이콘 URL',
      description: '메뉴의 아이콘으로 표시됩니다.',
      placeholder: '아이콘 URL',
      message: {
        url: 'URL 형식이 올바르지 않습니다.',
      },
    },
    openMode: {
      label: '열기 모드',
      description: '결과의 표시 방법입니다.',
      options: {
        [OPEN_MODE.POPUP]: '팝업',
        [OPEN_MODE.WINDOW]: '창',
        [OPEN_MODE.TAB]: '탭',
        [OPEN_MODE.PAGE_ACTION]: '페이지 액션',
      },
    },
    openModeSecondary: {
      label: 'Ctrl + 클릭',
      description: 'Ctrl + 클릭 시 결과의 표시 방법입니다.',
    },
    spaceEncoding: {
      label: '공백 인코딩',
      description: '선택한 텍스트의 공백을 대체합니다.',
      options: {
        plus: '플러스(+)',
        percent: '퍼센트(%20)',
      },
    },
    formDescription: '명령어 공유를 요청합니다.',
    formOptions: '옵션',
    confirm: '입력 내용 확인',
    pageAction: {
      label: '페이지 액션',
      description: '실행될 작업',
    },
    PageActionOption: {
      startUrl: {
        label: '시작 페이지 URL',
        description: '페이지 액션이 시작될 페이지의 URL입니다.',
        faviconAlt: '시작 페이지 URL의 파비콘',
      },
    },
  },
  confirmForm: {
    formDescription: '다음 내용이 맞습니까?',
    caution:
      '※ 전송된 정보는 이 사이트에 공개됩니다.\n개인 정보나 기밀 정보를 포함한 정보의 공유는 삼가해 주세요.',
    back: '수정하기',
    submit: '공유하기',
  },
  SendingForm: {
    sending: '전송 중...',
  },
  completeForm: {
    formDescription: '전송이 완료되었습니다.',
    thanks:
      '명령어를 공유해 주셔서 감사합니다!\n개발자가 사이트에 반영하는 데 2~3일이 소요될 수 있습니다.\n공개될 때까지 잠시만 기다려 주세요.',
    aboudDelete: '전송 후 삭제 요청은 아래 링크를 이용해 주세요.',
    supportHub: '지원 허브로 이동',
  },
  errorForm: {
    formDescription: '전송 중 오류가 발생했습니다...',
    message:
      '잠시 후 다시 시도하거나 아래 링크를 통해 개발자에게 문의해 주세요.',
    supportHub: '지원 허브로 이동',
  },
  notFound: {
    title: '페이지를 찾을 수 없습니다',
    message: '접근하려는 페이지가 존재하지 않습니다.\nURL을 확인해 주세요.',
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: '검색 URL',
    [SORT_ORDER.title]: '제목',
    [SORT_ORDER.download]: '다운로드 수',
    [SORT_ORDER.star]: '별표 수',
    [SORT_ORDER.addedAt]: '등록일',
    new: '최신',
    old: '오래된',
  },
  about: {
    terms: '이용약관',
    privacy: '개인정보처리방침',
    cookie: '쿠키 정책',
  },
  cookieConsent: {
    title: '쿠키 사용에 대해',
    message:
      '이 사이트는 더 나은 경험을 제공하기 위해 쿠키를 사용합니다. 자세한 내용은 쿠키 정책을 참조하세요.',
    accept: '동의',
    decline: '거부',
  },
  uninstallForm: {
    title: '제거가 완료되었습니다.',
    description:
      '지금까지 Selection Command를 이용해 주셔서 감사합니다. 헤어지게 되어 매우 아쉽지만, 향후 확장 프로그램 개선을 위해 아래 설문에 응답해 주시면 감사하겠습니다.',
    reinstall: '실수로 제거하신 경우 아래 링크에서 다시 설치할 수 있습니다.',
    wantedToUseTitle: '어떤 기능을 사용하고 싶었나요? (복수 선택 가능)',
    wantedToUsePlaceholder: '하고 싶었던 일을 알려주세요',
    reasonTitle: '제거한 이유를 알려주세요. (복수 선택 가능)',
    otherReasonPlaceholder: '구체적인 이유를 알려주세요',
    detailsTitle: '가능하다면 자세한 내용을 알려주세요.',
    detailsPlaceholder:
      '제거 이유의 상세 내용,\n하고 싶었던 일이나 어려웠던 점,\n작동하지 않았던 사이트 등',
    submit: '전송',
    submitting: '전송 중...',
    success: {
      title: '설문 전송이 완료되었습니다.',
      message:
        '응답해 주셔서 감사합니다. 소중한 의견을 주셔서 감사합니다.\n이 양식 외에 직접 의견을 주실 수 있는 경우, takeda.yujiro@gmail.com으로 제목을 명시하여 연락해 주시기 바랍니다.',
    },
    error: '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    wantedToUse: {
      search_selected_text: '선택한 텍스트 검색',
      ai_chatbot: 'AI 챗봇 (ChatGPT 등)',
      link_preview: '링크 미리보기',
      [OTHER_OPTION]: '기타',
    },
    reasons: {
      difficult_to_use: '사용 방법을 몰랐어요',
      not_user_friendly: '사용자 친화적이지 않아요',
      not_working: '기대한 대로 동작하지 않았어요',
      missing_features: '필요한 기능이 없었어요',
      too_many_permissions: '권한이 너무 많아요',
      found_better: '더 나은 대안을 찾았어요',
      no_longer_needed: '더 이상 필요하지 않아요',
      language_not_supported: '원하는 언어가 지원되지 않아요',
      search_engine_is_not_available: '원하는 검색 엔진이 없음',
      i_dont_know_how_to_add_commands: '명령어 추가 방법을 모름',
      settings_are_complicated: '설정이 너무 복잡함',
      [UNINSTALL_OTHER_OPTION]: '기타',
    },
  },
}
export default lang
