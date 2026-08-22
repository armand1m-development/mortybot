# mortybot

Mortybot is a fun bot with a bunch of utilities and features stolen from other
bots that eventually became paid or just lacked the experience me and my friends
wanted in our groups.

It is also inspired by other bots I've seen in the wild during my work
experiences and past implementations.

This bot is available in Telegram as
[@MortyBot](https://t.me/MortyBrasileiroBot) and it works in multiple groups.
Keep in mind that a select group of me and my friends own this instance and
manage the data accordingly.

## Features

## Skill: "assistant"

Answers questions asked to the bot through a @mention by calling an
OpenAI-compatible endpoint. Only enabled for allowlisted chats.

### Listeners

- [x] `message:text`: This listener answers messages that mention the bot with a
      question, in allowlisted chats.

### Commands

- [x] `/assistant_language` _[alias: assistant_lang]_: Force assistant replies
      to use `EN` or `PT`, or use `AUTO` to follow the chat language.
- [x] `/assistant_emojis` _[alias: assistant_emoji]_: Enable or disable emojis
      in assistant responses with `ON` or `OFF`.

## Skill: "language"

Selects the language Mortybot uses in each chat.

### Commands

- [x] `/language` _[alias: idioma]_: Show or change the chat language. Supported
      values are `PT` and `EN`.

## Skill: "galileo"

Commands to get information about the International Space Station location.

### Commands

- [x] `/iss`: Show the prediction for the next 3 days of watchable iss passes
      into the informed location. Example: /iss -20.316839,-40.309921

## Skill: "filters"

Commands to filter messages and react with other messages to it.

### Commands

- [x] `/filters`: List all filters
- [x] `/filterowners` _[aliases: filterinfo]_: List filters with owner info
- [x] `/add_filter` _[aliases: filter]_: Adds a new filter
- [x] `/add_loud_filter` _[aliases: loud_filter]_: Adds a new loud filter.
- [x] `/stop_filter`: Stops listening to an existing filter
- [x] `/activate_filter`: Starts listening to an existing filter
- [x] `/delete_filter`: Deletes a filter permanently
- [x] `/filterownercount`: Count of filters per owner
- [x] `/toggle_case_sensitive_filters`: Toggles case sensitiviness for filters
      in this chat.

### Listeners

- [x] `message:text`: This listener checks and replies messages that match
      defined filters

## Skill: "horeca"

Commands to suggest bars or restaurants.

### Commands

- [x] `/suggest`: Gives a suggestion of bars or restaurants within the range of
      a mentioned location point

## Skill: "chat"

Commands to manage chat settings. Invoke admins, report messages, get the
chat_id, set the chat title, get file urls and more.

### Commands

- [x] `/set_title` _[aliases: batiza]_: Sets the chat title. Only works if the
      bot is a chat admin.
- [x] `/report` _[aliases: admin]_: Pings the group admin about the replied
      message.
- [x] `/chat_id` _[aliases: id]_: Gets the chat id.
- [x] `/get_file` _[aliases: get_sticker]_: Gets the file and url from a
      sticker, video note or gif.
- [x] `/create_command_alias` _[aliases: cmd, alias]_: Create a command alias.

## Skill: "espiritosanto"

Commands to get live road camera images from Espírito Santo.

### Commands

- [x] `/rodosol_now`: Fetch Vila Velha's Rodosol Road camera pictures now.
- [x] `/tp_now`: Fetch Vila Velha's Third Bridge camera pictures now.

## Skill: "math"

Commands to calculate math expressions, exchange rates, metrics and more.

### Commands

- [x] `/calc` _[aliases: calculate]_: Evaluates a math expression and gives you
      the result.

## Skill: "image"

Commands to create meme templates, memes and other image-related tasks. See
https://mortybotui.fly.dev to see the available meme templates and how to create
more. Meme templates are defined per user or group.

### Commands

- [x] `/create_meme_template` _[aliases: memetemplate]_: Creates a meme template
      based on a given image and text parameters.
- [x] `/create_meme` _[aliases: meme]_: Creates a meme based on a template. The
      number of arguments depends on the template itself.
- [x] `/get_meme_template`: Get meme template by name. Useful for debugging
      purposes.
- [x] `/toggle_meme_template_debug` _[aliases: debugtemplate]_: Toggle meme
      template debug mode (adds a red border to the slots).

## Skill: "squatradar"

Commands related to searching and serving data from radar.squat.net through
their api.

### Commands

- [x] `/squatevents`: Gets the next 20 events from radar.squat.net based on the
      city provided.

## Skill: "goodbye"

Ranks the group members by the amount of times they left the group.

### Commands

- [x] `/leaving_rank` _[aliases: quemsaiudogrupo]_: Ranks the group members by
      the amount of times they left the group.

### Listeners

- [x] `:left_chat_member`: This listener checks when someone leaves the group
      and adds to a counter

## Skill: "weather"

Commands to get weather information.

### Commands

- [x] `/forecast` _[aliases: previsao]_: Brings forecast for us
- [x] `/temperature` _[aliases: temp]_: Brings temperature for us

## Skill: "text"

Commands that convert text into funny characters.

### Commands

- [x] `/funtext` _[aliases: fun, funtxt, kawaii]_: Converts a text string into
      funny characters.
- [x] `/crazytext` _[aliases: crazify, crazytxt]_: Converts a text string into
      crazy characters.
- [x] `/telugutext` _[aliases: telugu, telugutxt]_: Converts a text string into
      telugu characters.
- [x] `/decodetelugutext` _[aliases: decodetelugu]_: Decodes telugu characters.

## Skill: "hashtags"

Commands to list, join and leave hashtag channels.

### Commands

- [x] `/join_hashtag`: Join hashtag channel and get notified. Example:
      /join_hashtag #games
- [x] `/leave_hashtag`: Leave a hashtag channel. Example: /leave_hashtag #games
- [x] `/list_hashtags` _[aliases: hashtags]_: List all hashtags in the group.
      Usage: /list_hashtags or /hashtags

### Listeners

- [x] `message:text`: Listens to a hashtag and mentions the people registered on
      it.

## Skill: "currency"

Commands to convert currencies.

### Commands

- [x] `/convert`: Convert a value in one currency to another.
- [x] `/dolar`: 1 USD to BRL
- [x] `/euro`: 1 EUR to BRL

## Skill: "taxincome"

Commands to get info on tax reports, income reports, etc.

### Commands

- [x] `/get_income_report` _[aliases: thetax, tax]_: Usage: /get_income_report
      income=36000&ruling=true

## Developing

Make sure you have Git and Deno 2.9.4 available in your local environment. This
is the runtime version pinned in `.tool-versions` and used by CI and Docker.

```sh
# clone repository
git clone https://github.com/armand1m/mortybot.git

# cd into it
cd ./mortybot

# make sure you have deno installed
which deno

# make sure you're on the pinned LTS release
deno --version
```

You must have a Telegram Bot Token created by the Bot Father. Once you have
that, run the following command with your bot token:

```sh
cat > ./.env <<EOL
BOT_TOKEN=0000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
EXCHANGE_API_TOKEN=AAAAAAAAAAAAAAAAAAAAAAAA
OPENWEATHERMAP_API_TOKEN=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
DATA_PATH=./data
API_PORT=3000
MESSAGE_TIMEOUT_ENABLED=true
MESSAGE_TIMEOUT_IN_MINUTES=2
EOL
```

Now you should be able to run the bot:

```sh
deno task dev
```

### Assistant tuning and prompt caching

The assistant talks to an OpenAI-compatible endpoint (`OPENAI_BASE_URL`). Its
prompt is deliberately front-loaded with static text — persona, formatting
rules, skill documentation — and every per-chat directive sits at the very end,
so the inference server can serve almost the whole prompt from its prefix cache
instead of prefilling it on every message.

| Variable                      | Default | What it does                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ASSISTANT_TEMPERATURE`       | `0.7`   | Sampling temperature.                                                                                                                                                                                                                                                                                            |
| `ASSISTANT_MAX_TOKENS`        | `2000`  | Hard cap on a single reply.                                                                                                                                                                                                                                                                                      |
| `ASSISTANT_THINKING`          | `auto`  | `off`, `auto` or `on`. On a hybrid reasoning model such as Qwen3, `auto` disables reasoning for plain questions and for continuations after a tool returned successfully, and keeps it for error recovery and final synthesis. Reasoning tokens are never shown to the user but are the slowest part of a reply. |
| `ASSISTANT_VISION_ENABLED`    | `true`  | Whether images and video posted in the chat are described for the assistant. Turn it off when `OPENAI_MODEL` is not a vision model.                                                                                                                                                                              |
| `ASSISTANT_VISION_MAX_IMAGES` | `4`     | Hard ceiling on images described per turn, across every attachment. Pixels are paid for in prompt tokens.                                                                                                                                                                                                        |
| `ASSISTANT_VIDEO_FRAMES`      | `4`     | Frames sampled from each video before it is described.                                                                                                                                                                                                                                                           |

Every turn logs its token usage, and each reply carries a debug footer in
development showing the prompt size and how much of it was cached. On SGLang,
`cached_tokens` is only reported when the server was started with
`--enable-cache-report`; without it the footer says `cache report off` rather
than claiming a 0% hit rate. Cross-check against the server's `/metrics`
cache-hit gauge when the numbers look surprising.

When the cache-hit rate is low, the log line names the reason — `cold_start`,
`system_change`, `tools_change` or `history_evicted` — so a regression in prompt
stability is visible rather than silent.

One caveat that is not about caching at all: the stored chat history is part of
every prompt, and at this model size in-context precedent outweighs system
instructions. If the assistant repeatedly refuses a capability or claims tool
output was delivered without calling the tool, the pattern almost certainly
lives in `DATA_PATH/sessions/<chat-id>.json` from before a behavior change, not
in the prompt. Clearing that chat's `assistant.messages` fixes it; the skill of
the model at following updated instructions recovers immediately once the stale
exchanges are gone.

### Images and video

The assistant never receives an image. Anything visual in the chat — an upload,
a reply to someone else's photo, an album, a GIF, a sticker, or the media a bot
command such as `/tp_now` posts while the assistant runs it as a tool — is sent
to `OPENAI_MODEL` in a separate vision request first, and only the resulting
description travels on.

That description is what lands in the conversation history, as a bracketed note
naming who sent the media and whether the user was replying to it. Keeping the
history plain text is deliberate: images in it would be re-sent with every later
turn, wrecking both the prefix cache and the history token budget, and the note
still answers follow-up questions long after the photo has scrolled away.

Videos, GIFs and video notes are sampled with `ffmpeg`, evenly across the clip
when Telegram reports its duration. Without `ffmpeg` on the host — or for a
video above the Bot API's 20 MB download limit — the cover frame Telegram sends
is described instead, so the feature degrades rather than fails.

### Assistant trajectories

Set `ASSISTANT_TRAJECTORY_ENABLED=true` to retain a full debug trajectory for
each addressed assistant message. Trajectories include the assembled prompts,
model responses, tool arguments and results, timings, errors, and Telegram
delivery outcome. They can contain private chat content, so capture is disabled
by default and the files are only exposed through the configured data volume.

Each turn is checkpointed at:

```text
DATA_PATH/trajectories/<chat-id>/<trajectory-id>/trajectory.json
```

Files are kept until an operator deletes or archives them. API credentials,
authorization headers, and raw streaming chunks are never written.

Before opening a pull request, run the same verification used by CI:

```sh
deno task verify
```

### Localization

User-facing translations live in `src/i18n/translations.yaml` and use ICU
Message syntax for interpolation, plural/select rules, numbers, dates, and
composing translated fragments. After changing the catalog, regenerate its
TypeScript contract:

```sh
deno task generate:i18n
```

Use `ctx.t("translation.key", values)` in bot handlers. Translation keys,
required values, and plural argument types are checked by TypeScript. The full
`deno task verify` command also rejects stale generated types, missing locale
keys, and incompatible arguments between English and Portuguese.

## Deploying

### Host

Follow the same configuration step for development, but first override your .env
with this:

```sh
cat > ./.env <<EOL
BOT_TOKEN=0000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
EXCHANGE_API_TOKEN=AAAAAAAAAAAAAAAAAAAAAAAA
OPENWEATHERMAP_API_TOKEN=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
DATA_PATH=./data
API_PORT=3000
MESSAGE_TIMEOUT_ENABLED=true
MESSAGE_TIMEOUT_IN_MINUTES=2
EOL
```

and run it with deno:

```sh
deno task start
```

You probably want to use a process manager like `systemd`.

### Docker

This bot is published publicly as a Docker Image, so you should be able to run
it anywhere you can run a Docker Container.

To run it locally, just run the following:

```sh
# create a volume to persist data
docker volume create mortybot_data

# (optional) build image from source
docker build . -t armand1m/mortybot

# run the container
docker run \
  -e BOT_TOKEN="your-bot-token-here" \
  --mount source=mortybot_data,target=/app/data \
  armand1m/mortybot
```

### Fly

This bot is published in https://fly.io

The CI will take care of publishing the last main branch state into the official
bot release.

Publishing it in your instance should be easy:

```sh
# get credentials
fly auth login

# set the bot token from @BotFather and a Tailscale auth key as secrets
#
# secrets in fly are automatically added to
# the instance as env vars with the same name
fly secrets set \
  BOT_TOKEN=123123123:32132132131312 \
  TAILSCALE_AUTHKEY=tskey-auth-example

# create a volume to hold persistent group data
# 1gb is more than enough.
fly vol create mortybot_data -s 1

# ship it
fly deploy
```

The Tailscale key should be reusable, pre-authorized, and ephemeral so deploys
can join the tailnet without manual approval and stale Fly nodes are cleaned up.
The daemon keeps its node state under `/app/data/tailscale` on the existing Fly
volume, accepts advertised subnet routes and MagicDNS, and blocks unsolicited
inbound tailnet connections. Configure the tailnet policy for the key's node or
tag so it can reach the private model endpoint and port.

`TAILSCALE_ENABLED` is set only in `fly.toml`, so running the Docker image
elsewhere still starts the bot without requiring Tailscale. Override
`TAILSCALE_HOSTNAME` if this instance needs a different tailnet name.

Refer to https://fly.io docs for more details on other commons operations.
