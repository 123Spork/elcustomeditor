import mustache from 'mustache'

export type ScreenFunction = (
  data: Record<string, unknown>,
  controller: unknown
) => Promise<string>

export interface Screen {
  configuration: ScreenFunction
  data: Record<string, unknown>
  controller: unknown
  timeToShow?: number
}

export class ScreenManager {
  queuedScreens: Screen[]
  currentScreen: Screen | null
  isDirty: boolean

  constructor() {
    this.addToScreenQueue = this.addToScreenQueue.bind(this)
    this.render = this.render.bind(this)
    this.queuedScreens = []
    this.currentScreen = null
    this.isDirty = true
    window.setInterval(this.render, 1000 / 30)
  }

  generateContent(template: string, data: Record<string, any>): string {
    return mustache.render(template, data)
  }

  addToScreenQueue(screen: Screen) {
    this.queuedScreens.push(screen)
  }

  async loadScreen(screen: Screen) {
    const template = await screen.configuration(screen.data, screen.controller)
    ;(document.getElementById(
      'scene'
    ) as HTMLDivElement).innerHTML = mustache.render(template, screen.data)
  }

  async processNextScreen() {
    if (this.queuedScreens.length < 1) {
      this.isDirty = true
      return
    }
    this.currentScreen = this.queuedScreens[0]
    await this.loadScreen(this.currentScreen)
    window.setTimeout(() => {
      this.queuedScreens.splice(0, 1)
      this.isDirty = true
    }, this.currentScreen.timeToShow || 0)
  }

  async refreshIdInCurrent(
    id: string,
    dataOverrides: Record<string, any> = {}
  ) {
    const element = document.getElementById(id)
    if (!this.currentScreen || !element) {
      return
    }
    this.currentScreen.data = { ...this.currentScreen.data, ...dataOverrides }
    const template = await this.currentScreen.configuration(
      this.currentScreen.data,
      this.currentScreen.controller
    )
    const div = document.createElement('div')
    div.innerHTML = mustache.render(template, this.currentScreen.data)
    const newElementContent = div.querySelector('#' + id)
    if (newElementContent) {
      element.innerHTML = newElementContent.innerHTML
    }
  }

  render() {
    if (this.isDirty && this.queuedScreens.length > 0) {
      this.isDirty = false
      this.processNextScreen()
    }
  }
}
