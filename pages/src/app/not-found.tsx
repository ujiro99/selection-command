import { Image } from '@/components/Image'

export default function NotFound() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex items-center gap-1.5 text-3xl font-[family-name:var(--font-geist-mono)] font-medium">
        <h1 className="text-4xl">404 ページが見つかりませんでした</h1>
      </header>
      <div className="flex felx-row items-center justify-center w-full text-center font-[family-name:var(--font-geist-mono)]">
        <p className="text-2xl mt-[-60px]">
          <span>アクセスしようとしたページは存在しません。</span>
          <br />
          <span>URLのご確認をお願いします。</span>
        </p>
        <Image
          src="/ozigi_suit_man_simple.png"
          alt="404 Not found"
          className="ml-8"
          width={80}
          height={280}
          loading="lazy"
        />
      </div>
    </div>
  )
}
