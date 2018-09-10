const express = require('express');
const router = express.Router();
const verify = require('../lib/grecaptcha-verify');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.sendFile('./public/index.html', { root: __dirname + '/..'});
});

router.get('/recaptcha', (req, res, next) => {
  res.sendFile('./public/recaptcha.html', { root: __dirname + '/..'});
});

router.post('/recaptcha', (req, res, next) => {
  const secret = '6LcLVm8UAAAAAJPqEiifvZogYGv-PZ_TNZKMhUYS';
  const response = req.body['g-recaptcha-response'];

  verify(secret, response)
    .then(data => {
      res.status(200).json([req.body, data]);
    });
});

module.exports = router;
