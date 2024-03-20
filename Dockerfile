FROM denoland/deno:1.38.5

ENV DENO_DIR /app/
WORKDIR /app
COPY . .

RUN deno cache \
  --lock=deno.lock \
  --lock-write \
  main.ts

RUN deno task generate:skills
RUN deno cache ./main.ts

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-ffi", "main.ts"]