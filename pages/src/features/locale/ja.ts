import { SORT_ORDER } from '@/const'

export default {
  errorPage: {
    error: '送信エラーが発生しました。',
    afterShortTime: '暫く経ってからお問い合わせください。',
  },
  commandShare: {
    title: 'コマンド共有',
    formTitle: 'コマンド共有フォーム',
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: '検索URL',
    [SORT_ORDER.title]: 'タイトル',
    [SORT_ORDER.download]: 'ダウンロード数',
    [SORT_ORDER.star]: 'スター数',
    [SORT_ORDER.addedAt]: '登録日',
    new: '新',
    old: '古',
  },
  commandForm: {
    title: 'コマンド',
    name: 'コマンド名',
    description: '説明',
    tags: 'タグ',
    tagsPlaceholder: 'タグを追加',
    tagsHelp:
      'タグを追加すると、他のユーザーがコマンドを見つけやすくなります。',
    submit: '送信',
    cancel: 'キャンセル',
    error: {
      name: 'コマンド名を入力してください。',
      description: '説明を入力してください。',
      tags: 'タグを入力してください。',
    },
  },
}
