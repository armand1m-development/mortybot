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

This is a working in progress list of features. The implemented functions will
be checked as made available. Consider this my scrum board.

### Multilanguage

Supported locales:

- [x] en
- [ ] ptbr

Commands:

- [ ] `/set_language <locale>`: changes the group preferred language

### Currency Conversion utilities

- [x] `/currency <value> <currencyA> to <currencyB>`
  - Example: `/currency 150 BRL to EUR` will convert 150 EUR to BRL and reply
    with the current matching value.
- [x] `/dolar` render the value of 1 USD in BRL
- [x] `/euro` render the value of 1 EUR in BRL
- [ ] `/bitcoin` render the value of 1 BTC in BRL

### Temperature Helpers

- [x] `/temperature <query>`: check the temperature of your city, country,
      neighborhood, etc..
  - [x] Aliases: `/temp`
- [x] `/forecast <query>`: gives you a simple weather forecast for the next 24h
  - [x] Aliases: `/previsao`

### Message Filters

Message Filters are listeners that will send a pre-defined message when someone
in the group sends a message contains a piece of text.

- [x] `/filters`: list all filters that exist currently
- [x] `/add_filter <filter>`: adds a new filter listener based on the replied
      message. This will add an "exact" filter: it will only reply to a message
      that is exactly the same as the filter.
- [x] `/add_loud_filter <filter>`: adds a new filter listener based on the
      replied message. This will add an "loud" filter: it will reply to any
      message that contains the filter within it.
- [x] `/stop_filter <filter>`: stops listening to the filter
- [x] `/activate_filter <filter>`: reactivates a filter
- [x] `/delete_filter <filter>`: removes a filter permanently
- [x] Listens to registered filters in the chat session and replies accordingly.

This feature supports the following types of messages:

- [x] text
- [x] sticker
- [x] photo
- [ ] multiple photos
- [x] animation
- [x] documents
- [x] video
- [x] video note
- [x] audio
- [x] voice recording
- [x] spoiler
- [x] bold, italic, any formatting

### Leaving count

More than we'd like to, we get into arguments and someone (me included) ends up
leaving the group at some point and returning. This is a counter that will
monitor who left and increment that metric.

- [x] `/leaving_rank`: send the rank of how many times a member left the group
- [x] Listens to the left group event, sends a goodbye message and increment
      that person's counter.
- [ ] `/set_goodbye_message <message>`: Sets the goodbye message for the group.

### Treta counter

_Treta (brazilian word): unpleasant moment where a discussion happened and
people are mad, probably would be throwing chairs at each other in a bar._

Treta counter is a counter that will register the moment in time where someone
sends a `/treta` command.

The command names are in both english and portuguese as a homage to the
brazilian software industry where one can be encouraged to implement production
code with references and function names like `getTretas(fromThisPessoa)`.

- [ ] `/treta`: register the treta message
- [ ] `/tretas`: lists all treta messages
- [ ] `/days_without_treta`: will tell us how long we managed to stay without a
      treta

### Message Auto Deletion

- [ ] Configurable through the `MESSAGE_TIMEOUT_IN_MINUTES` environment
      variable. Default is `2`.
- [ ] Feature can be toggled through the `MESSAGE_TIMEOUT_ENABLED` environment
      variable. Default is `true`.
- [ ] Deletes both command and reply messages after timeout is reached.
- [ ] Deletes all interactions that were replied with error messages.
- [ ] Deletes messages from the following commands:
- `/filters`
- `/filter_owners`
- `/add_filter`
- `/stop_filter`
- `/activate_filter`
- `/delete_filter`

### Annoying user listener

Sometimes you have that annoying friend in the chat and you want to annoy him a
bit. This is a feature inspired in that. This feature will check when that
annoying user is talking too much and will start dealing with him. Take it as a
self protection mechanism.

- [ ] `/set_annoying_user <mention>`: Sets the annoying user

### Command Usage Stats

- [ ] `/usage_stats`: will render a report with monthly usage of commands and a
      total in the end.

### Github Code Expander

- [ ] `/github_expand`: will parse a github link, render a code image and send
      it to the group.

### Chat Skills

Nice utilities for democratizing the chat.

- [x] `/set_title <title>`: will set the chat title. Anyone can use it. MortyBot
      must be added as an admin.

### Rodosol Now

Rodosol is a big road and company based in the city of Vila Velha, Espirito
Santo, Brazil. They maintain two big roads: Rodosol, and the Third Bridge that
connects Vila Velha to Vitoria. We have some commands that fetch images from
their cameras so we can have a glimpse of the traffic there.

- [x] `/rodosol_now`: fetch and display rodosol pictures if available
- [x] `/tp_now`: fetch and display third bridge pictures if available

### Horeca Skills

Horeca means "Catery Services" in Dutch. Although all Dutch know the meaning of
“horeca”, not everyone is aware of its origin: “horeca” is constructed by
combining the first two letters of the Dutch words “hotel”, “restaurant” and
“café” (meaning “bar”).

Horeca Skills are skills meant to make it easy for one to find a nice hotel,
restaurant or bar around a location.

- [x] `/suggest <keyword>`: will suggest you the best places around a 2km radius
      from the location provided by the replied message. Send a location to the
      channel, and reply to it using this command to get suggestions.

## Developing

Make sure you have Git and Deno 1.31+ available in your local environment.

```sh
# clone repository
git clone https://github.com/armand1m/mortybot.git

# cd into it
cd ./mortybot

# make sure you have deno installed
which deno

# make sure you're on 1.31+
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
MESSAGE_TIMEOUT_ENABLED=true
MESSAGE_TIMEOUT_IN_MINUTES=2
EOL
```

Now you should be able to run the bot:

```sh
deno task dev
```

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

# set bot token from @BotFather as a secret
#
# secrets in fly are automatically added to
# the instance as env vars with the same name
fly secrets set BOT_TOKEN=123123123:32132132131312

# create a volume to hold persistent group data
# 1gb is more than enough.
fly vol create mortybot_data -s 1

# ship it
fly deploy
```

Refer to https://fly.io docs for more details on other commons operations.
