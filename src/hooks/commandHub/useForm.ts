import { useEffect } from 'react'
import { fetchIconUrl } from '@/services/chrome'

export const useForm = () => {
  const checkSearchUrl = (target) => {
    const searchUrlElm = target.querySelector('input[name="searchUrl"]')
    const iconUrlElm = target.querySelector('input[name="iconUrl"]')

    const updateIconUrl = async (searchUrl: string) => {
      const url = await fetchIconUrl(searchUrl)
      console.log(url)
      if (iconUrlElm instanceof HTMLInputElement) {
        iconUrlElm.value = url
      }
    }

    if (searchUrlElm instanceof HTMLInputElement) {
      let to: number
      searchUrlElm.addEventListener('input', () => {
        clearTimeout(to)
        to = window.setTimeout(() => {
          updateIconUrl(searchUrlElm.value)
        }, 50)
      })
    }
  }

  const targetNode = document.body
  const config = { childList: true, subtree: true }
  const observer = new MutationObserver(function (mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.id === 'commandShare') {
            console.log(' commandShare')
            checkSearchUrl(node as Element)
            // observer.disconnect()
          }
        }
      }
    }
  })

  // Mutation Observerを開始
  observer.observe(targetNode, config)
}
