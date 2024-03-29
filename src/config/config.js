Window.globalConfiguration = {
  main: {
    participantId: 491388,
    teamId: 60467,
    eventStartTimestamp: 1662421458000,
    soundVolume: 1,
    speechLanguage: 'en',
    speechUrl: 'http://localhost:5000/base64',
    mockEnabled: true,
    popupsEnabled: false
  },
  callbacks: {
    onStart: (data, controller) => {
      controller.addToScreenQueue('gameDayTimer')
      window.setInterval(() => {
        if (controller.screenManager.queuedScreens.length == 0) {
          const random = Math.floor(Math.random() * 4)
          switch (random) {
            case 0:
              controller.addToScreenQueue('extraLifeAdvert', 3000)
              break
            case 1:
              controller.addToScreenQueue('nextMilestone', 3000)
              break
            case 2:
              data.donations.length > 0
                ? controller.addToScreenQueue('topDonor', 3000)
                : null
              break
            case 3:
              data.donations.length > 0
                ? controller.addToScreenQueue('lastDonor', 3000)
                : null
              break
          }
          controller.addToScreenQueue('gameDayTimer')
        }
      }, 15000)
    },
    onNewDonations: (data, controller) => {
      for (let i = 0; i < data.donations.length; i++) {
        const donation = data.donations[i]
        controller.addToScreenQueue('donationAlertPopup', 9000, {
          ...data,
          donation: donation
        })
        if (donation.message) {
          controller.addToScreenQueue('donationMessagePopup', 10000, {
            ...data,
            donation: donation
          })
        }
      }
      controller.addToScreenQueue('gameDayTimer')
    },
    onIncentivesPurchased: (data, controller) => {
      for (let i = 0; i < data.incentives.length; i++) {
        const incentive = data.incentives[i]
        controller.addToScreenQueue('incentiveAlertPopup', 9000, {
          ...data,
          incentive: incentive
        })
      }
      controller.addToScreenQueue('gameDayTimer')
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
    },
    onBadgesObtained: (data, controller) => {
      for (let i = 0; i < data.badges.length; i++) {
        const badge = data.badges[i]
        controller.addToScreenQueue('badgeAlertPopup', 9000, {
          ...data,
          badge: badge
        })
      }
      controller.addToScreenQueue('gameDayTimer')
    }
  },
  screens: {
    donationAlertPopup: (data, controller) => {
      const amount = Number(data.donation.amount)
      const defaultSpeech = `${
        data.donation.displayName
          ? data.donation.displayName
          : 'Anonymous'
      } donated \$${data.donation.amount}.`

      controller.playSound('./assets/sounds/cash.mp3')
      if (amount >= 100) {
        controller.saySomething(`Woah! Thanks! ${defaultSpeech}!`)
      } else {
        controller.saySomething(`${defaultSpeech}!`)
      }
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="donation">
            \${{donation.amount}} Donated by {{#donation.displayName}}{{donation.displayName}}{{/donation.displayName}}{{^donation.displayName}}Anonymous{{/donation.displayName}}
          </div>
        </div>
      `
    },
    donationMessagePopup: (data, controller) => {
      controller.saySomething(
        `${
          data.donation.displayName
            ? data.donation.displayName
            : 'Anonymous'
        } says ${data.donation.message}.`
      )
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="donationMessage">
            "{{donation.message}}"
          </div>
        </div>
      `
    },
    incentiveAlertPopup: (data, controller) => {
      controller.saySomething(
        `Incentive purchased. ${data.incentive.description}. Bought by ${
          data.incentive.donation.displayName
            ? data.incentive.donation.displayName
            : 'Anonymous'
        }.`
      )
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
            <div class="timer">
              <div class="timerBody">
                <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                  ${
                    isCountingDown
                      ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                      : ''
                  }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
                </div>
              </div>
            </div>
          <div class="incentive">
            New Incentive!<br/>"{{incentive.description}}"
          </div>
        </div>
      `
    },
    milestoneAlertPopup: (data, controller) => {
      const defaultSpeech = `$${data.milestone.fundraisingGoal} Milestone reached! ${data.milestone.description}.`
      controller.playSound('./assets/sounds/cash.mp3')
      controller.saySomething(`${defaultSpeech}!`)
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="milestone">
            \${{milestone.fundraisingGoal}} Reached!<br/>
            {{milestone.description}}
          </div>
        </div>
      `
    },
    badgeAlertPopup: (data, controller) => {
      const defaultSpeech = `Badge Obtained! ${data.badge.description}.`
      controller.playSound('./assets/sounds/cash.mp3')
      controller.saySomething(`${defaultSpeech}!`)
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="badge">
            New Badge!<br/>
            {{badge.description}}
          </div>
        </div>
      `
    },
    gameDayTimer: (data, controller) => {
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="amountRaised">
            <div class="amountRaisedBody">\${{participant.sumDonations}} / \${{participant.fundraisingGoal}}</div>
          </div>
        </div>
      `
    },
    extraLifeAdvert: (data, controller) => {
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="advert">
            Play Games. Save Kids.
          </div>
        </div>
      `
    },
    topDonor: (data, controller) => {
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="largestDonator">
            Largest Donator<br/>${data.largestDonation.displayName ||
              'Anonymous'}<br/>\$${data.largestDonation.amount}
          </div>
        </div>
      `
    },
    lastDonor: (data, controller) => {
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="lastDonator">
            Last Donator<br/>
            ${data.lastDonation.displayName || 'Anonymous'}<br/>\$${
                data.lastDonation.amount
              }
          </div>
        </div>
      `
    },
    nextMilestone: (data, controller) => {
      const isCountingDown = controller.isTimerCountingDown()
      return `
        <div class="screen">
          <div class="timer">
            <div class="timerBody">
              <div id="timer" class="${isCountingDown ? 'countdown' : ''}">
                ${
                  isCountingDown
                    ? '<div class="timeUntilLabel">Time Until Event</div>{{#timer.DD>0}}{{timer.DD}}:{{/timer.DD>0}}'
                    : ''
                }{{timer.hh}}:{{timer.mm}}:{{timer.ss}}
              </div>
            </div>
          </div>
          <div class="next-milestone">
            In just \$${data.nextMilestone.fundraisingGoal -
              data.participant.sumDonations}...<br/>
            ${data.nextMilestone.description}
          </div>
        </div>
      `
    }
  }
}