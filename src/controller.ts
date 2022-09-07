import { getConfig } from './config/config'
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
import { Badge, Incentive, Milestone } from './managers/extraLifeManager'

export interface ScreenData {
  donation?: Donation
  donations?: Donation[]
  incentives: Incentive[]
  badges: Badge[]
  largestDonation?: Donation
  lastDonation?: Donation
  participant: Participant
  milestones: Milestone[]
  nextMilestone?: Milestone
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
    onMilestonesReached: (milestones: Milestone[]) => Promise<void>
    onIncentivesPurchased: (incentives: Incentive[]) => Promise<void>
    onBadgesObtained: (badges: Badge[]) => Promise<void>
    onExtraLifeLoaded: () => Promise<void>
  }) {
    this.soundManager = new SoundManager()
    this.screenManager = new ScreenManager()
    this.timeManager = new TimeManager(
      getConfig().main.eventStartTimestamp,
      callbacks.onTimerTick
    )
    this.extraLifeManager = new ExtraLifeManager({
      onLoaded: callbacks.onExtraLifeLoaded,
      onNewDonations: callbacks.onNewDonations,
      onMilestonesReached: callbacks.onMilestonesReached,
      onIncentivesPurchased: callbacks.onIncentivesPurchased,
      onBadgesObtained: callbacks.onBadgesObtained
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

  isTimerCountingDown() {
    return this.timeManager.isCountingDown()
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
    const largestDonation =
      this.extraLifeManager.donations.length > 0
        ? this.extraLifeManager.donations.sort((a, b) => {
            return a.amount < b.amount ? 1 : -1
          })[0]
        : undefined

    const lastDonation =
      this.extraLifeManager.donations.length > 0
        ? this.extraLifeManager.donations.sort((a, b) => {
            return (
              new Date(b.createdDateUTC).getTime() -
              new Date(a.createdDateUTC).getTime()
            )
          })[0]
        : undefined

    let nextMilestone
    if (this.extraLifeManager.participant) {
      const orderedMilestones =
        this.extraLifeManager.milestones.length > 0
          ? this.extraLifeManager.milestones.sort((a, b) => {
              return a.fundraisingGoal > b.fundraisingGoal ? 1 : -1
            })
          : undefined
      if (orderedMilestones) {
        for (let i = 0; i < orderedMilestones.length; i++) {
          if (
            orderedMilestones[i].fundraisingGoal >
            this.extraLifeManager.participant.sumDonations
          ) {
            nextMilestone = orderedMilestones[i]
            break
          }
        }
      }
    }

    return {
      participant: this.extraLifeManager.participant as Participant,
      team: this.extraLifeManager.team as Team,
      donations: this.extraLifeManager.donations,
      incentives: this.extraLifeManager.incentives,
      badges: this.extraLifeManager.badges,
      largestDonation: largestDonation,
      lastDonation: lastDonation,
      milestones: this.extraLifeManager.milestones,
      nextMilestone: nextMilestone,
      timer: this.timeManager.currentTick
    }
  }
}
