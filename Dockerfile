FROM denoland/deno:2.9.4

RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig \
  && rm -rf /var/lib/apt/lists/*
COPY ./fonts/impact-font /usr/share/fonts/impact-font
RUN fc-cache -fv
WORKDIR /app
COPY deno.json deno.lock ./
RUN deno install --frozen

COPY . .
RUN deno task generate:skills
RUN deno cache --frozen main.ts src/skills/*/mod.ts

CMD ["task", "start"]
