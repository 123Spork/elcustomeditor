import { CallbackFunction } from '../'
import { ScreenFunction } from '../managers'

export interface Config {
  main: {
    participantId: number
    teamId: number
    eventStartTimestamp: number
    soundVolume: number
    speechLanguage: string
    mockEnabled?: boolean
  }
  screens: {
    [key: string]: ScreenFunction
  }
  onStart: CallbackFunction
  onTimerTick: CallbackFunction
  onNewDonations: CallbackFunction
}

export const getConfig = (): Config => {
  //@ts-ignore
  return Window.globalConfiguration
}

// @ts-ignore
export default Window.globalConfiguration as Config
