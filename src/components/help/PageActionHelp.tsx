import { useState, useRef, useEffect } from "react"
import { CircleHelp } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogPortal,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Tooltip } from "@/components/Tooltip"
import { t } from "@/services/i18n"
import { cn } from "@/lib/utils"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"
import { SCREEN } from "@/const"

import css from "./help.module.css"

type HelpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Props = {
  className?: string
}
export const PageActionHelp = ({ className }: Props) => {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 text-sm text-gray-600 outline-gray-200 p-1 px-1.5 rounded-md transition hover:bg-gray-100 hover:scale-[110%] hover:text-sky-500 group/button",
          className,
        )}
        onClick={() => {
          setOpen(true)
          sendEvent(
            ANALYTICS_EVENTS.SHOW_HELP,
            {
              event_label: "pageAction",
            },
            SCREEN.OPTION,
          )
        }}
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
        text={t("help_pageAction_title")}
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
    api.on("select", () => {
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
            <DialogTitle>{t("help_pageAction_title")}</DialogTitle>
          </DialogHeader>
          <Carousel className="w-[38rem] mx-[auto] mt-1" setApi={setApi}>
            <CarouselContent>
              <CarouselItem>
                <DialogDescription
                  dangerouslySetInnerHTML={{
                    __html: t("help_pageAction_description"),
                  }}
                />
                <div className={css.carouselContent}>
                  <div className="text-sm">
                    {t("help_pageAction_example")}
                    <ul
                      className="list-disc list-inside"
                      dangerouslySetInnerHTML={{
                        __html: t("help_pageAction_example_1"),
                      }}
                    />
                  </div>
                  <video
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    className="rounded-md w-[90%] mt-4 mx-auto"
                  >
                    <source
                      src="https://github.com/ujiro99/selection-command/raw/refs/heads/main/docs/PageAction/PageAction%20play.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </CarouselItem>
              <CarouselItem>
                <DialogDescription
                  dangerouslySetInnerHTML={{
                    __html: t("help_pageAction_record"),
                  }}
                />
                <div className={css.carouselContent}>
                  <div className="text-sm">
                    {t("help_pageAction_record_procedure")}
                    <ol
                      className="list-decimal list-inside"
                      dangerouslySetInnerHTML={{
                        __html: t("help_pageAction_record_procedure_list"),
                      }}
                    />
                  </div>
                  <video
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    className="rounded-md w-[90%] mt-4 mx-auto"
                  >
                    <source
                      src="https://github.com/ujiro99/selection-command/raw/refs/heads/main/docs/PageAction/PageAction%20record.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </CarouselItem>
              <CarouselItem>
                <DialogDescription
                  dangerouslySetInnerHTML={{
                    __html: t("help_pageAction_record_detail"),
                  }}
                />
                <div className={css.carouselContent}>
                  <table className={css.table}>
                    <thead>
                      <tr className="bg-gray-200">
                        <th className={css.tableCell}>
                          {t("help_pageAction_action")}
                        </th>
                        <th className={css.tableCell}>
                          {t("help_pageAction_desc")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={css.tableLabel}>
                          {t("help_pageAction_left_click")}
                        </td>
                        <td className={css.tableCell}>
                          {t("help_pageAction_left_click_desc")}
                        </td>
                      </tr>
                      <tr>
                        <td className={css.tableLabel}>
                          {t("help_pageAction_scroll")}
                        </td>
                        <td className={css.tableCell}>
                          {t("help_pageAction_scroll_desc")}
                        </td>
                      </tr>
                      <tr>
                        <td className={css.tableLabel}>
                          {t("help_pageAction_keyboard")}
                        </td>
                        <td className={css.tableCell}>
                          <ul
                            className="list-disc list-inside"
                            dangerouslySetInnerHTML={{
                              __html: t("help_pageAction_keyboard_desc"),
                            }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className={css.tableLabel}>
                          {t("help_pageAction_input")}
                        </td>
                        <td className={css.tableCell}>
                          <ul className="list-disc list-inside">
                            <li>{t("help_pageAction_input_desc_1")}</li>
                            <li>{t("help_pageAction_input_desc_2")}</li>
                            <li className="list-circle ml-4">
                              {t("help_pageAction_input_desc_3")}
                            </li>
                            <li>{t("help_pageAction_input_desc_4")}</li>
                            <li className="list-circle ml-4">
                              {t("help_pageAction_input_desc_5")}
                            </li>
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-8 text-base">
                    {t("help_pageAction_input_desc_6")}
                  </p>
                </div>
              </CarouselItem>
              <CarouselItem>
                <DialogDescription
                  dangerouslySetInnerHTML={{
                    __html: t("help_pageAction_edit"),
                  }}
                />
                <div className={css.carouselContent}>
                  <div className="text-sm">
                    <ol
                      className="list-decimal list-inside"
                      dangerouslySetInnerHTML={{
                        __html: t("help_pageAction_edit_desc"),
                      }}
                    />
                  </div>
                  <video
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    className="rounded-md w-[90%] mt-4 mx-auto"
                  >
                    <source
                      src="https://github.com/ujiro99/selection-command/raw/refs/heads/main/docs/PageAction/PageAction%20edit.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </CarouselItem>
              <CarouselItem>
                <DialogDescription
                  dangerouslySetInnerHTML={{
                    __html: t("help_pageAction_share"),
                  }}
                />
                <div className={css.carouselContent}>
                  <div className="text-sm">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: t("help_pageAction_share_desc"),
                      }}
                    />
                    <video
                      controls
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      className="rounded-md w-[90%] mt-4 mx-auto"
                    >
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
                      "bg-gray-200 h-2 w-full hover:bg-sky-300 rounded transition",
                      i === current - 1 ? "bg-sky-700" : "",
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
                {t("labelClose")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
