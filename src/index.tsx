import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
  Button,
  Card,
  Container,
  Form,
  FormControl,
  InputGroup,
  Navbar,
  Row,
  Tab,
  Tabs
} from 'react-bootstrap'
import Editor from '@monaco-editor/react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'
import './styles/main.scss'

import Controller, { ScreenData } from './controller'
import { Donation, TimerContent } from './managers'
import { createBadge, createDono, createMilestone, defaultHtml } from './helpers'
import { Badge, Milestone } from './managers/extraLifeManager'

export type CallbackFunction = (
  sceneContentData: ScreenData,
  controller: Controller
) => void

export class App {
  controller: Controller
  onStart: CallbackFunction
  onNewDonations: CallbackFunction
  onMilestonesReached: CallbackFunction
  onBadgesObtained: CallbackFunction
  onTimerTick: CallbackFunction

  constructor(callbacks: {
    onStart?: CallbackFunction
    onNewDonations?: CallbackFunction
    onMilestonesReached?: CallbackFunction
    onBadgesObtained?: CallbackFunction
    onTimerTick?: CallbackFunction
  }) {
    this.onNewDonations = callbacks.onNewDonations
      ? callbacks.onNewDonations
      : () => {}
    this.onMilestonesReached = callbacks.onMilestonesReached
      ? callbacks.onMilestonesReached
      : () => {}
    this.onBadgesObtained = callbacks.onBadgesObtained
      ? callbacks.onBadgesObtained
      : () => {}
    this.onStart = callbacks.onStart ? callbacks.onStart : () => {}
    this.onTimerTick = callbacks.onTimerTick ? callbacks.onTimerTick : () => {}

    this.controller = new Controller({
      onTimerTick: this.onTick.bind(this),
      onNewDonations: this.onDonations.bind(this),
      onMilestonesReached: this.onMilestones.bind(this),
      onBadgesObtained: this.onBadges.bind(this),
      onExtraLifeLoaded: async () => {
        await this.onStart(this.controller.getData(), this.controller)
      }
    })
  }

  async onTick(_timerTick: TimerContent) {
    if (!this.controller) {
      return
    }
    await this.controller.refreshIdInCurrent('timer', {
      timer: this.controller.getTimer()
    })
    await this.onTimerTick(this.controller.getData(), this.controller)
  }

  async onDonations(donations: Donation[]) {
    this.onNewDonations(
      { ...this.controller.getData(), donations },
      this.controller
    )
  }

  async onMilestones(milestones: Milestone[]) {
    this.onMilestonesReached(
      { ...this.controller.getData(), milestones },
      this.controller
    )
  }

  async onBadges(badges: Badge[]) {
    this.onBadgesObtained(
      { ...this.controller.getData(), badges },
      this.controller
    )
  }
}

interface GlobalConfig {
  mainData: {
    participantId: number
    teamId: number
    eventStartTimestamp: number
    soundVolume: number
    speechLanguage: string
    mockEnabled: boolean
  }
  showingAdvanced: boolean
  advancedScreens: string
  advancedEvents: string
  advancedStyling: string
  advancedTab: string
  runningApp: null
}
const storedConfig = localStorage.getItem('el_globalconfiguration')
class Main extends React.Component {
  state = storedConfig
    ? (JSON.parse(storedConfig) as GlobalConfig)
    : ({
        mainData: {
          participantId: 454390,
          teamId: 55961,
          eventStartTimestamp: 1635434330000,
          soundVolume: 1,
          speechLanguage: 'en',
          mockEnabled: true
        },
        showingAdvanced: true,
        advancedScreens: '',
        advancedEvents: '',
        advancedStyling: '',
        advancedTab: 'screens',
        runningApp: null
      } as GlobalConfig)
  app: App | null = null

