import { useCommandHubBridge } from "@/hooks/useCommandHubBridge"

export const CommandHub = (): JSX.Element => {
  useCommandHubBridge()
  return <></>
}
