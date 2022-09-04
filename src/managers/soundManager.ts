//import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getConfig } from '../config/config'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

export class SoundManager {
  isMuted: boolean

  constructor() {
    this.playSound = this.playSound.bind(this)
    this.saySomething = this.saySomething.bind(this)
    this.isMuted = false
  }

  playSound(soundUrl: string, onComplete: () => void = () => {}): void {
    if (this.isMuted) {
      return
    }
    const audio = new Audio(soundUrl)
    audio.addEventListener('ended', () => {
      audio.pause()
      onComplete()
    })
    audio.onerror = () => {
      if (soundUrl === './assets/sounds/soundNotFound.mp3') {
        throw 'Sound not found! Default error sound removed!'
      }
      this.playSound('./assets/sounds/soundNotFound.mp3')
    }
    audio.onloadeddata = () => {
      audio.play()
    }
  }

  async saySomething(speechText: string) {
    if (this.isMuted) {
      return
    }
     const config: AxiosRequestConfig = {
      url: `https://google-tts-proxy.herokuapp.com/base64`,
      method: 'POST',
      data: { msg: speechText, language: getConfig().main.speechLanguage }
    }
    let response: AxiosResponse<string>
    try {
      response = await axios.request(config)
    } catch (error) {
      throw error
    }
    this.playSound('data:audio/mp3;base64,' + response.data)
  }

  mute() {
    this.isMuted = true
  }

  unmute() {
    this.isMuted = false
  }
}
