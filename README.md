# twitch-spambot-killer

This is a tiny little script that is supposed to automatically delete and ban Twitch bots which advertise follower-botting and other useless services and turn on follower-only chat for ten minutes to prevent multiple accounts from spamming you at once

## Configuration

1. [Clone this Repository](https://github.com/EmKaCe/twitch-spambot-killer/archive/master.zip)
2. [Create a Twitch App](https://dev.twitch.tv/console/apps)

    Make sure that the OAuth Redirect URL leads to `http://<hostname>:<port>/<pathname>/auth`
    **Important:** Do not close the Site yet, since we still need some info from that page.

3. Create a config.json in the folder of the repository that looks like this:

    ```
      {
          "hostname": "<your hostname here>",
          "pathname": "<your pathname here>",
          "port": "<port of your choice>",
          "followerOnly": true,
          "clientId": "<Client ID from Twitch Developer Console>",
          "accessToken": "",
          "clientSecret": "<Client Secret from Twitch Developer Console>",
          "refreshToken": "",
          "channels": ["<Username of Twitch-Account that authorizes the App>"]
      }
    ```
    Fill in the data and save it as `config.json` in the root of the repository.
    
    **Hint:** if you don't want to turn on the Follower-Only Chat as soon as a flood of Spammers is detected, change `"followerOnly": true,` to `"followerOnly": false,`.
    
4. Run `npm install` to install all dependencies
5. Run `node .` to start the Bot
6. Head to `http://<hostname>:<port>/<pathname>/add` and Authorize the Bot with your Twitch Account
7. You are done!
