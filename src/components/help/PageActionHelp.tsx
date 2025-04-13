import { useState, useRef, useEffect } from 'react'
import { CircleHelp } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogPortal,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Tooltip } from '@/components/Tooltip'
import { t } from '@/services/i18n'
import { cn } from '@/lib/utils'

import css from './help.module.css'

type HelpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Props = {
  className?: string
}
export const PaeActionHelp = ({ className }: Props) => {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 text-sm text-gray-600 outline-gray-200 p-1 px-1.5 rounded-md transition hover:bg-gray-100 hover:scale-[110%] hover:text-sky-500 group/button',
          className,
        )}
        onClick={() => setOpen(true)}
        ref={buttonRef}
      >
        <CircleHelp
          className="stroke-gray-500 group-hover/button:stroke-sky-500"
          size={20}
        />
        <span className="leading-none pb-0.5">Help</span>
      </button>
      <HelpDialog open={open} onOpenChange={setOpen} />
      <Tooltip
        positionElm={buttonRef.current}
        text={t('help_pageAction_title')}
      />
    </>
  )
}

const HelpDialog = ({ open, onOpenChange }: HelpDialogProps) => {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const [api, setApi] = useState<CarouselApi>()
  const handleOpenAutoFocus = (e: Event) => {
    closeRef.current?.focus()
    e.preventDefault()
  }

  const scrollTo = (index: number) => {
    if (!api) {
      return
    }
    api.scrollTo(index)
  }

  useEffect(() => {
    if (!api) {
      return
    }
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent
          className="pageActionHelp w-[46rem] max-w-4xl text-gray-700"
          onOpenAutoFocus={handleOpenAutoFocus}
        >
          <DialogHeader>
            <DialogTitle>{t('help_pageAction_title')}</DialogTitle>
          </DialogHeader>
          <Carousel className="w-[38rem] mx-[auto] mt-1" setApi={setApi}>
            <CarouselContent>
              <CarouselItem>
                <DialogDescription>
                  Page Actionは、<b>ユーザー操作を記録・再現</b>する機能です。
                </DialogDescription>
                <div className={css.carouselContent}>
                  <div className="text-sm">
                    例として、以下のような使い方ができます。
                    <ul className="list-disc list-inside">
                      <li>決まったプロンプト＋選択文字列をLLMへ入力</li>
                      <li>URLをテキスト欄へ入力して、ボタンを押す</li>
                      <li>などなど...</li>
                    </ul>
                  </div>
                  <video controls className="rounded-md w-[90%] mt-4 mx-auto">
                    <source
                      src="https://github.com/ujiro99/selection-command/raw/refs/heads/main/docs/PageAction/PageAction%20play.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </CarouselItem>
              <CarouselItem>
                <DialogDescription>
                  Page Actionは、<b>RECボタンから</b>記録できます。
                </DialogDescription>
                <div className={css.carouselContent}>
                  <div className="text-sm">
                    【作成手順】
                    <ol className="list-decimal list-inside">
                      <li>
                        操作したいページのURLを入力し、RECボタンを押して記録を開始します。
                      </li>
                      <li>ウィンドウが開いたら記録したい操作を行います。</li>
                      <li>
                        完了したら、記録メニューのCompleteボタンを押します。
                      </li>
                    </ol>
                  </div>
                  <video controls className="rounded-md w-[90%] mt-4 mx-auto">
                    <source
                      src="https://github.com/ujiro99/selection-command/raw/refs/heads/main/docs/PageAction/PageAction%20record.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </CarouselItem>
              <CarouselItem>
                <DialogDescription>
                  Page Actionでは<b>以下の操作</b>を記録できます。
                </DialogDescription>
                <div className={css.carouselContent}>
                  <table className={css.table}>
                    <thead>
                      <tr className="bg-gray-200">
                        <th className={css.tableCell}>操作</th>
                        <th className={css.tableCell}>説明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={css.tableCell}>左クリック</td>
                        <td className={css.tableCell}>
                          クリック、ダブルクリック、トリプルクリックを記録します。
                        </td>
                      </tr>
                      <tr>
                        <td className={css.tableCell}>画面スクロール</td>
                        <td className={css.tableCell}>
                          10px以上のスクロールを記録します。
                        </td>
                      </tr>
                      <tr>
                        <td className={css.tableCell}>キー入力</td>
                        <td className={css.tableCell}>
                          <ul className="list-disc list-inside">
                            <li>
                              Ctrl同時押しなど、一部のキー入力だけが記録されます。
                            </li>
                            <li>
                              記録されたキー操作でも、きちんと動作しない場合があります。
                            </li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className={css.tableCell}>テキスト入力</td>
                        <td className={css.tableCell}>
                          <ul className="list-disc list-inside">
                            <li>入力欄へのテキスト入力を記録します。</li>
                            <li>以下の変数を使用できます。</li>
                            <li className="list-circle ml-4">
                              選択的テキスト、URL、クリップボード
                            </li>
                            <li>
                              入力欄へのフォーカス中は、他の操作は記録されません。
                            </li>
                            <li className="list-circle ml-4">
                              ※Tab、Enterキーだけは記録されます。
                            </li>
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-8 text-base">
                    これらの操作を、最大10ステップまで記録できます
                  </p>
                </div>
              </CarouselItem>
              <CarouselItem>
                <DialogDescription>
                  <b>記録後の編集</b>について
                </DialogDescription>
                <div className={css.carouselContent}>
                  <div className="text-sm">
                    <ol className="list-decimal list-inside">
                      <li>
                        テキスト入力の編集とステップの削除は、設定画面からも実行できます。
                      </li>
                      <li>
                        既存のPage
                        Actionをコピーし、一部だけ編集したコマンドを簡単に作成できます。
                      </li>
                    </ol>
                  </div>
                  <video controls className="rounded-md w-[90%] mt-4 mx-auto">
                    <source
                      src="https://github.com/ujiro99/selection-command/raw/refs/heads/main/docs/PageAction/PageAction%20edit.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </CarouselItem>
              <CarouselItem>
                <DialogDescription>
                  <b>コマンドの共有</b>について
                </DialogDescription>
                <div className={css.carouselContent}>
                  <div className="text-sm">
                    Selection Command Hubから、Page
                    Actionコマンドの共有と取得ができます。
                    <video controls className="rounded-md w-[90%] mt-4 mx-auto">
                      <source
                        src="https://github.com/ujiro99/selection-command/raw/refs/heads/main/docs/PageAction/PageAction%20share.mp4"
                        type="video/mp4"
                      />
                    </video>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <ul className="flex w-[30%] mt-3 mx-[auto] gap-2">
              {Array.from({ length: count }, (_, i) => (
                <li key={i} style={{ width: `${100 / count}%` }}>
                  <button
                    type="button"
                    className={cn(
                      'bg-gray-200 h-2 w-full hover:bg-sky-300 rounded transition',
                      i === current - 1 ? 'bg-gray-500' : '',
                    )}
                    onClick={() => scrollTo(i)}
                  ></button>
                </li>
              ))}
            </ul>
            <CarouselPrevious type="button" />
            <CarouselNext type="button" />
          </Carousel>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="lg">
                {t('labelClose')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
