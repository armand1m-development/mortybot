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

Commands to get information about the cameras of the roads of Espírito Santo.
_(deprecated since Rodosol is not supplying these anymore)_

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
      income=36000&allowance=true&socialSecurity=true
