FROM denoland/deno:2.9.4

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fontconfig \
  && rm -rf /var/lib/apt/lists/*
COPY ./fonts/impact-font /usr/share/fonts/impact-font
RUN fc-cache -fv
WORKDIR /app
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

COPY deno.json deno.lock ./
RUN deno install --frozen

COPY . .
RUN deno task generate:skills
RUN deno cache --frozen main.ts src/skills/*/mod.ts

CMD ["task", "start"]
