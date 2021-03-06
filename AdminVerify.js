module.exports.IsAuthenticated = function( req, res, next ) {
	var isValidRequest = ( req.session.IsLoggedIn && req.session.IsAdmin );
	if( isValidRequest ) {
		next();
	} else {
		res.redirect( '/' );
	}
}

module.exports.JobsEdit = function( req, res, next ) {
	var isValidRequest = (
		_.has( req.body, '_id' ) &&
		_.has( req.body, 'Valid' ) &&
		_.has( req.body, 'JobName' ) &&
		_.has( req.body, 'JobDescription' ) &&
		
		validator.isLength( req.body._id, 0, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.Valid, 1, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.JobName, 1, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.JobDescription, 0, MAX_STRING_LENGTH ) &&
		
		(
			req.body._id == '' ||
			validator.isInt( req.body._id )
		) &&
		
		( req.body.Valid == '0' || req.body.Valid == '1')
	);
	
	if( isValidRequest ) {
		next();
	} else {
		res.redirect( '/' );
	}
}

module.exports.HoursEdit = function( req, res, next ) {
	var isValidRequest = (
		_.has( req.body, '_id' ) &&
		_.has( req.body, 'Valid' ) &&
		_.has( req.body, 'JobId' ) &&
		_.has( req.body, 'UserId' ) &&
		_.has( req.body, 'TimeIn' ) &&
		_.has( req.body, 'TimeOut' ) &&
		_.has( req.body, 'PayPeriod' ) &&
		_.has( req.body, 'RecordComment' ) &&
		
		validator.isLength( req.body._id, 0, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.JobId, 1, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.UserId, 1, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.TimeIn, 1, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.TimeOut, 1, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.PayPeriod, 1, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.RecordComment, 0, MAX_STRING_LENGTH ) &&
		
		(
			req.body._id == '' ||
			validator.isInt( req.body._id )
		) &&
		validator.isInt( req.body.JobId ) &&
		validator.isInt( req.body.UserId ) &&
		_.isDate( req.body.TimeIn ) &&
		_.isDate( req.body.TimeOut ) &&
		validator.isInt( req.body.PayPeriod ) &&
		( req.body.Valid == '0' || req.body.Valid == '1')
	);
	
	if( isValidRequest ) {
		var i = validator.toInt(req.body.PayPeriod);
		
		isValidRequest = (i >= 1 && i <= 24);
		
		if (isValidRequest) {
			next();
		}
	} else {
		res.redirect( '/' );
	}
}

module.exports.HoursQuery = function( req, res, next ) {
	var isValidRequest = (
		_.has( req.query, 'Valid' ) &&
		_.has( req.query, 'JobId' ) &&
		_.has( req.query, 'UserId' ) &&
		_.has( req.query, 'Comment' ) &&
		_.has( req.query, 'PayPeriod' )
	);
	
	if( isValidRequest ) {
		next();
	} else {
		res.redirect( '/' );
	}
}

module.exports.UsersEdit = function( req, res, next ) {
	var isValidRequest = (
		_.has( req.body, '_id' ) &&
		_.has( req.body, 'Valid' ) &&
		_.has( req.body, 'UserName' ) &&
		_.has( req.body, 'UserPassword' ) &&
		
		validator.isLength( req.body._id, 0, MAX_STRING_LENGTH ) &&
		( req.body.Valid == '0' || req.body.Valid == '1' ) &&
		validator.isLength( req.body.UserName, 1, MAX_STRING_LENGTH ) &&
		validator.isLength( req.body.UserPassword, 0, MAX_STRING_LENGTH ) &&
		
		(
			req.body._id == '' ||
			validator.isInt( req.body._id )
		) &&
		
		_.isSafeString( req.body.UserName )
	);
	
	// If the password is blank and this is a new record
	if ( req.body.UserPassword == '' && req.body._id == '' ) {
		isValidRequest = false;
	}
	
	if( isValidRequest ) {
		next();
	} else {
		res.redirect( '/' );
	}
}

module.exports.AssignEdit = function( req, res, next ) {
	var hasUserIds = _.has( req.body, 'UserIds' );
	var hasJobIds = _.has( req.body, 'JobIds' );
	
	if( hasUserIds && _.isString( req.body.UserIds ) ) {
		req.body.UserIds = [ req.body.UserIds ];
	}
	
	if( hasJobIds && _.isString( req.body.JobIds ) ) {
		req.body.JobIds = [ req.body.JobIds ];
	}
	
	var isValidRequest = (
		hasUserIds &&
		hasJobIds &&
		_.has( req.body, 'method' ) &&
		
		_.isArray( req.body.UserIds ) &&
		_.each( req.body.UserIds, function( UserId ) {
			validator.isLength( UserId, 0, MAX_STRING_LENGTH ) &&
			validator.isInt( UserId )
		}) &&
		
		_.isArray( req.body.JobIds ) &&
		_.each( req.body.JobIds, function( JobId ) {
			validator.isLength( JobId, 0, MAX_STRING_LENGTH );
		}) &&
		
		(
			req.body.method == 'ADD' ||
			req.body.method == 'DELETE'
		)
	);
	
	if( isValidRequest ) {
		next();
	} else {
		res.redirect( '/' );
	}
}