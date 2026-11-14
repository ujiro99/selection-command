"use client"

import { Send } from "lucide-react"
import layoutCss from "@/app/page.module.css"
import css from "./test.module.css"
import dynamic from "next/dynamic"
import "quill/dist/quill.snow.css"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

// Dynamically import Quill editor for client-side only
const QuillWrapper = dynamic(() => import("./QuillWrapper"), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
})

function SearchQuery() {
  const searchParams = useSearchParams()
  const search = searchParams.get("k") ?? ""
  return (
    <pre className={css.query}>
      <code data-testid="searchQuery">{search}</code>
    </pre>
  )
}

export default function Page() {
  // File save (Blob + a element download)
  function saveFile() {
    const blob = new Blob(["File save test"], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "save_test.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Request geolocation
  function requestGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          console.log(
            "Geolocation success: " +
              pos.coords.latitude +
              "," +
              pos.coords.longitude,
          ),
        (err) => console.log("Geolocation error: " + err.message),
      )
    } else {
      // console.log('Geolocation API not supported')
    }
  }

  // Request notification permission
  function requestNotification() {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        // console.log('Notification permission: ' + permission)
        if (permission === "granted") {
          new Notification("Notification Test", {
            body: "Notification permission granted.",
          })
        }
      })
    } else {
      // console.log('Notification API not supported')
    }
  }

  return (
    <main className={layoutCss.main}>
      <div className={css.content}>
        <h2 className={css.title}>Browser Feature Test</h2>

        <section className={css.section}>
          <h3 className={css.heading}>Search Query Parameter</h3>
          <Suspense fallback={<div>Loading...</div>}>
            <SearchQuery />
          </Suspense>
        </section>

        <form className={css.form}>
          <div>
            <h3 className={css.heading}>Text</h3>
            <input
              className={`${css.field} ${css.fullWidth}`}
              type="text"
              placeholder="text input"
            />
          </div>

          <div>
            <h3 className={css.heading}>Password</h3>
            <input
              className={`${css.field} ${css.fullWidth}`}
              type="password"
              placeholder="password input"
            />
          </div>

          <div>
            <h3 className={css.heading}>Number</h3>
            <input
              className={`${css.field} ${css.fullWidth}`}
              type="number"
              defaultValue={0}
            />
          </div>

          <div>
            <h3 className={css.heading}>Textarea</h3>
            <textarea className={`${css.field} ${css.fullWidth}`} />
          </div>

          <div>
            <h3 className={css.heading}>Checkbox</h3>
            <div className={css.choices}>
              <label className={css.choice}>
                <input type="checkbox" defaultChecked />
                <span>Checkbox 1 (checked)</span>
              </label>
              <label className={css.choice}>
                <input type="checkbox" />
                <span>Checkbox 2 (unchecked)</span>
              </label>
              <label className={css.choice}>
                <input type="checkbox" />
                <span>Checkbox 3 (unchecked)</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className={css.heading}>Radio</h3>
            <div className={css.choices}>
              <label className={css.choice}>
                <input
                  type="radio"
                  name="radio-group"
                  value="option1"
                  defaultChecked
                />
                <span>Option 1</span>
              </label>
              <label className={css.choice}>
                <input type="radio" name="radio-group" value="option2" />
                <span>Option 2</span>
              </label>
              <label className={css.choice}>
                <input type="radio" name="radio-group" value="option3" />
                <span>Option 3</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className={css.heading}>Select</h3>
            <select className={`${css.field} ${css.fullWidth}`}>
              <option value="">-- Select an option --</option>
              <option value="apple">Apple</option>
              <option value="banana">Banana</option>
              <option value="cherry">Cherry</option>
            </select>
          </div>

          <div>
            <h3 className={css.heading}>Range</h3>
            <input
              type="range"
              className={css.fullWidth}
              min={0}
              max={100}
              defaultValue={50}
            />
          </div>

          <div>
            <h3 className={css.heading}>Color</h3>
            <input type="color" defaultValue="#3b82f6" />
          </div>

          <div>
            <h3 className={css.heading}>Date</h3>
            <input className={css.field} type="date" />
          </div>

          <div>
            <h3 className={css.heading}>Time</h3>
            <input className={css.field} type="time" />
          </div>

          <div>
            <h3 className={css.heading}>WYSIWYG Editor Test</h3>
            <QuillWrapper />
          </div>

          <div className={css.actions}>
            <button
              type="submit"
              className={`${css.button} ${css.submitButton}`}
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </form>

        <div className={css.row}>
          <button
            className={css.button}
            onClick={() => window.alert("This is an alert dialog")}
          >
            alert
          </button>
          <button
            className={css.button}
            onClick={() => window.confirm("This is a confirm dialog")}
          >
            confirm
          </button>
          <button
            className={css.button}
            onClick={() =>
              window.prompt("This is a prompt dialog", "default value")
            }
          >
            prompt
          </button>
        </div>

        <div className={css.row}>
          <input type="file" id="fileInput" />
          <label htmlFor="fileInput" className={css.fileLabel}>
            Select File
          </label>
        </div>

        <div>
          <button className={css.button} onClick={() => window.print()}>
            Print
          </button>
        </div>

        <div>
          <button className={css.button} onClick={() => saveFile()}>
            Save File
          </button>
        </div>

        <div>
          <a
            href="data:text/plain;charset=utf-8,Download test"
            download="test.txt"
            className={css.link}
          >
            Download File
          </a>
        </div>

        <div>
          <button className={css.button} onClick={() => requestGeolocation()}>
            Get Location
          </button>
        </div>
        <div>
          <button className={css.button} onClick={() => requestNotification()}>
            Request Notification
          </button>
        </div>
      </div>
    </main>
  )
}
