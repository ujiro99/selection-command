"use client"

import { Send } from "lucide-react"
import css from "@/app/page.module.css"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import "quill/dist/quill.snow.css"

// Dynamically import Quill editor for client-side only
const QuillWrapper = dynamic(() => import("./QuillWrapper"), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
})

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
    <main className={css.main}>
      <div className="w-full space-y-4">
        <h2>Browser Feature Test</h2>

        <form className="space-y-4">
          <div>
            <h3 className="mb-2 font-bold">Text</h3>
            <input
              className="border border-stone-300 rounded-md w-full px-2 py-1"
              type="text"
              placeholder="text input"
            />
          </div>

          <div>
            <h3 className="mb-2 font-bold">Password</h3>
            <input
              className="border border-stone-300 rounded-md w-full px-2 py-1"
              type="password"
              placeholder="password input"
            />
          </div>

          <div>
            <h3 className="mb-2 font-bold">Number</h3>
            <input
              className="border border-stone-300 rounded-md w-full px-2 py-1"
              type="number"
              defaultValue={0}
            />
          </div>

          <div>
            <h3 className="mb-2 font-bold">Textarea</h3>
            <textarea className="border border-stone-300 rounded-md w-full px-2 py-1" />
          </div>

          <div>
            <h3 className="mb-2 font-bold">Checkbox</h3>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>Checkbox 1 (checked)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Checkbox 2 (unchecked)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Checkbox 3 (unchecked)</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-bold">Radio</h3>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="radio-group"
                  value="option1"
                  defaultChecked
                />
                <span>Option 1</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="radio-group" value="option2" />
                <span>Option 2</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="radio-group" value="option3" />
                <span>Option 3</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-bold">Select</h3>
            <select className="border border-stone-300 rounded-md w-full px-2 py-1">
              <option value="">-- Select an option --</option>
              <option value="apple">Apple</option>
              <option value="banana">Banana</option>
              <option value="cherry">Cherry</option>
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-bold">Range</h3>
            <input
              type="range"
              className="w-full"
              min={0}
              max={100}
              defaultValue={50}
            />
          </div>

          <div>
            <h3 className="mb-2 font-bold">Color</h3>
            <input type="color" defaultValue="#3b82f6" />
          </div>

          <div>
            <h3 className="mb-2 font-bold">Date</h3>
            <input
              className="border border-stone-300 rounded-md px-2 py-1"
              type="date"
            />
          </div>

          <div>
            <h3 className="mb-2 font-bold">Time</h3>
            <input
              className="border border-stone-300 rounded-md px-2 py-1"
              type="time"
            />
          </div>

          <div>
            <h3 className="mb-2 font-bold">WYSIWYG Editor Test</h3>
            <QuillWrapper />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-400 text-white rounded-md"
            >
              <Send size={16} />
              Send
            </Button>
          </div>
        </form>

        <div className="flex gap-2">
          <Button onClick={() => window.alert("This is an alert dialog")}>
            alert
          </Button>
          <Button onClick={() => window.confirm("This is a confirm dialog")}>
            confirm
          </Button>
          <Button
            onClick={() =>
              window.prompt("This is a prompt dialog", "default value")
            }
          >
            prompt
          </Button>
        </div>

        <div className="flex gap-2">
          <input type="file" id="fileInput" />
          <label htmlFor="fileInput" className="cursor-pointer">
            Select File
          </label>
        </div>

        <div>
          <Button onClick={() => window.print()}>Print</Button>
        </div>

        <div>
          <Button onClick={() => saveFile()}>Save File</Button>
        </div>

        <div>
          <a
            href="data:text/plain;charset=utf-8,Download test"
            download="test.txt"
            className="text-blue-500 underline"
          >
            Download File
          </a>
        </div>

        <div>
          <Button onClick={() => requestGeolocation()}>Get Location</Button>
        </div>
        <div>
          <Button onClick={() => requestNotification()}>
            Request Notification
          </Button>
        </div>
      </div>
    </main>
  )
}
