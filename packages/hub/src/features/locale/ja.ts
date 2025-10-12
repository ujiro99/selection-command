import { SORT_ORDER, OPEN_MODE } from "@/const"
import { OTHER_OPTION, UNINSTALL_OTHER_OPTION } from "@/const"

const lang = {
  name: "日本語",
  shorName: "ja",
  languageName: "Japanese",
  errorPage: {
    error: "送信エラーが発生しました。",
    afterShortTime: "暫く経ってからお問い合わせください。",
  },
  commandShare: {
    title: "コマンド共有",
    formTitle: "コマンド共有フォーム",
  },
  tagPicker: {
    notFound: "見つかりません",
    create: "作りますか？",
  },
  inputForm: {
    title: {
      label: "タイトル",
      description: "コマンドのタイトルとして表示されます。",
      placeholder: "コマンドのタイトル",
      message: {
        min3: "タイトルは最短3文字です。",
        max100: "タイトルは最長100文字です。",
      },
    },
    searchUrl: {
      label: "検索URL",
      description: "`%s`を選択テキストに置換します。",
      placeholder: "検索URL",
      faviconAlt: "検索URLのファビコン",
      message: {
        url: "URL形式が正しくありません。",
        unique: "既に登録されています。",
      },
    },
    description: {
      label: "コマンドの説明",
      description: "コマンドの説明として表示されます。",
      placeholder: "コマンドの説明",
      message: {
        max200: "説明は最長200文字です。",
      },
    },
    tags: {
      label: "タグ",
      description: "コマンドの分類として表示されます。",
      message: {
        max5: "タグは最長20文字です。",
        max20: "タグは最大5つまでです。",
      },
    },
    iconUrl: {
      label: "アイコンURL",
      description: "メニューのアイコンとして表示されます。",
      placeholder: "アイコンURL",
      message: {
        url: "URL形式が正しくありません。",
      },
    },
    openMode: {
      label: "OpenMode",
      description: "結果の表示方法です。",
      options: {
        [OPEN_MODE.POPUP]: "Popup",
        [OPEN_MODE.WINDOW]: "Window",
        [OPEN_MODE.TAB]: "Tab",
        [OPEN_MODE.BACKGROUND_TAB]: "Background Tab",
        [OPEN_MODE.PAGE_ACTION]: "PageAction",
      },
    },
    openModeSecondary: {
      label: "Ctrl + クリック",
      description: "Ctrl + クリック時の結果の表示方法です。",
    },
    spaceEncoding: {
      label: "スペースのエンコード",
      description: "選択テキスト中のスペースを置換します。",
      options: {
        plus: "Plus(+)",
        percent: "Percent(%20)",
      },
    },
    formDescription: "コマンドの共有を申請します。",
    formOptions: "オプション",
    confirm: "入力内容を確認する",
    pageAction: {
      label: "ページアクション",
      description: "実行される操作",
    },
    PageActionOption: {
      startUrl: {
        label: "開始URL",
        description: "ページアクションを開始するURLです。",
        faviconAlt: "開始URLのファビコン",
      },
      openMode: {
        label: "ウィンドウ表示方法",
        description: "ウィンドウの表示方法です。",
      },
    },
  },
  confirmForm: {
    formDescription: "以下の内容で間違いありませんか？",
    caution:
      "※ 送信された情報は本サイト上で公開されます。\n個人情報や機密情報を含む情報の共有はお控えください。",
    back: "修正する",
    submit: "共有実行",
  },
  SendingForm: {
    sending: "送信中...",
  },
  completeForm: {
    formDescription: "送信が完了しました。",
    thanks:
      "コマンドを共有して頂きありがとうございます！\n開発者がサイトに反映するまで2〜3日かかる場合がございます。\n公開まで、今しばらくお待ちください。",
    aboudDelete: "申請後の削除のご要望は、こちらのリンクよりお願いします。",
    supportHub: "サポートハブへ",
  },
  errorForm: {
    formDescription: "送信エラーが発生しました⋯。",
    message:
      "時間をおいて再度お試し頂くか、\n以下のリンクから開発者までお問い合わせください。",
    supportHub: "サポートハブへ",
  },
  notFound: {
    title: "ページが見つかりませんでした",
    message:
      "アクセスしようとしたページは存在しません。\nURLのご確認をお願いします。",
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: "検索URL",
    [SORT_ORDER.title]: "タイトル",
    [SORT_ORDER.download]: "ダウンロード数",
    [SORT_ORDER.star]: "スター数",
    [SORT_ORDER.addedAt]: "登録日",
    new: "新",
    old: "古",
  },
  about: {
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    cookie: "Cookieポリシー",
  },
  cookieConsent: {
    title: "Cookieの使用について",
    message:
      "当サイトでは、より良い体験を提供するためにCookieを使用しています。詳細はCookieポリシーをご覧ください。",
    accept: "同意する",
    decline: "同意しない",
  },
  uninstallForm: {
    title: "アンインストールが完了しました。",
    description:
      "これまでSelection Commandをご利用いただきありがとうございました。 お別れするのはとても残念ですが、今後の拡張機能の改善のため、以下のアンケートにご協力いただけますと幸いです。",
    reinstall:
      "誤ってアンインストールされた場合は、以下のリンクから再インストールできます。",
    wantedToUseTitle: "どの機能を使いたかったですか？(複数選択可能)",
    wantedToUsePlaceholder: "やりたかったことをお聞かせください",
    reasonTitle: "アンインストールした理由を教えてください。(複数選択可能)",
    otherReasonPlaceholder: "具体的な理由をお聞かせください",
    detailsTitle: "よろしければ詳細を教えてください。",
    detailsPlaceholder:
      "アンインストール理由の詳細、\nやりたかったこと や 困ったこと、\n使えなかったサイト等",
    submit: "送信",
    submitting: "送信中...",
    success: {
      title: "アンケート送信が完了しました。",
      message:
        "ご回答ありがとうございました。貴重なご意見をいただき、誠にありがとうございます。\nこのフォーム以外で直接ご意見をいただける場合は、ぜひ takeda.yujiro@gmail.com まで、件名を明記のうえご連絡ください。",
    },
    error: "送信に失敗しました。時間をおいて再度お試しください。",
    wantedToUse: {
      search_selected_text: "選択テキストの検索",
      ai_chatbot: "AIチャットボット(ChatGPTなど)",
      link_preview: "リンクプレビュー",
      [OTHER_OPTION]: "その他",
    },
    reasons: {
      not_user_friendly: "使いづらかった",
      not_working: "期待通りに動作しなかった",
      missing_features: "必要な機能がなかった",
      too_many_permissions: "必要な権限が多すぎる",
      found_better: "より良い代替製品を見つけた",
      no_longer_needed: "もう必要なくなった",
      language_not_supported: "希望する言語に対応していない",
      search_engine_is_not_available: "使いたい検索エンジンが無い",
      i_dont_know_how_to_add_commands: "コマンドの追加方法が分からない",
      settings_are_complicated: "設定が複雑すぎる",
      [UNINSTALL_OTHER_OPTION]: "その他",
    },
  },
}
export default lang