  async componentDidMount(): Promise<void> {
    window.onload = async () => {
      if (!storedConfig) {
        const config = (document.getElementById(
          'advancedConfig'
        ) as HTMLScriptElement).innerHTML
        const style = (document.getElementById(
          'advancedStyle'
        ) as HTMLStyleElement).innerHTML

        const screensMatch = config.match(
          /(?<=.{2}screens: )(\s|\S)*^.{8}}(?=$)/gm
        )
        const eventsMatch = config.match(
          /(?<=.{2}callbacks: )(\s|\S)*^.{8}}(?=,$)/gm
        )

        this.setState({
          advancedScreens: screensMatch
            ? screensMatch[0].replace(/^.{8}/gm, '')
            : '',
          advancedEvents: eventsMatch
            ? eventsMatch[0].replace(/^.{8}/gm, '')
            : '',
          advancedStyling: style.replace(/^.{6}/gm, '')
        })
      } else {
        const head = document.getElementsByTagName('head')[0]
        head.removeChild(
          document.getElementById('advancedConfig') as HTMLScriptElement
        )
        var newScriptTag = document.createElement('script')
        newScriptTag.innerHTML = `Window.globalConfiguration = {
        main: ${JSON.stringify(this.state.mainData, null, 4)},
        callbacks: ${this.state.advancedEvents},
        screens:${this.state.advancedScreens}}`
        newScriptTag.id = 'advancedConfig'
        head.appendChild(newScriptTag)
        ;(document.getElementById(
          'advancedStyle'
        ) as HTMLStyleElement).innerHTML = this.state.advancedStyling
      }

