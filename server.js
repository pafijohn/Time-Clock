_ = require( 'underscore' );
validator = require( 'validator' );

fs = require( 'fs' );
var express = require( 'express' );
var handlebars = require( 'handlebars' );

crypto = require( 'crypto' )
var exphbs = require( 'express3-handlebars' );
var moment = require( 'moment' );

app = express();

var sqlite3 = require( 'sqlite3' ).verbose();
var server = require( 'http' ).createServer( app );

var cookieParser = require( 'cookie-parser' )
var session = require( 'express-session' )
var bodyParser = require( 'body-parser' )

//db = new sqlite3.Database( ':memory:' );
db = new sqlite3.Database( 'TimeClock.db' );

var MiscGet = require( './MiscGet' );
var MiscPost = require( './MiscPost' );

var AdminGet = require( './AdminGet' );
var AdminPost = require( './AdminPost' );
var AdminAjax = require( './AdminAjax' );
var AdminVerify = require( './AdminVerify' );

var ClientGet = require( './ClientGet' );
var ClientPost = require( './ClientPost' );
var ClientAjax = require( './ClientAjax' );

MAX_STRING_LENGTH = 255

_.mixin({
  endsWith: function(string, suffix)
  {
    return new RegExp( suffix + '$' ).test( string );
  }
});

validator.extend( 'isSafeString', function( str )
{
  return /^[\w ]*$/.test( str );
});

validator.extend( 'isBoolean', function( str )
{
  return str == '0' || str == '1';
});

validator.extend( 'isBetween', function( str, lower, upper )
{
  var i = validator.toInt( str );
  return i >= lower && i <= upper;
});

handlebars.registerHelper( 'HoursDiff', function( context, options )
{
  return ( moment( context.TimeOut ).subtract( context.TimeIn ).minutes() / 60 );
});

handlebars.registerHelper( 'MsTime', function( context, options )
{
  if( context )
  {
    return moment( context ).format( 'MMM DD, YYYY HH:mm:ss' );
  }
  return ''
});

handlebars.registerHelper( 'Bool', function( context, options )
{
  return ( context != 0 ) ? 'Yes' : 'No';
});

getRoundedTime = function()
{
  var now = moment();
  var CurrentMinutes = 0;
  var MinutesPast = 0;
  var MinutesOffset = 0;
  var EpochTime = 0;
  
  now.millisecond( 0 );
  now.second( 0 );
  
  CurrentMinutes = now.minutes();
  MinutesPast = CurrentMinutes % 6;
  
  CurrentMinutes += ( MinutesPast < 3 ) ? ( -MinutesPast ) : ( 6 - MinutesPast );
  
  now.minutes( CurrentMinutes );
  
  EpochTime = now.valueOf();
  
  return EpochTime;
};

getPayPeriod = function()
{
  var now = moment();
  var payPeriod = ( now.month() + 1 ) * 2;
  payPeriod -= now.date() <= 15 ? 1 : 0;
  return payPeriod;
};

app.use( cookieParser() );
app.use( session( { secret: 'zaHP9zHNMhx3fu01F1FT' } ) );
app.use( bodyParser() );

app.engine( 'handlebars', exphbs( { defaultLayout: 'main' } ) );
app.set( 'view engine', 'handlebars' );

// Miscellaneous Gets
app.get( '/',          MiscGet.Index );
app.get( '/styles/*',  MiscGet.Styles );
app.get( '/scripts/*', MiscGet.Scripts );

// Miscellaneous Posts
app.post( '/LoginPost', MiscPost.Login );

// Jobs
app.route( '/Admin/Jobs' )
  .all( AdminVerify.IsAuthenticated )
  .get( AdminGet.Jobs )

app.route( '/Admin/Jobs/Edit/*' )
  .all( AdminVerify.IsAuthenticated )
  .get( AdminGet.JobsEdit )
  .all( AdminVerify.JobsEdit )
  .post( AdminPost.JobsEdit )

// Hours
app.route( '/Admin/Hours' )
  .all( AdminVerify.IsAuthenticated )
  .get( AdminGet.Hours )

app.route( '/Admin/Hours/Edit/*' )
  .all( AdminVerify.IsAuthenticated )
  .get( AdminGet.HoursEdit )
  .all( AdminVerify.HoursEdit )
  .post( AdminPost.HoursEdit )

app.route( '/Admin/Hours/Query/*' )
  .all( AdminVerify.IsAuthenticated )
  .all( AdminVerify.HoursQuery )
  .get( AdminAjax.HoursQuery )

// Users
app.route( '/Admin/Users' )
  .all( AdminVerify.IsAuthenticated )
  .get( AdminGet.Users )

app.route( '/Admin/Users/Edit/*' )
  .all( AdminVerify.IsAuthenticated )
  .get( AdminGet.UsersEdit )
  .all( AdminVerify.UsersEdit )
  .post( AdminPost.UsersEdit )

// Assign
app.route( '/Admin/Assign' )
  .all( AdminVerify.IsAuthenticated )
  .get( AdminGet.Assign )

app.route( '/Admin/Assign/Edit/*' )
  .all( AdminVerify.IsAuthenticated )
  .get( AdminGet.AssignEdit )
  .all( AdminVerify.AssignEdit )
  .post( AdminPost.AssignEdit )

// Client Gets
app.get( '/Jobs',             ClientGet.ClientJobs );
app.get( '/Hours',            ClientGet.ClientHours );
app.get( '/Hours/:payPeriod', ClientGet.ClientHoursPayPeriod );

// Client Posts
app.post( '/Login', ClientPost.Login );
app.post( '/Logout', ClientPost.Logout );

// Miscellaneous Ajax
// Admin Ajax
app.get( '/Admin/Ajax/UserJobs/:UserId', AdminAjax.UserJobs )

/****************************** Database ******************************/

db.serialize( function()
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
      Valid INTEGER NOT NULL\
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
  
  db.get( 'SELECT * FROM UsersTable WHERE IsAdmin=1 AND Valid=1;', function( err, row )
  {
    if( _.isUndefined( row ) )
    {
      db.run( 'INSERT INTO UsersTable VALUES( NULL,?,?,1,1 );', 'admin', crypto.createHash( 'sha256' ).update( 'password' ).digest( 'base64' ) );
    }
  });
});

/**********************************************************************/


console.log( 'Listening...' );
server.listen( 80 );