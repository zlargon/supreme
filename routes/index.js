var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.sendFile('./public/index.html', { root: __dirname + '/..'});
});

router.get('/recaptcha', (req, res, next) => {
  res.sendFile('./public/recaptcha.html', { root: __dirname + '/..'});
});

router.post('/recaptcha', (req, res, next) => {
  console.log(req.body);
});

module.exports = router;
