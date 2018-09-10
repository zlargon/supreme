const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

module.exports = (secret, response) => {
  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', response);

  return fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'post',
    body: params
  })
  .then(res => res.json());
}
