/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , admin = require('./routes/admin')
  , login = require('./routes/login')
  , alert = require('./routes/alert')
  , boarding = require('./routes/boarding');

//JUST FOR PASSPORT LOGIN
var passport = require('passport');
require('./routes/passport')(passport);


var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/beacon");

var mongoURL = "mongodb://localhost:27017/beacon";
var expressSession = require("express-session");
var mongoStore = require("connect-mongo")(expressSession);

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/public/img', limit: '3mb'}));
app.use(express.methodOverride());
//app.use('/uploads', express.static(path.join(__dirname,'uploads')));
//app.use(multer({dest: './uploads/'}))

//EXPRESS SESSION CONFIG
app.use(expressSession({
	key: 'beacon_cookie',
    secret: 'beacon',
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new mongoStore({
		url: mongoURL
	})
}));
app.use(passport.initialize());
// app.use(passport.session());


app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


//GET REQUEST
app.get('/', isAuthenticated, admin.home);
app.get('/users', user.list);

app.get('/boarding/add', boarding.addPage);
app.post('/boarding/reg', boarding.add);

app.get('/boarding/pass', boarding.passPage);

app.get('/boarding/remove', boarding.removePage);
app.post('/boarding/remove', boarding.removePass);

app.get('/boarding', boarding.info);

app.get('/login', login.signIn);
app.get('/signup', login.signUp);
app.post('/signup',login.regUser);
app.get('/logout', function(req,res) {
  req.session.destroy(function(err){
    res.redirect('/');
  })
});

app.get('/alert/all',alert.getAlerts);
app.post('/alert/create',alert.createAlert);
app.post('/alert/edit',alert.editAlert);
app.post('/alert/delete',alert.deleteAlert);


function isAuthenticated(req, res, next) {
  if(req.session.user) {
     return next();
  }
  res.redirect('/login');
};



//POST REQUEST
app.post('/login', function(req, res, next) {
  passport.authenticate('login', function(err, user, info) {
    if(err) {
      return next(err);
    }

    if(!user) {
      req.session.wrongSignIn = true;
      res.redirect('/login');
    }
    else{
      req.logIn(user, {session: false}, function(err) {
        if(err) {
          return next(err);
        }
        req.session.user = user;
        return res.redirect('/');
      })
    }
  })(req, res, next);
});


app.post('/reg', login.regUser);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
