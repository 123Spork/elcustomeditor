import { IMessageEvent, w3cwebsocket as WebSocketClient } from 'websocket'
import { getConfig } from '../config/config'

export class PopupManager {
  dxSocket: WebSocketClient = undefined as any
  availablePopups: { [key: string]: Record<string, any> } = {}

  constructor() {
    this.connectSocket()
  }

  getPopupList() {
    if(!getConfig().main.popupsEnabled){
      return
    }
    if(!this.dxSocket){return}
    console.log('GETTING POPUP LIST')

    const data = JSON.stringify({ action: 'GET_POPUP_LIST' })
    this.dxSocket.send(data)
  }

  launchRandomPopup(category: string): string {
    if(!getConfig().main.popupsEnabled){
      return ''
    }
    console.log('LAUNCHING POPUP')

    if(!this.dxSocket || !this.availablePopups || !this.availablePopups[category] || this.availablePopups[category].length<1){return ''}

    const random = Math.floor(
      Math.random() * (this.availablePopups[category].length - 1)
    )
    const event = JSON.stringify({
      action: 'LAUNCH_POPUP',
      payload: this.availablePopups[category][random].id
    })
    this.dxSocket.send(event)
    return this.availablePopups[category][random].description
  }

  connectSocket() {
    if(!getConfig().main.popupsEnabled){
      return
    }
    if(this.dxSocket){
      this.dxSocket.close();
    }
    this.dxSocket = new WebSocketClient("ws://localhost:9870")
    this.addEventListeners()
  }

  addEventListeners() {
    if(!getConfig().main.popupsEnabled){
      return
    }
    let self=this
    this.dxSocket.onopen = ()=>{
      console.log('SOCKET CONNECTED...')
      this.availablePopups = {}
      this.getPopupList()
      setInterval(()=>{self.getPopupList()}, 60000)
    }
    this.dxSocket.onclose = ()=>{
        this.availablePopups = {}
        setTimeout(()=>{self.connectSocket()}, 5000)
    }

    this.dxSocket.onmessage = (event: IMessageEvent)=>{
        const { action, data } = this.parseWSMessage(event)
        console.log('GOT MESSAGE', action)

        switch (action) {
          case 'GET_POPUP_LIST':
            const {popups} = data
            this.availablePopups = {}
            for (let i = 0; i < popups.length; i++) {
              if (!this.availablePopups[popups[i].category]) {
                this.availablePopups[popups[i].category] = []
              }
              this.availablePopups[popups[i].category].push(popups[i])
            }
            break
        }
    }
  }

  parseWSMessage(event: IMessageEvent) {
    const jsonObj = JSON.parse(event.data as string)
    const data = jsonObj['data']
    const action = jsonObj['action']
    return { jsonObj, data, action }
  }
}
