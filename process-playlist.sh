#!/bin/bash

API_KEY="${1}"
PLAYLIST_ID="${2}"
NAME="${3}"
HERE_PATH="$( cd "$(dirname "$0")" ; pwd -P )"

URL="https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}"
FILENAME="${PWD}/${NAME}-youtube-playlist.json"

curl "${URL}" > "${FILENAME}"

export NAME
export FILENAME
node "${HERE_PATH}/process-playlist.js"
