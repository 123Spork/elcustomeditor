import config, { getConfig } from './config/config'
import {
  ExtraLifeManager,
  Donation,
  Participant,
  Team,
  SoundManager,
  TimeManager,
  TimerContent,
  ScreenManager,
  ScreenFunction
} from './managers'

export interface ScreenData {
  donation?: Donation
  donations?: Donation[]
  participant: Participant
  team: Team
  timer: TimerContent
}

export default class Controller {
  screenManager: ScreenManager
  soundManager: SoundManager
  timeManager: TimeManager
  extraLifeManager: ExtraLifeManager

  constructor(callbacks: {
    onTimerTick: (timerTick: TimerContent) => void
    onNewDonations: (newDonations: Donation[]) => Promise<void>
    onExtraLifeLoaded: () => Promise<void>
  }) {
    this.soundManager = new SoundManager()
    this.screenManager = new ScreenManager()
    this.timeManager = new TimeManager(
      config.main.eventStartTimestamp,
      callbacks.onTimerTick
    )
    this.extraLifeManager = new ExtraLifeManager({
      onLoaded: callbacks.onExtraLifeLoaded,
      onNewDonations: callbacks.onNewDonations
    })
  }

  addToScreenQueue(
    screenFunction: ScreenFunction | string,
    timeToShow?: number,
    data: ScreenData = this.getData()
  ) {
    if (typeof screenFunction === 'string') {
      screenFunction = getConfig().screens[screenFunction] as ScreenFunction
    }
    this.screenManager.addToScreenQueue({
      configuration: screenFunction,
      data: (data as unknown) as Record<string, unknown>,
      controller: this,
      timeToShow
    })
  }

  async refreshIdInCurrent(
    id: string,
    dataOverrides: Record<string, any> = {}
  ) {
    this.muteAudio()
    await this.screenManager.refreshIdInCurrent(id, dataOverrides)
    this.unmuteAudio()
  }

  playSound(soundUrl: string, onComplete: () => void = () => {}) {
    this.soundManager.playSound(soundUrl, onComplete)
  }

  saySomething(speechText: string) {
    this.soundManager.saySomething(speechText)
  }

  muteAudio() {
    this.soundManager.mute()
  }

  unmuteAudio() {
    this.soundManager.unmute()
  }

  getTimer() {
    return this.timeManager.currentTick
  }

  getPage() {
    const pathname = window.location.href.split('/')
    return pathname[pathname.length - 1].substring(
      0,
      pathname[pathname.length - 1].indexOf('?') > -1
        ? pathname[pathname.length - 1].indexOf('?')
        : pathname[pathname.length - 1].indexOf('.') > -1
        ? pathname[pathname.length - 1].indexOf('.')
        : pathname[pathname.length - 1].length
    )
  }

  getData(): ScreenData {
    return {
      participant: this.extraLifeManager.participant as Participant,
      team: this.extraLifeManager.team as Team,
      donations: this.extraLifeManager.donations,
      timer: this.timeManager.currentTick
    }
  }
}
