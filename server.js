_ = require('underscore');
validator = require('validator');

fs = require('fs');
var express = require('express');
var handlebars = require('handlebars');

crypto = require('crypto')
var exphbs = require('express3-handlebars');
var moment = require('moment');

app = express();

var sqlite3 = require('sqlite3').verbose();
var https = require('https');
var http = require('http');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

db = new sqlite3.Database('TimeClock.db');

colors = require('colors');

var MiscGet = require('./MiscGet');
var MiscPost = require('./MiscPost');

var AdminGet = require('./AdminGet');
var AdminPost = require('./AdminPost');
var AdminAjax = require('./AdminAjax');
var AdminVerify = require('./AdminVerify');

var ClientGet = require('./ClientGet');
var ClientPost = require('./ClientPost');
var ClientAjax = require('./ClientAjax');

var port = 80;

var server_options = {
	key: fs.readFileSync('/etc/letsencrypt/live/www.pafijohn.com/privkey.pem', 'utf-8'),
	cert: fs.readFileSync('/etc/letsencrypt/live/www.pafijohn.com/cert.pem', 'utf-8'),
};

MAX_STRING_LENGTH = 255;

_.mixin({
	endsWith: function(string, suffix)
	{
		return new RegExp(suffix + '$').test(string);
	}
});

_.mixin({
	getSalt: function() {
		min = 32;
		max = 126;
		var str = '';
		
		for (var i = 0; i < 20; i++)
		{
			var j = _.random(min, max)
			str += String.fromCharCode(j);
		}
		
		return str;
	}
});

_.mixin({
	isSafeString: function(str) {
		return str == _.escape(str);
	}
});

var hbs = exphbs.create({
	defaultLayout: 'main',
	helpers: {
		MsTime: function (context, options)
		{
			if(context)
			{
				return moment(context).format('MMM DD, YYYY HH:mm:ss');
			}
			return '';
		},
		HoursDiff: function (context, options)
		{
			if(context)
			{
				var duration = moment.duration(moment(context.TimeOut).diff(moment(context.TimeIn)));
				var hours = duration.asMinutes() / 60;
				return String(hours);
			}
			return '';
		},
		Bool: function (context, options)
		{
			if(!_.isUndefined(context))
			{
				return (context) ? 'Yes' : 'No';
			}
			return '';
		},
	}
});

getRoundedTime = function()
{
	var now = moment();
	var CurrentMinutes = 0;
	var MinutesPast = 0;
	var MinutesOffset = 0;
	var EpochTime = 0;

	now.millisecond(0);
	now.second(0);

	CurrentMinutes = now.minutes();
	MinutesPast = CurrentMinutes % 6;

	CurrentMinutes += (MinutesPast < 3) ? (-MinutesPast) : (6 - MinutesPast);

	now.minutes(CurrentMinutes);

	EpochTime = now.valueOf();

	return EpochTime;
};

getPayPeriod = function()
{
	var MAX_PAY_PERIOD = 24;
	var now = moment();
	var payPeriod = (now.month() + 1) * 2;
	payPeriod -= now.date() <= 15 ? 1 : 0;

	// for SDA
	payPeriod++;
	if(payPeriod >= 25)
	{
		payPeriod %= MAX_PAY_PERIOD;
	}

	return payPeriod;
};

