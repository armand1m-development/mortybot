import { InstagramMediaMetadata } from "../sessionData/types.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

export const extractInstagramReel = async (mediaUrl: string): Promise<InstagramMediaMetadata> => {
  const browser = await puppeteer.launch({
    args: ['--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.goto(mediaUrl);

  // // @ts-ignore
  // await page._client.send('Page.setDownloadBehavior', {
  //   behavior: 'allow',
  //   downloadPath: "." 
  // });

  const videoSelector = '[playsinline]';
  const playButtonSelector = '[playsinline] ~ div > div > div'

  await page.waitForSelector(videoSelector);
  await page.waitForSelector(playButtonSelector);

  await new Promise(r => setTimeout(r, 10000));

  const chunks: Blob[] = [];

  await page.screenshot({ path: `before_${Date.now()}.png` });

  // Handle dataavailable event in the browser context
  await page.exposeFunction('handleDataAvailable', (event: BlobEvent) => {
    // Handle data as needed
    // This function is executed in the browser context
    console.log('Data available in the browser context');

    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  await page.evaluate(() => {
    const videoSelector = '[playsinline]';
    const playButtonSelector = '[playsinline] ~ div > div > div';
    const muteButtonSelector = '[playsinline] ~ div > div > div:nth-child(3) > button';

    const videoElement = document.querySelector(videoSelector) as HTMLVideoElement;
    const playButton = document.querySelector(playButtonSelector) as HTMLDivElement;
    const muteButton = document.querySelector(muteButtonSelector) as HTMLButtonElement;

    // @ts-ignore
    const stream = videoElement.captureStream();

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      // @ts-ignore
      window.handleDataAvailable(event);
    };

    mediaRecorder.onstop = function () {
      const blob = new Blob(chunks, { type: 'video/mkv' });

      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${Date.now()}.mkv`; 

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    muteButton!.click();
    mediaRecorder.start();
    playButton!.click();
    videoElement.play();

    return new Promise<void>((resolve) => {
      videoElement.addEventListener('ended', function () {
        mediaRecorder.stop();
        resolve();
      }); 
    });
  });

  console.log(chunks.length);

  // await page.evaluate(async () => {
  //   const promise = new Promise<void>((resolve, _reject) => {
  //     const playButtonSelector = '[playsinline] ~ div > div > div';
  //     const muteButtonSelector = '[playsinline] ~ div > div > div:nth-child(3) > button';

  //     const videoElement = document.querySelector(videoSelector) as HTMLVideoElement;
  //     const playButton = document.querySelector(playButtonSelector) as HTMLDivElement;
  //     const muteButton = document.querySelector(muteButtonSelector) as HTMLButtonElement;

  //     videoElement.setAttribute("crossOrigin", "anonymous");

  //     console.log({
  //       videoElement,
  //       playButton,
  //       muteButton
  //     });

  //     // @ts-ignore
  //     const videoStream = videoElement!.captureStream();

  //     const mediaRecorder = new MediaRecorder(videoStream);
  
  //     const chunks: Blob[] = [];
  
  //     mediaRecorder.ondataavailable = function (event) {
  //       if (event.data.size > 0) {
  //         chunks.push(event.data);
  //       }
  //     };
  
  //     mediaRecorder.onstop = function () {
  //       const blob = new Blob(chunks, { type: 'video/mkv' });
  
  //       const downloadLink = document.createElement('a');
  //       downloadLink.href = URL.createObjectURL(blob);
  //       downloadLink.download = `${Date.now()}.mkv`; 
  
  //       document.body.appendChild(downloadLink);
  //       downloadLink.click();
  //       document.body.removeChild(downloadLink);
  //     };
  
  //     // @ts-ignore
  //     videoElement.addEventListener('ended', function () {
  //       mediaRecorder.stop();
  //       resolve();
  //     }); 
      
  //     muteButton!.click();
  //     mediaRecorder.start();
  //     playButton!.click();
  //   });

  //   await promise;
  // });

  await page.screenshot({ path: `${Date.now()}.png` });

  await browser.close(); 

  return {
    payload: 'lol'
  };
}