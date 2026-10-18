ARG ALPINE_VERSION=3.22
FROM alpine:${ALPINE_VERSION}
RUN apk add --no-cache transmission-daemon
ENTRYPOINT ["transmission-daemon", "-f", "-g", "/tmp/transmission", "-a", "*", "-T", "-O"]
