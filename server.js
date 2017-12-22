_ = require('underscore');
validator = require('validator');

fs = require('fs');
var express = require('express');
var handlebars = require('handlebars');
var pdf = require('html-pdf');

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

db = new sqlite3.Database('TimeClock_V2.db');

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

var server_options = {
	key: fs.readFileSync('/etc/letsencrypt/live/www.pafijohn.com/privkey.pem', 'utf-8'),
	cert: fs.readFileSync('/etc/letsencrypt/live/www.pafijohn.com/cert.pem', 'utf-8'),
};

MAX_STRING_LENGTH = 255;

_.mixin({
	endsWith: function(string, suffix) {
		return new RegExp(suffix + '$').test(string);
	}
});

_.mixin({
	getSalt: function() {
		min = 32;
		max = 126;
		var str = '';
		
		for (var i = 0; i < 20; i++) {
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

_.mixin({
	toDate: function(str) {
		return moment(str, 'MM/DD/YY HH:mm', true);
	}
});

_.mixin({
	isDate: function(str) {
		var valid = _.toDate(str).isValid();
		return valid;
	}
});


var hbs = exphbs.create({
	defaultLayout: 'main',
	helpers: {
		MsTime: function (context, options) {
			if (context) {
				return moment(context).format('MM/DD/YY HH:mm');
			}
			return '';
		},
		HoursDiff: function (context, options) {
			if (context) {
				var duration = moment.duration(moment(context.TimeOut).diff(moment(context.TimeIn)));
				var hours = duration.asMinutes() / 60;
				return String(hours);
			}
			return '';
		},
		Bool: function (context, options) {
			if (!_.isUndefined(context)) {
				return (context) ? 'Yes' : 'No';
			}
			return '';
		},
		Concat: function (context, options) {
			if (context) {
				return context.join(', ');
			}
			return '';
		},
	}
});

getRoundedTime = function() {
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

getPayPeriod = function() {
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
	if(req.secure) {
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
app.get('/error/:errorId', MiscGet.Error);

app.post('/pdftest', function(req, res) {
	var file = fs.readFileSync(__dirname + '/views/Admin/Hours/PdfExport.handlebars', 'UTF-8');
	var template = handlebars.compile(file);
	
	var Stmt = '\
		SELECT Users.Name, \
		Jobs.JobName, \
		Times._id, \
		Times.TimeIn, \
		Times.TimeOut, \
		Times.RecordComment, \
		Times.PayPeriod, \
		Times.Valid \
		FROM Users \
		JOIN Times \
		ON Times.UserId=Users._id \
		JOIN Jobs \
		ON Times.JobId=Jobs._id;';
	
	
	db.all(Stmt, function(err, rows){
		var html = template({rows: rows});
		pdf.create(html).toBuffer(function(err, buffer) {
			if (err) console.log(err);
			
			res.setHeader('Content-disposition', 'attachment; filename=pdf.pdf');
			res.setHeader('Content-type', 'application/pdf');
			
			res.charset = 'UTF-8';
			
			res.write(buffer);
			res.end();
		});
	});
});

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
		'CREATE TABLE IF NOT EXISTS Times\
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
		'CREATE TABLE IF NOT EXISTS Jobs\
		(\
			_id INTEGER PRIMARY KEY AUTOINCREMENT,\
			JobName TEXT NOT NULL,\
			JobDescription TEXT,\
			Valid INTEGER NOT NULL\
		 );'
	);
	
	db.run(
		'CREATE TABLE IF NOT EXISTS Users\
		(\
			_id INTEGER PRIMARY KEY AUTOINCREMENT,\
			Name TEXT NOT NULL UNIQUE,\
			Password TEXT NOT NULL,\
			Valid INTEGER NOT NULL,\
			Salt TEXT NOT NULL\
		);'
	);
	
	db.run(
		'CREATE TABLE IF NOT EXISTS Assignments\
		(\
			_id INTEGER PRIMARY KEY AUTOINCREMENT,\
			UserId INTEGER NOT NULL,\
			JobId INTEGER NOT NULL\
		 );'
	);
	
	db.run(
		'CREATE TABLE IF NOT EXISTS Permissions\
		(\
			_id INTEGER PRIMARY KEY AUTOINCREMENT,\
			UserId INTEGER,\
			Permission TEXT NOT NULL UNIQUE,\
			FOREIGN KEY (UserId) REFERENCES UsersTable\
		);'
	);
	
/*
PERMISSIONS:
	ASSIGN_PERMISSIONS
	ASSIGN_JOB
	
	CREATE_USER
	DELETE_USER
	EDIT_USER
	VIEW_USER
	
	CREATE_JOB
	DELETE_JOB
	EDIT_JOB
	VIEW_JOB
	
	CREATE_TIME
	DELETE_TIME
	EDIT_TIME
	VIEW_TIME
*/
	
	// If there are no accounts, make the admin
	// Not sure what to do if someone accidentally removes the admin account and doesnt replace it
	// Shouldnt usually happen
	db.get('SELECT * FROM Users WHERE Name=?;', 'admin', function(err, row) {
		if(_.isUndefined(row)) {
			var salt = _.getSalt();
			var password = crypto.createHash('sha256').update('password' + salt).digest('base64');
			db.run('INSERT INTO Users VALUES(NULL,?,?,1,?);', 'admin', password, salt, function(err, row) {
				db.get('SELECT _id FROM Users WHERE Name=?;', 'admin', function(err, row) {
					_.each([
						'ASSIGN_PERMISSIONS',
						'ASSIGN_JOB',
					
						'CREATE_USER',
						'DELETE_USER',
						'EDIT_USER',
						'VIEW_USER',
						
						'CREATE_JOB',
						'DELETE_JOB',
						'EDIT_JOB',
						'VIEW_JOB',
						
						'CREATE_TIME',
						'DELETE_TIME',
						'EDIT_TIME',
						'VIEW_TIME'
					], function(item) {
						db.run('INSERT INTO Permissions VALUES(NULL,?,?);', row._id, item);
					});
				});
			});
		}
	});
});

/**********************************************************************/

https.createServer(server_options, app).listen(443);