app.use(cookieParser());
app.use(session({
	secret: _.getSalt(),
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.all('*', ensureSecure); // at top of routing calls

http.createServer(app).listen(80)

function ensureSecure(req, res, next) {
	if(req.secure)
	{
		// OK, continue
		return next();
	};
	
	// handle port numbers if you need non defaults
	// res.redirect('https://' + req.host + req.url); // express 3.x
	res.redirect('https://' + req.hostname + req.url); // express 4.x
}


// Miscellaneous Gets
app.get('/', MiscGet.Index);
app.get('/styles/*', MiscGet.Styles);
app.get('/scripts/*', MiscGet.Scripts);

// Miscellaneous Posts
app.post('/LoginPost', MiscPost.Login);

// Jobs
app.route('/Admin/Jobs')
	.all(AdminVerify.IsAuthenticated)
	.get(AdminGet.Jobs)

app.route('/Admin/Jobs/Edit/*')
	.all(AdminVerify.IsAuthenticated)
	.get(AdminGet.JobsEdit)
	.all(AdminVerify.JobsEdit)
	.post(AdminPost.JobsEdit)

// Hours
app.route('/Admin/Hours')
	.all(AdminVerify.IsAuthenticated)
	.get(AdminGet.Hours)

app.route('/Admin/Hours/Edit/*')
	.all(AdminVerify.IsAuthenticated)
	.get(AdminGet.HoursEdit)
	.all(AdminVerify.HoursEdit)
	.post(AdminPost.HoursEdit)

app.route('/Admin/Hours/Query/*')
	.all(AdminVerify.IsAuthenticated)
	.all(AdminVerify.HoursQuery)
	.get(AdminAjax.HoursQuery)

// Users
app.route('/Admin/Users')
	.all(AdminVerify.IsAuthenticated)
	.get(AdminGet.Users)

app.route('/Admin/Users/Edit/*')
	.all(AdminVerify.IsAuthenticated)
	.get(AdminGet.UsersEdit)
	.all(AdminVerify.UsersEdit)
	.post(AdminPost.UsersEdit)

// Assign
app.route('/Admin/Assign')
	.all(AdminVerify.IsAuthenticated)
	.get(AdminGet.Assign)

app.route('/Admin/Assign/Edit/*')
	.all(AdminVerify.IsAuthenticated)
	.get(AdminGet.AssignEdit)
	.all(AdminVerify.AssignEdit)
	.post(AdminPost.AssignEdit)

// Client Gets
app.get('/Jobs', ClientGet.ClientJobs);
app.get('/Hours', ClientGet.ClientHours);
app.get('/Hours/:payPeriod', ClientGet.ClientHoursPayPeriod);

// Client Posts
app.post('/Login', ClientPost.Login);
app.post('/Logout', ClientPost.Logout);

// Miscellaneous Ajax
// Admin Ajax
app.get('/Admin/Ajax/UserJobs/:UserId', AdminAjax.UserJobs)

/****************************** Database ******************************/

db.serialize(function()
{
	db.run(
		'CREATE TABLE IF NOT EXISTS TimeTable\
		(\
			_id INTEGER PRIMARY KEY AUTOINCREMENT,\
			UserId INTEGER NOT NULL,\
			JobId INTEGER NOT NULL,\
			TimeIn INTEGER NOT NULL,\
			TimeOut INTEGER,\
			RecordComment TEXT,\
			PayPeriod INTEGER NOT NULL,\
			Valid INTEGER NOT NULL\
		);'
	);
	
	db.run(
		'CREATE TABLE IF NOT EXISTS JobsTable\
		(\
			_id INTEGER PRIMARY KEY AUTOINCREMENT,\
			JobName TEXT NOT NULL,\
			JobDescription TEXT,\
			Valid INTEGER NOT NULL\
		 );'
	);
	
	db.run(
		'CREATE TABLE IF NOT EXISTS UsersTable\
		(\
			_id INTEGER PRIMARY KEY AUTOINCREMENT,\
			UserName TEXT NOT NULL UNIQUE,\
			UserPassword TEXT NOT NULL,\
			IsAdmin INTEGER NOT NULL,\
			Valid INTEGER NOT NULL,\
			Salt TEXT NOT NULL\
		);'
	);
	
	db.run(
		'CREATE TABLE IF NOT EXISTS UserJobsTable\
		(\
			_id INTEGER PRIMARY KEY AUTOINCREMENT,\
			UserId INTEGER NOT NULL,\
			JobId INTEGER NOT NULL\
		 );'
	);
	
	// If there isn't a valid admin, make one
	// Shouldnt usually happen
	db.get('SELECT * FROM UsersTable WHERE IsAdmin=1 AND Valid=1;', function(err, row) {
		if(_.isUndefined(row))
		{
			var salt = _.getSalt();
			var password = crypto.createHash('sha256').update('password' + salt).digest('base64');
			db.run('INSERT INTO UsersTable VALUES(NULL,?,?,1,1,?);', 'admin', password, salt);
		}
	});
});

/**********************************************************************/

https.createServer(server_options, app).listen(443);