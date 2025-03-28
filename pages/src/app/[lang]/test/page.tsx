import css from '@/app/page.module.css'

export default function Page() {
  return (
    <main className={css.main}>
      <div className="w-full">
        <div>
          <label>Input</label>
          <input
            className="border border-stone-300 rounded-md w-full px-2 py-1"
            type="text"
          />
        </div>
        <div className="mt-4">
          <label>Textarea</label>
          <textarea className="border border-stone-300 rounded-md w-full px-2 py-1" />
        </div>
      </div>
    </main>
  )
}
