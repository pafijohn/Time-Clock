module.exports.UserJobs = function( req, res )
{
  var isValidRequest = (
    _.has( req.params, 'UserId' ) &&
    validator.isLength( req.params.UserId, 1, MAX_STRING_LENGTH ) &&
    validator.isInt( req.params.UserId )
  );
  
  if( isValidRequest )
  {
    var UserId = validator.toInt( req.params.UserId );
    var Stmt = '\
      SELECT * \
      FROM JobsTable \
      JOIN UserJobsTable \
      ON UserJobsTable.JobId=JobsTable._id \
      WHERE UserJobsTable.UserId=?;\
    ';
    
    db.all( Stmt, UserId, function( err, rows ) {
      var options = {
        layout: false,
        jobs: rows
      };
      
      app.render( 'Admin/Hours/UsersToJobs', options, function( err, html )
      {
        if(err) throw err;
        res.send( html );
      });
    });
  }
}

module.exports.HoursQuery = function( req, res )
{
  var UserId = validator.toInt( req.query.UserId );
  var JobId = validator.toInt( req.query.JobId );
  var Comment = validator.escape( req.query.Comment );
  var PayPeriod = validator.toInt( req.query.PayPeriod );
  var Valid = validator.toBoolean( req.query.Valid );
  
  var Stmt = '\
    SELECT UsersTable.UserName, \
    JobsTable.JobName, \
    TimeTable._id, \
    TimeTable.TimeIn, \
    TimeTable.TimeOut, \
    TimeTable.RecordComment, \
    TimeTable.PayPeriod, \
    TimeTable.Valid \
    FROM UsersTable \
    JOIN TimeTable \
    ON TimeTable.UserId=UsersTable._id \
    JOIN JobsTable \
    ON TimeTable.JobId=JobsTable._id\
  ';
  
  var whereClause = [];
  var params = [];
  
  if( !_.isNaN( UserId ) )
  {
    whereClause.push( 'TimeTable.UserId=?' );
    params.push( UserId );
  }
  
  if( !_.isNaN( JobId ) )
  {
    whereClause.push( 'TimeTable.JobId=?' );
    params.push( JobId );
  }
  
  if( Comment.length )
  {
    whereClause.push( 'TimeTable.RecordComment LIKE ?' );
    params.push( '%' + Comment + '%' );
  }
  
  if( !_.isNaN( PayPeriod ) )
  {
    whereClause.push( 'TimeTable.PayPeriod=?' );
    params.push( PayPeriod );
  }
  
  if( req.query.Valid.length )
  {
    whereClause.push( 'TimeTable.Valid=?' );
    params.push( Valid );
  }
  
  if( whereClause.length )
  {
    Stmt += ' WHERE ' + whereClause.join( ' AND ' );
  }
  
  Stmt += ';';
  
  db.all( Stmt, params, function( err, rows )
  {
    var emptyRecord = [ {
      _id: '\'\'',
      UserName: 'Create',
      JobName: undefined,
      TimeIn: undefined,
      TimeOut: undefined,
      RecordComment: undefined,
      PayPeriod: undefined,
      Valid: undefined
    } ];
    rows = emptyRecord.concat( rows );
    
    var options = {
      layout: false,
      rows: rows
    };
    
    app.render( 'Admin/Hours/Query', options, function( err, html )
    {
      res.send( html );
    });
  });
};