module.exports.ClientJobs = function( req, res )
{
	if( req.session.IsLoggedIn )
  {
    var UsersJobsStmt = db.prepare( 
      'SELECT JobsTable._id, JobsTable.JobName, JobsTable.JobDescription \
      FROM JobsTable \
      JOIN UserJobsTable \
      ON UserJobsTable.JobId=JobsTable._id \
      WHERE UserJobsTable.UserId=?;'
     );
    
    var ActiveJobStmt = db.prepare( 
      'SELECT JobsTable.JobName, TimeTable.TimeIn \
      FROM JobsTable \
      JOIN TimeTable \
      ON TimeTable.JobId=JobsTable._id \
      WHERE TimeTable.TimeOut is NULL \
      AND TimeTable.UserId=?;'
     );
    
    UsersJobsStmt.all( req.session.UserId, function( err, Jobs )
    {
      if( err ) throw err;
      
      ActiveJobStmt.get( req.session.UserId, function( err, ActiveJob )
      {
        if( err ) throw err;
        
        res.render( 'Client/jobs', {
            Jobs: Jobs,
            ActiveJob: ActiveJob
        });
      });
    });
	}
  else
  {
		res.redirect( '/' );
	}
}

module.exports.ClientHours = function( req, res )
{
	if( req.session.IsLoggedIn )
  {
		res.redirect( '/Hours/' + getPayPeriod() );
	}
  else
  {
		res.redirect( '/' );
	}
}

module.exports.ClientHoursPayPeriod = function( req, res )
{
	if( req.session.IsLoggedIn )
  {
    var HoursStmt = db.prepare(
      'SELECT JobsTable.JobName, TimeTable.TimeIn, TimeTable.TimeOut \
      FROM JobsTable \
      JOIN TimeTable \
      ON JobsTable._id=TimeTable.JobId \
      WHERE TimeTable.UserId=? \
      AND TimeTable.PayPeriod=? \
      AND TimeTable.TimeOut IS NOT NULL \
      ORDER BY TimeTable.TimeIn;'
    );
    
    HoursStmt.all( req.session.UserId, req.params.payPeriod, function( err, rows )
    {
      if( err ) throw err;
      
      var list = _.map( _.range( 1, 25 ), function( num, key )
      {
        return {
          val: num,
          selected: num == req.params.payPeriod
        };
      });
      
      res.render( 'Client/hours', {
          TimeRecords: rows,
          PayPeriods: list
      });
		});
	}
  else
  {
		res.redirect( '/' );
	}
}