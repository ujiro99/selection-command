"use client"

import { useEffect, useRef } from "react"
import Quill from "quill"

export default function QuillWrapper() {
  const quillRef = useRef<HTMLDivElement>(null)
  const quillInstanceRef = useRef<Quill | null>(null)

  useEffect(() => {
    if (
      quillRef.current &&
      quillRef.current.children.length === 0 &&
      !quillInstanceRef.current
    ) {
      quillInstanceRef.current = new Quill(quillRef.current, {
        theme: "snow",
        placeholder: "Write something...",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            ["link", "blockquote", "code-block"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
          ],
        },
      })
    }

    return () => {
      if (quillInstanceRef.current) {
        quillInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={quillRef}
      style={{ minHeight: "200px", backgroundColor: "white" }}
    />
  )
}
