/****************************** Jobs ******************************/

module.exports.JobsEdit = function( req, res )
{
  var _id            = validator.toInt( req.body._id );
  var JobName        = req.body.JobName;
  var JobDescription = req.body.JobDescription;
  var Valid          = validator.toBoolean( req.body.Valid );
  
  var Stmt;
  if( _.isNaN( _id ) )
  {
    Stmt = db.prepare(
      'INSERT INTO JobsTable VALUES(NULL,?,?,?);',
      JobName,
      JobDescription,
      Valid
    );
  }
  else
  {
    Stmt = db.prepare(
      'UPDATE JobsTable \
      SET JobName=?, JobDescription=?, Valid=? \
      WHERE _id=?;',
      JobName,
      JobDescription,
      Valid,
      _id
    );
  }
  
  Stmt.run( function( err, row )
  {
    if( err ) throw err;
    res.redirect( '/Admin/Jobs' );
  });
};

/****************************** Hours ******************************/

module.exports.HoursEdit = function( req, res )
{
  var _id           = validator.toInt( req.body._id );
  var UserId        = validator.toInt( req.body.UserId );
  var JobId         = validator.toInt( req.body.JobId );
  var TimeIn        = validator.toDate( req.body.TimeIn );
  var TimeOut       = validator.toDate( req.body.TimeOut );
  var RecordComment = validator.escape( req.body.RecordComment );
  var PayPeriod     = validator.toInt( req.body.PayPeriod );
  var Valid         = validator.toBoolean( req.body.Valid );
  
  var Statement;
  
  if( _.isNaN( _id ) )
  {
    Statement = db.prepare( 'INSERT INTO TimeTable VALUES( NULL,?,?,?,?,?,?,? );',
      UserId,
      JobId,
      TimeIn,
      TimeOut,
      RecordComment,
      PayPeriod,
      Valid
    );
  }
  else
  {
    var Stmt = '\
      UPDATE TimeTable \
      SET UserId=?, \
      JobId=?, \
      TimeIn=?, \
      TimeOut=?, \
      RecordComment=?, \
      PayPeriod=?, \
      Valid=? \
      WHERE _id=?;\
    ';
    
    Statement = db.prepare(
      Stmt,
      UserId,
      JobId,
      TimeIn,
      TimeOut,
      RecordComment,
      PayPeriod,
      Valid,
      _id
    );
  }
  
  db.get( 'SELECT * FROM UserJobsTable WHERE UserId=? AND JobId=?;', UserId, JobId, function( err, row )
  {
    if( !_.isUndefined( row ) )
    {
      Statement.run( function( err, row )
      {
        if( err ) throw err;
        res.redirect( '/Admin/Hours' );
      });
    }
  });
};

/****************************** Users ******************************/

module.exports.UsersEdit = function( req, res )
{
  var Statement;
  var UserName     = req.body.UserName;
  var IsAdmin      = validator.toBoolean( req.body.IsAdmin );
  var Valid        = validator.toBoolean( req.body.Valid );
  var _id          = validator.toInt( req.body._id );
  var UserPassword = crypto.createHash( 'sha256' ).update( req.body.UserPassword ).digest( 'base64' );
  
  if( _.isNaN( _id ) )
  {
    Statement = db.prepare(
      'INSERT INTO UsersTable VALUES( NULL,?,?,?,? );',
      UserName,
      UserPassword,
      IsAdmin,
      Valid
    );
  }
  else
  {
    if( req.body.UserPassword.length > 0 )
    {
      Statement = db.prepare( 'UPDATE UsersTable SET UserName=?, UserPassword=?, IsAdmin=?, Valid=? WHERE _id=?;',
        UserName,
        UserPassword,
        IsAdmin,
        Valid,
        _id
       );
    }
    else
    {
      Statement = db.prepare( 'UPDATE UsersTable SET UserName=?, IsAdmin=?, Valid=? WHERE _id=?;',
        UserName,
        IsAdmin,
        Valid,
        _id
       );
    }
  }
  Statement.run( function( err, row )
  {
    res.redirect( '/Admin/Users' );
  });
};

/****************************** Assignment ******************************/

module.exports.AssignEdit = function( req, res )
{ 
  _.each( req.body.UserIds, function( UserElement )
  {
    var UserId = validator.toInt( UserElement );
    _.each( req.body.JobIds, function( JobElement )
    {
      var JobId = validator.toInt( JobElement );
      
      if( req.body.method == 'ADD' )
      {
        db.get( 'SELECT * FROM UserJobsTable WHERE UserId=? AND JobId=?;', UserId, JobId, function( err, row )
        {
          if( _.isUndefined( row ) )
          {
            db.run( 'INSERT INTO UserJobsTable VALUES (NULL,?,?);', UserId, JobId );
          }
        });
      }
      else if( req.body.method == 'DELETE' )
      {
        db.run( 'DELETE FROM UserJobsTable WHERE UserId=? AND JobId=?;', UserId, JobId );
      }
    });
  });
  res.redirect( '/Admin/Assign' );
};