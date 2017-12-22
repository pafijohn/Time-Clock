module.exports.Login = function( req, res ) {
	var isValidRequest = (
		_.has( req.body, 'UserName' ) &&
		_.has( req.body, 'UserPassword' ) &&
		
		validator.isLength( req.body.UserName, 1, 255 ) &&
		validator.isLength( req.body.UserPassword, 1, 255 )
		// dont need to validate user or password here?
	);
	
	if( !isValidRequest ) {
		res.redirect( '/' );
		return;
	}
	
	var UserName = req.body.UserName;
	
	db.get( 'SELECT _id, Password, Salt FROM Users WHERE Name=? AND Valid=1;', UserName, function( err, row ) {
		if( err ) throw err;
		
		if( !_.isUndefined( row ) ) {
			var UserPassword = crypto.createHash( 'sha256' ).update( req.body.UserPassword + row.Salt ).digest( 'base64' );
			var loggedIn = UserPassword == row.Password;
			
			if ( loggedIn ) {
				req.session.regenerate(function(err) {
					req.session.UserId = row._id;
					req.session.IsLoggedIn = loggedIn;
					req.session.Permissions = [];
					
					db.each('SELECT Permission FROM Permissions WHERE UserId=?;', row._id, function( err, row ) {
						req.session.Permissions.push(row.Permission);
					}, function( err, numRows ) {
						// numRows should always be 1
						req.session.IsAdmin = _.contains( req.session.Permissions, 'ASSIGN_PERMISSIONS' );
						var redirect = '/Jobs';
						
						if( req.session.IsAdmin ) {
							redirect = '/Admin/Jobs';
						}
						
						res.redirect( redirect );
					});
				});
			} else {
				// Wrong password
				res.redirect( '/' );
			}
			
		} else {
			// Wrong username
			res.redirect( '/' );
		}
	});
}