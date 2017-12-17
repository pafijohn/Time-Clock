/****************************** Jobs ******************************/

module.exports.JobsEdit = function( req, res ) {
	var _id = validator.toInt( req.body._id );
	var JobName = validator.escape( req.body.JobName );
	var JobDescription = validator.escape( req.body.JobDescription );
	var Valid = validator.toBoolean( req.body.Valid );
	
	var Stmt;
	if( _.isNaN( _id ) ) {
		Stmt = db.prepare(
			'INSERT INTO Jobs VALUES(NULL,?,?,?);',
			JobName,
			JobDescription,
			Valid
		);
	} else {
		Stmt = db.prepare(
			'UPDATE Jobs \
			SET JobName=?, JobDescription=?, Valid=? \
			WHERE _id=?;',
			JobName,
			JobDescription,
			Valid,
			_id
		);
	}
	
	Stmt.run( function( err, row ) {
		if( err ) throw err;
		res.redirect( '/Admin/Jobs' );
	});
};

/****************************** Hours ******************************/

module.exports.HoursEdit = function( req, res ) {
	var _id           = validator.toInt( req.body._id );
	var UserId        = validator.toInt( req.body.UserId );
	var JobId         = validator.toInt( req.body.JobId );
	var TimeIn        = _.toDate( req.body.TimeIn ).valueOf();
	var TimeOut       = _.toDate( req.body.TimeOut ).valueOf();
	var RecordComment = validator.escape( req.body.RecordComment );
	var PayPeriod     = validator.toInt( req.body.PayPeriod );
	var Valid         = validator.toBoolean( req.body.Valid );
	
	var Statement;
	
	if( _.isNaN( _id ) ) {
		Statement = db.prepare( 'INSERT INTO Times VALUES( NULL,?,?,?,?,?,?,? );',
			UserId,
			JobId,
			TimeIn,
			TimeOut,
			RecordComment,
			PayPeriod,
			Valid
		);
	} else {
		var Stmt = '\
			UPDATE Times \
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
	
	db.get( 'SELECT * FROM Assignments WHERE UserId=? AND JobId=?;', UserId, JobId, function( err, row ) {
		if( _.isUndefined( row ) ) {
			console.log( 'Error in AdminPost.HoursEdit, job is not assigned to user.'.red );
			res.redirect( '/' );
		} else {
			Statement.run( function( err, row ) {
				if( err ) throw err;
				res.redirect( '/Admin/Hours' );
			});
		}
	});
};

/****************************** Users ******************************/

module.exports.UsersEdit = function( req, res ) {
	var Statement;
	var UserName = validator.escape( req.body.UserName );
	var Valid = validator.toBoolean( req.body.Valid );
	var _id = validator.toInt( req.body._id );
	var salt = _.getSalt();
	var UserPassword = crypto.createHash( 'sha256' ).update( req.body.UserPassword + salt ).digest( 'base64' );
	
	if( _.isNaN( _id ) ) {
		Statement = db.prepare(
			'INSERT INTO Users VALUES( NULL,?,?,?,? );',
			UserName,
			UserPassword,
			Valid,
			salt
		);
	} else {
		if( req.body.UserPassword.length > 0 ) {
			Statement = db.prepare( 'UPDATE Users SET Name=?, Password=?, Valid=?, Salt=? WHERE _id=?;',
				UserName,
				UserPassword,
				Valid,
				salt,
				_id
			 );
		} else {
			Statement = db.prepare( 'UPDATE Users SET Name=?, Valid=? WHERE _id=?;',
				UserName,
				Valid,
				_id
			 );
		}
	}
	
	Statement.run( function( err, row ) {
		res.redirect( '/Admin/Users' );
	});
};

/****************************** Assignment ******************************/

module.exports.AssignEdit = function( req, res ) { 
	_.each( req.body.UserIds, function( UserElement ) {
		var UserId = validator.toInt( UserElement );
		_.each( req.body.JobIds, function( JobElement ) {
			var JobId = validator.toInt( JobElement );
			
			if( req.body.method == 'ADD' ) {
				db.get( 'SELECT * FROM Assignments WHERE UserId=? AND JobId=?;', UserId, JobId, function( err, row ) {
					if( _.isUndefined( row ) ) {
						db.run( 'INSERT INTO Assignments VALUES (NULL,?,?);', UserId, JobId );
					}
				});
			}
			else if( req.body.method == 'DELETE' ) {
				db.run( 'DELETE FROM Assignments WHERE UserId=? AND JobId=?;', UserId, JobId );
			}
		});
	});
	
	res.redirect( '/Admin/Assign' );
};