module.exports.ClientJobs = function( req, res )
{
	if( req.session.IsLoggedIn )
	{
		var UsersJobsStmt = db.prepare( 
			'SELECT Jobs._id, Jobs.JobName, Jobs.JobDescription \
			FROM Jobs \
			JOIN Assignments \
			ON Assignments.JobId=Jobs._id \
			WHERE Assignments.UserId=?;'
		);

		var ActiveJobStmt = db.prepare( 
			'SELECT Jobs.JobName, Times.TimeIn \
			FROM Jobs \
			JOIN Times \
			ON Times.JobId=Jobs._id \
			WHERE Times.TimeOut is NULL \
			AND Times.UserId=?;'
		);

		UsersJobsStmt.all( req.session.UserId, function( err, Jobs ) {
			if( err ) throw err;

			ActiveJobStmt.get( req.session.UserId, function( err, ActiveJob ) {
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

module.exports.ClientHoursPayPeriod = function( req, res ) {
	if( req.session.IsLoggedIn )
	{
		var HoursStmt = db.prepare(
		  'SELECT Jobs.JobName, Times.TimeIn, Times.TimeOut \
		  FROM Jobs \
		  JOIN Times \
		  ON Jobs._id=Times.JobId \
		  WHERE Times.UserId=? \
		  AND Times.PayPeriod=? \
		  AND Times.TimeOut IS NOT NULL \
		  ORDER BY Times.TimeIn;'
		);
	
		HoursStmt.all( req.session.UserId, req.params.payPeriod, function( err, rows ) {
			if( err ) throw err;

			var list = _.map( _.range( 1, 25 ), function( num, key ) {
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