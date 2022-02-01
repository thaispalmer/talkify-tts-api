require('dotenv').config();
const { Talkify } = require('../lib');
const { createWriteStream } = require('fs');

const talkify = new Talkify({
  key: process.env.TALKIFY_KEY
});

talkify.speech("Just a test with the default settings")
  .then(result => {
    result.pipe(createWriteStream('out.mp3'));
  })
  .catch(err => {
    console.error(err);
  });
