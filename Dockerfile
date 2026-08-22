FROM tailscale/tailscale:v1.98.9 AS tailscale

FROM denoland/deno:2.9.4

# ffmpeg samples frames out of the videos the assistant is asked to look at;
# without it a video degrades to the cover frame Telegram sends with it.
RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig ffmpeg iptables \
  && rm -rf /var/lib/apt/lists/*
COPY --from=tailscale /usr/local/bin/tailscale /usr/local/bin/tailscale
COPY --from=tailscale /usr/local/bin/tailscaled /usr/local/bin/tailscaled
COPY ./fonts/impact-font /usr/share/fonts/impact-font
RUN fc-cache -fv
WORKDIR /app
COPY deno.json deno.lock ./
RUN deno install --frozen

COPY . .
RUN deno task generate:skills
RUN deno cache --frozen main.ts src/skills/*/mod.ts \
  src/skills/assistant/mcp/servers/searxng.ts

CMD ["/bin/sh", "/app/start.sh"]
