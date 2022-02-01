import 'dotenv/config';
import Talkify from '../src';

const talkify = new Talkify({
  key: process.env.TALKIFY_KEY
});

talkify.availableVoices('English')
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.error(err);
  });
