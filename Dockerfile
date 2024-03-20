# Dockerfile
ARG DENO_VERSION=1.38.5
ARG BIN_IMAGE=denoland/deno:bin-${DENO_VERSION}
FROM ${BIN_IMAGE} AS bin

FROM frolvlad/alpine-glibc:alpine-3.13

RUN apk --no-cache add ca-certificates

RUN addgroup --gid 1000 deno \
  && adduser --uid 1000 --disabled-password deno --ingroup deno \
  && mkdir /app/ \
  && chown deno:deno /app/

ENV DENO_DIR /app/
ENV DENO_INSTALL_ROOT /usr/local

ARG DENO_VERSION
ENV DENO_VERSION=${DENO_VERSION}
COPY --from=bin /deno /bin/deno

WORKDIR /app
COPY . .

RUN deno cache \
  --lock=deno.lock \
  --lock-write \
  main.ts

RUN deno task generate:skills

ENTRYPOINT ["/bin/deno"]
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "main.ts"]