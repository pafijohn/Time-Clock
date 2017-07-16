module.exports.Login = function( req, res )
{
	var isValidRequest = (
		_.has( req.body, 'UserName' ) &&
		_.has( req.body, 'UserPassword' ) &&
		
		validator.isLength( req.body.UserName, 1, 255 ) &&
		validator.isLength( req.body.UserPassword, 1, 255 )
		// dont need to validate user or password here?
	);
	
	if( !isValidRequest )
	{
		res.redirect( '/' );
		return;
	}
	
	var UserName = req.body.UserName;
	
	db.get( 'SELECT _id, UserPassword, IsAdmin, Salt FROM UsersTable WHERE UserName=? AND Valid=1;', UserName, function( err, row ) {
		if( err ) throw err;
		
		var redirect = '/';
		
		if( !_.isUndefined( row ) ) {
			var UserPassword = crypto.createHash( 'sha256' ).update( req.body.UserPassword + row.Salt ).digest( 'base64' );
			
			if ( UserPassword == row.UserPassword ) {
				req.session.IsAdmin = ( row.IsAdmin == 1 );
				req.session.UserId = row._id;
				redirect = '/Jobs';
				req.session.IsLoggedIn = true;
				
				if( req.session.IsAdmin )
				{
					redirect = '/Admin/Jobs';
				}
			}
			// Log in failed, log it maybe?
			else
			{
			}
		}
	
		res.redirect( redirect );
	});
}