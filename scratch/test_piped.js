import fetch from 'node-fetch';

const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.oxymoron.solutions',
  'https://pipedapi.kavin.rocks'
];

async function run() {
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log('Trying', instance);
      const url = `${instance}/search?q=${encodeURIComponent("Queen Bohemian Rhapsody lyrics")}&filter=music_songs`;
      console.log('URL:', url);
      const res = await fetch(url);
      if (!res.ok) {
        console.log('Not ok status:', res.status);
        continue;
      }
      const data = await res.json();
      console.log('Items count:', data.items?.length);
      if (data.items) {
        data.items.slice(0, 5).forEach((item, idx) => {
          console.log(`${idx}: [${item.duration}s] title: ${item.title} | uploader: ${item.uploaderName} | url: ${item.url}`);
        });
        break;
      }
    } catch (err) {
      console.error(err);
    }
  }
}

run();
