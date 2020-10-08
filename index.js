const fs = require("fs");
const express = require("express");
const https = require("https");
const { RefreshableAuthProvider, StaticAuthProvider } = require("twitch-auth");
const { ChatClient } = require("twitch-chat-client");

const config = JSON.parse(fs.readFileSync("./config.json"));

const clientId = config.clientId;
const clientSecret = config.clientSecret;

const hostname = config.hostname;
const pathname = config.pathname;
const port = config.port;
const followerOnly = config.followerOnly;

const app = express();

let server;

const runBot = () => {
    if (server) {
        server.close();
    }

    let accessToken = config.accessToken;
    const refreshToken = config.refreshToken;
    const channels = config.channels;

    const authProvider = new RefreshableAuthProvider(
        new StaticAuthProvider(clientId, accessToken),
        {
            clientSecret,
            refreshToken,
            onRefresh: (token) => {
                config.accessToken = token;
                accessToken = token;
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));
            }
        }
    );

    const chatClient = new ChatClient(authProvider, { channels: config.channels });

    let preventing = false;

    const preventSpam = (channel) => {
        if (!preventing) {
            chatClient.enableFollowersOnly(channel, 10);
            preventing = true;
            setTimeout((channel) => {
                if (preventing) {
                    chatClient.disableFollowersOnly(channel);
                    preventing = false;
                }
            }, 600000);
        }
    };

    chatClient.onRegister(async () => {
        console.log("Registered!");
        await chatClient.join(channels[0]);
    });

    chatClient.onMessage(async (channel, user, message, msg) => {
        if (message.search("follow") !== -1) {
            if (message.search(/https?:\/\//) !== -1 || message.search(/\..?com/) !== -1) {
                await chatClient.ban(channel, user, "AUTOBAN: Spambot detected!");
                if (followerOnly) {
                    preventSpam(channel);
                }
            }
        } else {
            if (message === "!ping") {
                chatClient.say(channel, "Anti-Spam: I'll be watching over you!");
            }
        }
    });

    chatClient.connect();

};

if (!config.refreshToken) {
    app.get("/" + pathname + "/add", (req, res) => {
        res.redirect("https://id.twitch.tv/oauth2/authorize?" +
            "client_id=" + clientId +
            "&redirect_uri=http://" + hostname + ":" + port + "/" + pathname + "/auth" +
            "&response_type=code" +
            "&scope=chat:read+chat:edit+channel:moderate");
    });

    app.get("/" + pathname + "/auth", (req, res) => {
        if (req.query.code) {
            const code = req.query.code;
            const options = {
                hostname: "id.twitch.tv",
                port: 443,
                path: "/oauth2/token?client_id=" + clientId + "&client_secret=" + clientSecret + "&code=" + code + "&grant_type=authorization_code&redirect_uri=http://" + hostname + ":" + port + "/" + pathname + "/auth",
                method: "POST"
            };

            const twitchRequest = https.request(options, (response) => {
                let rawData = "";
                if (response.statusCode === 400) {
                    res.status(400).send("Ungültiger Code!");
                }

                if (response.statusCode === 200) {
                    response.on("data", (d) => {
                        rawData += d;
                    });
                    response.on("end", () => {
                        const tokens = JSON.parse(rawData);
                        config.accessToken = tokens.access_token;
                        config.refreshToken = tokens.refresh_token;
                        fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));
                        runBot();
                    });

                    res.status(200).send("Erfolgreich authorisiert! Du kannst diese Seite nun schließen.");
                }
            });
            twitchRequest.end();
        } else {
            res.status(400).send("Ungültiges Format!");
        }
    });

    server = app.listen(port, () => {
        console.log("Express running at port " + port);
    });
} else {
    runBot();
}