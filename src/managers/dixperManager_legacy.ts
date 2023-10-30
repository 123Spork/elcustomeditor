import { IMessageEvent, w3cwebsocket as WebSocketClient } from 'websocket'

export class DixperManager {
  dxSocket: WebSocketClient
  dixperReady: boolean = false
  skillsReady: boolean = false
  skillsActive: boolean = false
  availableSkills: { [key: string]: Record<string, any> } = {}
  currentGame = '[Souls]'

  constructor() {
    this.dxSocket = new WebSocketClient("ws://localhost:5821")
    this.addEventListeners()
  }

  getDixperStatus() {
    if(!this.dxSocket){return}

    const data = JSON.stringify({ action: 'GET_DIXPER_STATUS' })
    this.dxSocket.send(data)
  }

  getSkillsStatus() {
    if(!this.dxSocket){return}

    const data = JSON.stringify({ action: 'GET_SKILL_STATUS' })
    this.dxSocket.send(data)
  }

  getSkillList() {
    if(!this.dxSocket){return}

    const data = JSON.stringify({ action: 'GET_SKILL_LIST' })
    this.dxSocket.send(data)
  }

  resetStatus() {
    this.dixperReady = false
    this.skillsReady = false
    this.skillsActive = false
    this.availableSkills = {}
  }

  refreshActiveGame = ()=>{
    let self=this
    function readTextFile(file:string, callback:Function) {
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4 && rawFile.status == 200) {
                callback(rawFile.responseText);
            }
        }
        rawFile.send(null);
    }
    readTextFile("https://api.npoint.io/f3c793057cff19983552", function(text:string){
      var data = JSON.parse(text);
      if(data.game!==self.currentGame){
        self.resetStatus
        self.getSkillsStatus()
        self.getDixperStatus()
        self.getSkillList()
      }
      self.currentGame = data.game
    });
  }

  launchRandomSkill(rarity: string): string {
    if(!this.dxSocket || !this.availableSkills || !this.availableSkills[rarity] || this.availableSkills[rarity].length<1){return ''}

    const random = Math.floor(
      Math.random() * (this.availableSkills[rarity].length - 1)
    )
    const event = JSON.stringify({
      action: 'LAUNCH_SKILL',
      payload: this.availableSkills[rarity][random]
    })
    this.dxSocket.send(event)
    return this.availableSkills[rarity][random].appearance.name
  }

  connectDxSocket() {
    this.dxSocket = new WebSocketClient("ws://localhost:5821")
    this.addEventListeners()
  }

  addEventListeners() {
    this.dxSocket.onopen = ()=>{
      console.log('DXSOCKET CONNECTED...')
      this.resetStatus()
      this.getSkillsStatus()
      this.getDixperStatus()
      this.getSkillList()
      this.refreshActiveGame()
      setTimeout(this.refreshActiveGame, 60000)
    }
    this.dxSocket.onclose = ()=>{
        this.resetStatus()
        let self=this
        setTimeout(()=>{self.connectDxSocket}, 5000)
    }

    this.dxSocket.onmessage = (event: IMessageEvent)=>{
        const { action, payload } = this.parseWSMessage(event)
        console.log(action)
        switch (action) {
          case 'ON_DIXPER_STATUS':
            this.dixperReady = payload.studio
            break
          case 'ON_SKILL_STATUS':
            this.skillsActive = payload.skillsActive
            this.skillsReady = payload.skillsReady
            break
          case 'ON_SKILL_LIST':
            this.availableSkills = {}
            for (let i = 0; i < payload.length; i++) {
              if (!this.availableSkills[payload[i].rarity]) {
                this.availableSkills[payload[i].rarity] = []
              }
              if (payload[i].appearance.name.indexOf(this.currentGame) > -1) {
                this.availableSkills[payload[i].rarity].push(payload[i])
              }
            }
            break
        }
    }
  }

  parseWSMessage(event: IMessageEvent) {
    const jsonObj = JSON.parse(event.data as string)
    const payload = jsonObj['payload']
    const action = jsonObj['action']
    return { jsonObj, payload, action }
  }
}
