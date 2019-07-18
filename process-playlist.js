#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const name = process.env.NAME;
const fileName = process.env.FILENAME;

console.log({
    name,
    fileName,
});

// https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId={PLAYLIST_ID}&key={KEY}
const playlistJson = require(fileName);

const { items } = playlistJson;

const summary = items
  .map(summarise)
  .sort((item1, item2) => {
    return item1.position - item2.position;
  });

console.log(summary);

const markdown = summary
  .map(markdownForBlog)
  .join('\n\n');

let downloadThumbnailCount = 0;
function downloadThumbnailErrback(err, filename) {
  downloadThumbnailCount += 1;
  if (downloadThumbnailCount === summary.length) {
    createBannerImage(summary, `${name}-videos.png`);
  }
}

summary
  .forEach((videoSummary) => {
    downloadThumbnail(videoSummary, downloadThumbnailErrback);
  });

console.log(markdown);

function summarise(item) {
  const {
    snippet,
  } = item;

  const {
    title,
    position,
    thumbnails,
    resourceId,
  } = snippet;

  const imageUrl = thumbnails.high.url;

  const imageFileName = `${name}-videos-thumbnail-${position}.jpeg`;

  const url = `https://www.youtube.com/watch?v=${resourceId.videoId}&t=0s`;

  return {
    position,
    url,
    title,
    imageUrl,
    imageFileName,
  };
}

function markdownForBlog(videoSummary) {
  const {
    url,
    title,
  } = videoSummary;

  const name = title.split(' - ')[0];

  return `🎞 [${name}](${url})`;
}

function downloadThumbnail(videoSummary, errback) {
  const {
    imageUrl,
    imageFileName,
  } = videoSummary;

  const absolutePath = path.resolve(__dirname, imageFileName);
  const file = fs.createWriteStream(absolutePath);
  https.get(imageUrl, function(response) {
    response.pipe(file);
  });
  file.on('finish', () => {
    console.log(`${absolutePath} <-- ${imageUrl}`);
    file.close();
    errback(undefined, absolutePath);
  });
}

function createBannerImage(summary, outputFileName) {
  const filePaths = summary
    .map((videoSummary) => {
      const {
        imageFileName,
      } = videoSummary;
      return path.resolve(__dirname, imageFileName);
    })
    .join(' ');

  const command = `montage \
    -size 1000x1000 \
    ${filePaths} \
    -auto-orient  \
    -thumbnail 400x300 \
    -bordercolor White \
    -background black +polaroid \
    -resize 40% \
    -gravity center \
    -background none \
    -extent 200x200 \
    -background Transparent \
    -geometry -10+2  \
    -tile x1  \
    ${outputFileName}`;

  childProcess.exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
    }
    console.error(stderr);
    console.log(stdout);
  });
}
