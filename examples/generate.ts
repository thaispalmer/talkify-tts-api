import 'dotenv/config';
import Talkify from '../src';
import { createWriteStream } from 'fs';

const talkify = new Talkify({
  key: process.env.TALKIFY_KEY
});

talkify.speech("Just a test with the default settings")
  .then(result => {
    result.pipe(createWriteStream('out.mp3'));
  })
  .catch(err => {
    console.error(err.message);
  });
