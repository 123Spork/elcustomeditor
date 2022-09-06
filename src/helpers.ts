import { App } from '.'
import { Donation } from './managers'
import { Badge, Milestone } from './managers/extraLifeManager'

export const createDono = (
  app: App,
  amount: number,
  username?: string,
  message?: string
): Donation => {
  return {
    displayName: username,
    donorID: 'CD1127106E1536BD',
    links: {
      recipient:
        'https: //www.extra-life.org/index.cfm?fuseaction=donorDrive.participant&participantID=454390'
    },
    eventID: 550,
    createdDateUTC: new Date().toDateString(),
    recipientName:
      app.controller.extraLifeManager.participant?.displayName || '',
    message,
    participantID:
      app.controller.extraLifeManager.participant?.participantID || 1,
    amount,
    avatarImageURL:
      'https: //assets.donordrive.com/extralife/images/$avatars$/constituent_5E485D81-FEBE-E8F6-CD1127106E1536BD.jpg',
    teamID: 55961,
    donationID: '887BF6AEB4834E85' + Math.random() * 1000000
  }
}

export const createMilestone = (
  amount: number,
  description: string
): Milestone => {
  return{
    fundraisingGoal: amount,
    description: description,
    milestoneID: "887BF6AEB4834E85" + Math.random() * 1000000,
    isActive: true,
    isComplete: true
  }
}

export const createBadge= (
  description: string
): Badge => {
  return{
    description: description,
    isUnlocked: true,
    title: description,
    unlockedDateUTC: new Date().toDateString(),
    badgeImageURL: "https://assets.donordrive.com/try/images/$event1444$/badge_41FE3AEF_EFF5_F3B7_2E7C92C797E8D019.png",
    badgeCode: 'big-badge-' + Math.random() * 1000000
  }
}


export const defaultHtml=`<!DOCTYPE html> 
<html lang="en"> 
  <head> 
    <meta charset="UTF-8"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
    <meta http-equiv="X-UA-Compatible" content="ie=edge"> 
    <title>ExtraLifeAlerts</title> 
    <script src = "./config.js"></script>
    <link rel="stylesheet" href="./style.min.css">
  </head> 
  <body> 
    <div id="root"></div>
  <script type="text/javascript" src="bundle.min.js"></script></body>
</html>`