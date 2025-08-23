"use client"

import css from "@/app/page.module.css"
import { Button } from "@/components/ui/button"

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
        <div>
          <label>Input</label>
          <input
            className="border border-stone-300 rounded-md w-full px-2 py-1"
            type="text"
          />
        </div>
        <div>
          <label>Textarea</label>
          <textarea className="border border-stone-300 rounded-md w-full px-2 py-1" />
        </div>

        <h1>Browser Feature Test</h1>
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
