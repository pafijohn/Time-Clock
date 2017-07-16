module.exports.Login = function( req, res ) {
	var isValidRequest = ( 
		req.session.IsLoggedIn &&
		
		_.has( req.body, '_id' ) &&
		
		validator.isLength( req.body._id, 1, 255 ) &&
		
		validator.isInt( req.body._id )
	);
	
	if( isValidRequest )
	{
		var UserId = req.session.UserId;
		var JobId = validator.toInt( req.body._id );
		
		db.get( 'SELECT _id FROM UserJobsTable WHERE UserId=? AND JobId=?;', UserId, JobId, function( err,row ) {
			if( err ) throw err;
			
			if( !_.isUndefined( row ) )
			{
				var TimeOut = getRoundedTime();
				db.run( 'UPDATE TimeTable SET TimeOut=? WHERE UserId=? AND TimeOut IS NULL;', TimeOut, UserId, function( err,row ) {
					if( err ) throw err;
					var TimeIn = TimeOut;
					var PayPeriod = getPayPeriod();
					db.run( 'INSERT INTO TimeTable VALUES( NULL,?,?,?,NULL,NULL,?,1 );', UserId, JobId, TimeOut, PayPeriod );
					res.redirect( '/Jobs' );
				});
			}
			else
			{
				res.redirect( '/' );
			}
		});
	}
	else
	{
		res.redirect( '/' );
	}
}

module.exports.Logout = function( req, res ) {
	var redirect = '/';
	if( req.session.IsLoggedIn )
	{
		var TimeOut = getRoundedTime();
		var UserId = req.session.UserId;
		
		db.run( 'UPDATE TimeTable SET TimeOut=? WHERE UserId=? AND TimeOut IS NULL;', TimeOut, UserId, function( err, row ) {
			res.redirect( '/Jobs' );
		});
	}
	else
	{
		res.redirect( '/' );
	}
}