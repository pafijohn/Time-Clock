/****************************** Jobs ******************************/

module.exports.Jobs = function( req, res ) {
	if( req.session.IsLoggedIn && req.session.IsAdmin ) {
		db.all( 'SELECT * FROM Jobs WHERE Valid=1;', function( err, rows ) {
			res.render( 'Admin/Jobs/Main', {
				layout: 'admin',
				rows: rows
			});
		});
	} else {
		res.redirect( 'Misc/Get' );
	}
};

module.exports.JobsEdit = function( req, res ) {
	var RowId = validator.toInt( req.params[ 0 ] );
	db.get( 'SELECT * FROM Jobs WHERE _id=?;', RowId, function( err, row ) {
		res.render( 'Admin/Jobs/Edit', {
			layout: 'admin',
			row: row
		});
	});
};

/****************************** Hours ******************************/

module.exports.Hours = function( req, res ) {
	db.all( 'SELECT _id, Name  FROM Users WHERE Valid=1;', function( err, users ) {
		db.all( 'SELECT _id, JobName FROM Jobs WHERE Valid=1;', function( err, jobs ) {
			var currentPayPeriod = getPayPeriod();
			var period = _.map( _.range( 1, 25 ), function( i ) {
				return {
					val: i,
					selected: i == currentPayPeriod
				};
			});
			
			res.render( 'Admin/Hours/Main', {
				layout: 'admin',
				users: users,
				jobs: jobs,
				period: period
			});
		});
	});
};

module.exports.HoursEdit = function( req, res ) {
	var IsEdit = ( validator.isInt( req.params[ 0 ] ) );
	
	var _id = IsEdit ? validator.toInt( req.params[ 0 ] ) : null;
	
	db.all( 'SELECT _id, Name FROM Users WHERE Valid=1;', function( err, users ) {
		db.get( 'SELECT * FROM Times WHERE _id=?;', _id, function( err, row ) {
			var Stmt = '\
				SELECT _id, JobName FROM Jobs WHERE _id IN \
					( SELECT JobId FROM Assignments WHERE UserId=( \
						SELECT UserId FROM Times WHERE _id=? ) );';
			
			db.all( Stmt, _id, function( err, jobs ) {
				var payPeriod = getPayPeriod();
				var isValid = true;
				
				
				if( !_.isUndefined( row ) ) {
					var UserElement = _.findWhere( users, { _id: row.UserId } )
					var JobElement = _.findWhere( jobs, { _id: row.JobId } )
					
					var UserIdx = _.indexOf( users, UserElement );
					var JobIdx = _.indexOf( jobs, JobElement );
					
					users[ UserIdx ].selected = true;
					jobs[ JobIdx ].selected = true;
					
					payPeriod = row.PayPeriod;
					isValid = row.Valid;
				}
				
				var period = _.map( _.range( 1, 25 ), function( i ) {
					return {
						val: i,
						selected : i == payPeriod
					};
				});
				
				var valid = _.map( [ 1, 0 ], function( i ) {
					return {
						val: i,
						selected: i == isValid,
						display: ( i ) ? 'Yes' : 'No',
					};
				});
				
				res.render( 'Admin/Hours/Edit', {
					layout: 'admin',
					row: row,
					users: users,
					jobs: jobs,
					period: period,
					valid: valid
				});
			});
			
		});
	});
};

/****************************** Users ******************************/

module.exports.Users = function( req, res ) {
	if( req.session.IsLoggedIn && req.session.IsAdmin ) {
		db.all( 'SELECT * FROM Users WHERE Valid=1;', function( err, rows )
		{
			res.render( 'Admin/Users/Main', {
				layout: 'admin',
				rows: rows
			});
		});
	} else {
		res.redirect( '/' );
	}
};

module.exports.UsersEdit = function( req, res )
{
	var _id = validator.toInt( req.params[ 0 ] );
	db.get( 'SELECT * FROM Users WHERE _id=?;', _id, function( err, row ) {
		res.render( 'Admin/Users/Edit', {
			layout: 'admin',
			row: row
		});
	});
};

/****************************** Assign ******************************/

module.exports.Assign = function( req, res )
{
	if( req.session.IsLoggedIn && req.session.IsAdmin ) {
		var Statement = db.prepare( 
			'SELECT Users.Name, Jobs.JobName, Assignments._id \
			FROM Assignments \
			JOIN Users \
			ON Users._id = Assignments.UserId \
			JOIN Jobs \
			ON Jobs._id = Assignments.JobId \
			WHERE Users.Valid=1 AND Jobs.Valid=1;'
		);
	 
		Statement.all( function( err, rows ) {
			res.render( 'Admin/Assign/Main', {
				layout: 'admin',
				rows: rows
			});
		});
	} else {
		res.redirect( '/' );
	}
};

module.exports.AssignEdit = function( req, res ) {
	if( req.session.IsLoggedIn && req.session.IsAdmin ) {
		db.all( 'SELECT _id, Name FROM Users WHERE Valid=1;',function( err, users ) {
			db.all( 'SELECT _id, JobName FROM Jobs WHERE Valid=1;',function( err, jobs ) {
				res.render( 'Admin/Assign/Edit', {
					layout: 'admin',
					users: users,
					jobs: jobs
				});
			});
		});
	} else {
		res.redirect( '/' );
	}
};
