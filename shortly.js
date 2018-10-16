var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('signup', __dirname + '/signup');
app.set('login', __dirname + '/login');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(
  session({
    name: 'user',
    secret: 'secret stuff',
    saveUninitialized: false
  })
);

app.get('/', function(req, res) {
  if (req.session.user) {
    res.render('index');
  } else {
    res.redirect('login');
  }
  //else sent to login page
});

app.get('/create', function(req, res) {
  if (req.session.user) {
    res.render('index');
  } else {
    res.redirect('login');
  }
});

app.get('/links', function(req, res) {
  if (req.session.user) {
    Links.reset()
      .fetch()
      .then(function(links) {
        //res.redirect('index');
        res.status(200).send(links.models);
      });
  } else {
    res.redirect('login');
  }
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        }).then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username, password: password })
    .fetch()
    .then(function(found) {
      if (found) {
        req.session.regenerate(function() {
          req.session.user = username;
          res.redirect('/');
        });
      } else {
        res.redirect('/login');
      }
    });
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      console.log('USER EXISTS!');
      res.redirect('/');
    } else {
      //hashpasswordfunction
      Users.create({
        username: username,
        password: password //need to hash
      }).then(function(result) {
        req.session.regenerate(function() {
          req.session.user = username;
          res.redirect('/');
        });
      });
    }
  });
});

app.post('/logout', function(req, res) {
  delete req.session.user;
});

/*
new Book({'ISBN-13': '9780440180296'})
.fetch()
.then(function(model) {
  // outputs 'Slaughterhouse Five'
  console.log(model.get('title'));
});
*/
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
