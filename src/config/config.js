// @ts-nocheck
Window.globalConfiguration = {
  main: {
    participantId: 454390,
    teamId: 60467,
    eventStartTimestamp: 1635434330000,
    soundVolume: 1,
    speechLanguage: 'en',
    mockEnabled: true
  },
  screens: {
    donationAlertPopup: (data, controller) => {
      const amount = Number(data.donation.amount)
      const defaultSpeech = `${
        data.donation.displayName ? data.donation.displayName : 'Anonymous'
      } donated \$${data.donation.amount}.`

      controller.playSound('./assets/sounds/cash.mp3')
      if (amount >= 100) {
        controller.saySomething(`Woah! Thanks! ${defaultSpeech}!`)
      } else {
        controller.saySomething(`${defaultSpeech}!`)
      }
      return `
          <div class="screen">
            <div class="donationHead">New Donation!</div>
            <div class="donationFrom">
              {{#donation.displayName}}{{donation.displayName}}{{/donation.displayName}}{{^donation.displayName}}Anonymous{{/donation.displayName}}
            </div>
            <div class="donationAmount">
              \${{donation.amount}}
            </div>
          </div>
          `
    },
    donationMessagePopup: (data, controller) => {
      controller.saySomething(
        `${
          data.donation.displayName ? data.donation.displayName : 'Anonymous'
        } says ${data.donation.message}.`
      )
      return `
        <div class="screen">
          <div class="donationMessageFrom">
            "{{donation.message}}"
          </div>
          <div class="donationMessageHead">
            {{#donation.displayName}}{{donation.displayName}}{{/donation.displayName}}{{^donation.displayName}}Anonymous{{/donation.displayName}}
          </div>
        </div>
        `
    },
    milestoneAlertPopup: (data, controller) => {
      const defaultSpeech = `Milestone reached! ${data.milestone.description}.`
      controller.playSound('./assets/sounds/cash.mp3')
      controller.saySomething(`${defaultSpeech}!`)
      return `
    <div class="screen">
      <div class="donationHead">New Milestone!</div>
      <div class="donationFrom">
        {{milestone.description}}
      </div>
      <div class="donationAmount">
        \${{data.milestone.fundraisingGoal}}
      </div>
    </div>
    `
    },
    gameDayTimer: (data, controller) => {
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerHead">Time Streamed</div>
            <div class="timerBody"><div id="timer">{{timer.DD}}d:{{timer.hh}}:{{timer.mm}}:{{timer.ss}}</div></div>
          </div>
          <div class="amountRaised">
            <div class="amountRaisedHead">Amount Raised</div>
            <div class="amountRaisedBody">\${{participant.sumDonations}}/\${{participant.fundraisingGoal}}</div>
          </div>
        </div>
        `
    },
    extraLifeAdvert: (data, controller) => {
      return `
        <div class="screen">
            <div class="advert">Donate to me. I'm a cool guy.</div>
        </div>
        `
    },
    topDonor: (data, controller) => {
      data.donations.sort((a,b)=>{return a.amount<b.amount?1:-1})
      return `
        <div class="screen">
          <div class="largestDonator">
            Largest Donator: ${data.donations[0].displayName || "Anonymous"} with \$${data.donations[0].amount}
          </div>
        </div>
        `
    }
  },
  callbacks: {
    onStart: (_data, controller) => {
      controller.addToScreenQueue("gameDayTimer")
      window.setInterval(() => {
        if (controller.screenManager.queuedScreens.length == 0) {
          controller.addToScreenQueue("extraLifeAdvert", 3000)
          controller.addToScreenQueue("topDonor", 3000)
          controller.addToScreenQueue("gameDayTimer")
        }
      }, 10000)
    },
    onNewDonations: (data, controller) => {
      for (let i = 0; i < data.donations.length; i++) {
        const donation = data.donations[i]
        controller.addToScreenQueue("donationAlertPopup", 9000, {
          ...data,
          donation: donation
        })
        if (donation.message) {
          controller.addToScreenQueue("donationMessagePopup", 10000, {
            ...data,
            donation: donation
          })
        }
      }
      controller.addToScreenQueue("gameDayTimer")
    },
    onMilestonesReached: (data, controller) => {
      for (let i = 0; i < data.milestones.length; i++) {
        const milestone = data.milestones[i]
        controller.addToScreenQueue('milestoneAlertPopup', 9000, {
          ...data,
          milestone: milestone
        })
      }
      controller.addToScreenQueue('gameDayTimer')
    }
  }
}
