export interface TimerContent {
  DD: string
  hh: string
  mm: string
  ss: string
}

export type TickCallback = (content:TimerContent) => void

export class TimeManager {
  currentTick: TimerContent
  tickCallback: TickCallback
  eventTime: number

  constructor(eventTime: number, tickCallback: TickCallback  = (_content:TimerContent) => {}) {
    this.tick = this.tick.bind(this)
    this.eventTime = eventTime
    this.currentTick = { DD: '--', hh: '--', mm: '--', ss: '--' }
    this.tickCallback = tickCallback
    this.tick()
    window.setInterval(this.tick, 1000)
  }

  tick(): void {
    const now = new Date().getTime()
    let distance =
      now > this.eventTime ? now - this.eventTime : this.eventTime - now
    this.currentTick = {
      DD: `${Math.floor(distance / (1000 * 60 * 60 * 24))}`,
      hh: (
        '0' + Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      ).slice(-2),
      mm: ('0' + Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).slice(
        -2
      ),
      ss: ('0' + Math.floor((distance % (1000 * 60)) / 1000)).slice(-2)
    }
    this.tickCallback(this.currentTick)
  }
}
