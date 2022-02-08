require('dotenv').config();
const { Talkify } = require('../lib');

const talkify = new Talkify({
  key: process.env.TALKIFY_KEY
});

talkify.detectLanguage('Omelette du fromage')
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.error(err);
  });
