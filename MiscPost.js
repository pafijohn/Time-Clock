module.exports.Login = function( req, res )
{
  var isValidRequest = (
    _.has( req.body, 'UserName' ) &&
    _.has( req.body, 'UserPassword' ) &&
    
    validator.isLength( req.body.UserName, 1, 255 ) &&
    validator.isLength( req.body.UserPassword, 1, 255 ) &&
    
    validator.isSafeString( req.body.UserName )
    // dont need to validate password?
  );
  
  if( !isValidRequest )
  {
    res.redirect( '/' );
    return;
  }
  
  var UserName = req.body.UserName;
  var UserPassword = crypto.createHash( 'sha256' ).update( req.body.UserPassword ).digest( 'base64' );
  
  db.get( 'SELECT _id, IsAdmin FROM UsersTable WHERE UserName=? AND UserPassword=? AND Valid=1;', UserName, UserPassword, function( err, row )
  {
    if( err ) throw err;
    
    var redirect = '/';
    
    if( !_.isUndefined( row ) )
    {
      req.session.IsAdmin = ( row.IsAdmin == 1 );
      req.session.UserId = row._id;
      redirect = '/Jobs';
      req.session.IsLoggedIn = true;
      if( req.session.IsAdmin )
      {
        redirect = '/Admin/Jobs';
      }
    }
    res.redirect( redirect );
  });
}