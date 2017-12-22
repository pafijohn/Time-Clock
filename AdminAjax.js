module.exports.UserJobs = function( req, res ) {
	var isValidRequest = (
		_.has( req.params, 'UserId' ) &&
		validator.isLength( req.params.UserId, 1, MAX_STRING_LENGTH ) &&
		validator.isInt( req.params.UserId )
	);
	
	if( isValidRequest ) {
		var UserId = validator.toInt( req.params.UserId );
		var Stmt = '\
			SELECT Jobs._id, Jobs.JobName \
			FROM Jobs \
			JOIN Assignments \
			ON Assignments.JobId=Jobs._id \
			WHERE Assignments.UserId=?;\
		';
		
		db.all( Stmt, UserId, function( err, rows ) {
			var options = {
				layout: false,
				jobs: rows
			};
			
			app.render( 'Admin/Hours/UsersToJobs', options, function( err, html ) {
				if( err ) throw err;
				res.send( html );
			});
		});
	}
}

module.exports.HoursQuery = function( req, res ) {
	var UserId = validator.toInt( req.query.UserId );
	var JobId = validator.toInt( req.query.JobId );
	var Comment = validator.escape( req.query.Comment );
	var PayPeriod = validator.toInt( req.query.PayPeriod );
	var Valid = validator.toBoolean( req.query.Valid );
	
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
		ON Times.JobId=Jobs._id\
	';
	
	var whereClause = [];
	var params = [];
	
	if( !_.isNaN( UserId ) ) {
		whereClause.push( 'Times.UserId=?' );
		params.push( UserId );
	}
	
	if( !_.isNaN( JobId ) ) {
		whereClause.push( 'Times.JobId=?' );
		params.push( JobId );
	}
	
	if( Comment.length ) {
		whereClause.push( 'Times.RecordComment LIKE ?' );
		params.push( '%' + Comment + '%' );
	}
	
	if( !_.isNaN( PayPeriod ) ) {
		whereClause.push( 'Times.PayPeriod=?' );
		params.push( PayPeriod );
	}
	
	if( req.query.Valid.length ) {
		whereClause.push( 'Times.Valid=?' );
		params.push( Valid );
	}
	
	if( whereClause.length ) {
		Stmt += ' WHERE ' + whereClause.join( ' AND ' );
	}
	
	Stmt += ';';
	
	db.all( Stmt, params, function( err, hours ) {
		var emptyRecord = [ {
			_id: '\'\'',
			Name: 'Create',
			JobName: undefined,
			TimeIn: undefined,
			TimeOut: undefined,
			RecordComment: undefined,
			PayPeriod: undefined,
			Valid: undefined
		}];
		
		if ( _.isUndefined( hours ) ) {
			records = hours;
		} else {
			records = emptyRecord.concat( hours );
		}
				
		app.render( 'Admin/Hours/Query', {
			layout: false,
			rows: records
		}, function( err, html ) {
			if ( err ) throw err;
			res.send( html );
		});
	});
};