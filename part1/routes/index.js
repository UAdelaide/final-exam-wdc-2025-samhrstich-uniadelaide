var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Dog of the Day' });
});

fetch("https://dog.ceo/api/breeds/image/random");
  .then()


module.exports = router;