      //@ts-ignore
      const callbacks = Window.globalConfiguration.callbacks
      window.setTimeout(() => {
        this.app = new App(callbacks)
      }, 1000)
    }
  }

  async changeMain() {
    const date = (document.getElementById('dateStamp') as HTMLInputElement)
      .value
    const [first, second] = date.split(',').map((item) => item.trim())
    const [day, month, year] = first.split('/')
    const [hours, minutes, seconds] = second.split(':')
    //@ts-ignore
    const newDate = new Date(year, month - 1, day, hours, minutes, seconds)
    return new Promise((resolve) => {
      this.setState(
        {
          mainData: {
            ...this.state.mainData,
            participantId: Number(
              (document.getElementById('participantId') as HTMLInputElement)
                .value
            ),
            teamId: Number(
              (document.getElementById('teamId') as HTMLInputElement).value
            ),
            eventStartTimestamp: newDate.getTime(),
            mockEnabled:
              (document.getElementById('mockSelect') as HTMLInputElement)
                .value == 'on'
          }
        },
        () => {
          resolve(null)
        }
      )
    })
  }

  showAdvanced(e: any) {
    this.setState({ showingAdvanced: !this.state.showingAdvanced })
  }

  changeAdvancedTab(k: any) {
    this.setState({ advancedTab: k as string })
  }

  changedAdvancedStyling(content: any) {
    this.setState({ advancedStyling: content })
  }

  changedAdvancedScreens(content: any) {
    this.setState({ advancedScreens: content })
  }

  changedAdvancedEvents(content: any) {
    this.setState({ advancedEvents: content })
  }

  async saveOutput() {
    await this.changeMain()
    const head = document.getElementsByTagName('head')[0]
    head.removeChild(
      document.getElementById('advancedConfig') as HTMLScriptElement
    )
    var newScriptTag = document.createElement('script')
    newScriptTag.innerHTML = `Window.globalConfiguration = {
    main: ${JSON.stringify(this.state.mainData, null, 4)},
    callbacks: ${this.state.advancedEvents},
    screens:${this.state.advancedScreens}}`
    newScriptTag.id = 'advancedConfig'
    head.appendChild(newScriptTag)
    ;(document.getElementById(
      'advancedStyle'
    ) as HTMLStyleElement).innerHTML = this.state.advancedStyling
    window.setTimeout(() => {
      //@ts-ignore
      localStorage.setItem('el_globalconfiguration', JSON.stringify(this.state))
      //@ts-ignore
      const callbacks = Window.globalConfiguration.callbacks
      head.removeChild(document.getElementById('elBundle') as HTMLScriptElement)
      var newScriptTag = document.createElement('script')
      newScriptTag.src = `./alertingSystem/bundle.min.js`
      newScriptTag.id = 'elBundle'
      head.appendChild(newScriptTag)
      for (let i = 0; i < 10000; i++) {
        window.clearInterval(i)
      }
      this.app = new App(callbacks)
    }, 1000)
  }

  triggerBadge() {
    if (this.app) {
      this.app.controller.extraLifeManager.createBadgeMock(
        createBadge(
          ['$100 USD Raised', '$1,000 USD Raised', 'Recruited 50 Team Members'][
            Math.floor(Math.random() * 3)
          ]
        )
      )
    }
  }

  triggerMilestone() {
    const amount =
      Number(
        (document.getElementById('donoAmount') as HTMLInputElement).value
      ) || 20
    if (this.app) {
      this.app.controller.extraLifeManager.createMilestoneMock(
        createMilestone(
          amount,
          ['Shave your eyebrows!', 'Do 50 pushups!', 'Time for chili sauce!'][
            Math.floor(Math.random() * 3)
          ]
        )
      )
    }
  }

  triggerDonation() {
    const amount =
      Number(
        (document.getElementById('donoAmount') as HTMLInputElement).value
      ) || 20
    if (this.app) {
      this.app.controller.extraLifeManager.createDonationMock(
        createDono(this.app, amount, 'Joseph Jones')
      )
    }
  }

  triggerAnonDonation() {
    const amount =
      Number(
        (document.getElementById('donoAmount') as HTMLInputElement).value
      ) || 20

    if (this.app) {
      this.app.controller.extraLifeManager.createDonationMock(
        createDono(this.app, amount)
      )
    }
  }

  triggerDonationWithMessage() {
    const amount =
      Number(
        (document.getElementById('donoAmount') as HTMLInputElement).value
      ) || 20

    if (this.app && this.app.controller.extraLifeManager.team != null) {
      this.app.controller.extraLifeManager.createDonationMock(
        createDono(this.app, amount, 'Joseph Jones', "Let's do this!")
      )
    }
  }

  async downloadPack() {
    const date = (document.getElementById('dateStamp') as HTMLInputElement)
      .value
    const [first, second] = date.split(',').map((item) => item.trim())
    const [day, month, year] = first.split('/')
    const [hours, minutes, seconds] = second.split(':')
    //@ts-ignore
    const newDate = new Date(year, month - 1, day, hours, minutes, seconds)

    let zip = new JSZip()
    zip.file(
      'config.js',
      `Window.globalConfiguration = {
main: ${JSON.stringify(
        {
          ...this.state.mainData,
          participantId: Number(
            (document.getElementById('participantId') as HTMLInputElement).value
          ),
          teamId: Number(
            (document.getElementById('teamId') as HTMLInputElement).value
          ),
          eventStartTimestamp: newDate.getTime()
        },
        null,
        4
      )},
callbacks: ${this.state.advancedEvents},
screens:${this.state.advancedScreens}}`
    )
    zip.file('style.min.css', this.state.advancedStyling)
    zip.file('index.html', defaultHtml)

    const bundle = await fetch('./alertingSystem/bundle.min.js')
    const bundleText = await bundle.text()
    zip.file('bundle.min.js', bundleText)

    JSZipUtils.getBinaryContent(
      '/alertingSystem/assets/sounds/cash.mp3',
      function(err: Error, data: any) {
        if (err) {
          throw err // or handle the error
        }
        zip.file('assets/sounds/cash.mp3', data, { binary: true })

        JSZipUtils.getBinaryContent(
          '/alertingSystem/assets/sounds/soundNotFound.mp3',
          async function(err: Error, data: any) {
            if (err) {
              throw err // or handle the error
            }
            zip.file('assets/sounds/soundNotFound.mp3', data, { binary: true })
            await zip.generateAsync({ type: 'blob' }).then(function(blob) {
              saveAs(blob, 'ExtraLifeHelper.zip')
            })
          }
        )
      }
    )
  }

  render(): any {
    return (
      <Container>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">
            ExtraLifeAlerts Custom Editor
          </Navbar.Brand>
        </Navbar>
        <Card>
          <Card.Header>Output</Card.Header>

          <Card.Body>
            <div id="root">
              <div id="scene"></div>
            </div>
              <Row xs="auto">
                <InputGroup className="mb-2">
                  <InputGroup.Text>$</InputGroup.Text>
                  <FormControl
                    id="donoAmount"
                    placeholder="Amount"
                    type="number"
                  />
                </InputGroup>
              </Row>
              <Row xs="auto">
                <InputGroup className="mb-2">
                  <Button
                    variant="success"
                    onClick={this.triggerDonation.bind(this)}
                  >
                    Trigger Donation for Amount
                  </Button>
                </InputGroup>{' '}
              </Row>
              <Row xs="auto">
                <InputGroup className="mb-2">
                  <Button
                    variant="success"
                    onClick={this.triggerAnonDonation.bind(this)}
                  >
                    Trigger Anonymous Donation for Amount
                  </Button>
                </InputGroup>{' '}
              </Row>
              <Row xs="auto">
                <InputGroup className="mb-2">
                  <Button
                    variant="success"
                    onClick={this.triggerDonationWithMessage.bind(this)}
                  >
                    Trigger Donation With Message for Amount
                  </Button>
                </InputGroup>
              </Row>
              <Row xs="auto">
                <InputGroup className="mb-2">
                  <Button
                    variant="success"
                    onClick={this.triggerMilestone.bind(this)}
                  >
                    Trigger Milestone Reached for Amount
                  </Button>
                </InputGroup>
              </Row>
              <Row xs="auto">
                <InputGroup className="mb-2">
                  <Button
                    variant="success"
                    onClick={this.triggerBadge.bind(this)}
                  >
                    Trigger Badge Obtained
                  </Button>
                </InputGroup>
              </Row>
          </Card.Body>
        </Card>{' '}
        <div className="save-block">
          <Button variant="primary" onClick={this.downloadPack.bind(this)}>
            Download Pack
          </Button>

          <Button
            className="float-end"
            variant="primary"
            onClick={this.saveOutput.bind(this)}
          >
            Save & Update Demo
          </Button>
        </div>
        <Card>
          <Card.Header>Basic Information</Card.Header>

          <Card.Body>
            <Card.Text>
              Please enter the following details to create your download zip.{' '}
            </Card.Text>

            <Form.Group className="mb-3" controlId="participantId">
              <Form.Label> Extra Life Participant ID</Form.Label>
              <Form.Control
                defaultValue={this.state.mainData.participantId}
                type="number"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="teamId">
              <Form.Label>Extra Life Team ID</Form.Label>
              <Form.Control
                defaultValue={this.state.mainData.teamId}
                type="number"
              />
            </Form.Group>

            {/* <Form.Group className="mb-3" controlId="themeSelect">
              <Form.Label> Select Theme</Form.Label>
              <Form.Select aria-label="Default select example">
                <option value="dark">Dark</option>
              </Form.Select>
            </Form.Group> */}

            <Form.Group className="mb-3" controlId="dateStamp">
              <Form.Label>Event Start Date/ Time</Form.Label>
              <Form.Control defaultValue={new Date().toLocaleString()} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="mockSelect">
              <Form.Label>
                {' '}
                Turn on fake data? Many repeated saves in a short space of time
                will be assumed by Extra Life's API to be a DDOS attack. This
                could block you for up to 24 hours. Only switch this on if you
                are finalised on your design and want to see what the end
                product will actually look like.
              </Form.Label>
              <Form.Select aria-label="Default select example">
                <option value="on">On (Recommended While Testing)</option>
                <option value="off">Off</option>
              </Form.Select>
            </Form.Group>
          </Card.Body>
        </Card>
        <br />
        <Card>
          <Card.Header>Advanced</Card.Header>

          <Card.Body>
            {/* {this.state.showingAdvanced ? (
              <Card.Text>
                <a href="#" onClick={this.showAdvanced.bind(this)}>
                  Click here
                </a>{' '}
                to hide advanced controls.
              </Card.Text>
            ) : (
              <Card.Text>
                <a href="#" onClick={this.showAdvanced.bind(this)}>
                  Click here
                </a>{' '}
                if enable advanced controls.
              </Card.Text>
            )} */}

            {true ? (
              <Tabs
                id="controlled-tab-example"
                activeKey={this.state.advancedTab}
                onSelect={this.changeAdvancedTab.bind(this)}
                className="mb-3"
              >
                <Tab eventKey="styling" title="Styling">
                  Custom css styling for your alert system. These tie in with
                  the screens you set up in the 'Screens' tab.
                  <br />
                  <Editor
                    height="400px"
                    defaultLanguage="css"
                    value={this.state.advancedStyling}
                    onChange={this.changedAdvancedStyling.bind(this)}
                  />
                </Tab>
                <Tab eventKey="screens" title="Screens">
                  Custom screens for your alert system. These tie in with the
                  css styling in the 'Styling' tab.
                  <br />
                  <Editor
                    height="400px"
                    defaultLanguage="javascript"
                    value={`${this.state.advancedScreens}`}
                    onChange={this.changedAdvancedScreens.bind(this)}
                  />
                </Tab>
                <Tab eventKey="events" title="Events">
                  Custom event processing. This determines the default behaviour
                  in the case of pre-defined triggers.
                  <br />
                  <Editor
                    height="400px"
                    defaultLanguage="javascript"
                    value={`${this.state.advancedEvents}`}
                    onChange={this.changedAdvancedEvents.bind(this)}
                  />
                </Tab>
              </Tabs>
            ) : (
              <div />
            )}
          </Card.Body>
        </Card>
        <div className="save-block">
          <Button
            className="float-end"
            variant="danger"
            onClick={this.saveOutput.bind(this)}
          >
            Reset All Changes
          </Button>
        </div>
        <Card>
          <Card.Header>FAQ</Card.Header>
          <Card.Body>
            <b>How do I use this?</b> - Just embed the html file in the bundle
            into a browser source on your streaming software.
            <hr />
            <b>Why won't my html page load on my machine?</b> - The most likely
            cause is that your participant/ team IDs are incorrect.
            <hr />
            <b>Why can't I see my own extra life data?</b> - Try turning fake
            data off and make sure it's off before you download your pack.
            <hr />
            <b>Why can't I hear voiceover playing on streamlabs?</b> - Text to
            speech (tts) for this project is based on another app I built that
            is running separately (browser source tts doesnt work natively in
            streamlabs). If that project is offline, youll need to embed your
            own tts solution.
            <hr />
            <b>Why aren't there more default themes?</b> - I'm only an engineer,
            not an artist. If you create any themes you'd like other's to use,
            by all means send them over to me.
            <hr />
            <b>How do I have different screens for my streamslabs scenes?</b> -
            This is WIP. For now the simplest solution is create one screen at a
            time (copypaste your advanced stuff) and embed with separate html
            files on your software.
            <hr />
            Found this useful? Why not{' '}
            <a href="https://www.extra-life.org/participant/aspecthistory">
              donate to my extra life.
            </a>
          </Card.Body>
        </Card>
      </Container>
    )
  }
}
ReactDOM.render(<Main />, document.getElementById('app'))
