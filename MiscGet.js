module.exports.Styles = function( req, res ) {
	fs.readFile( __dirname + '/styles/' + req.params[0], 'utf8', function ( err, data ) {
		if( err ) throw err;
		var type = '';
		if( _( req.params[0] ).endsWith( '.css' ) ) {
			type = 'text/css';
		} else if( _( req.params[0] ).endsWith( '.js' ) ) {
			type = 'text/js';
		}
		res.setHeader( 'content-type', type );
		res.send( data );
	});
};

module.exports.Scripts = function( req, res ) {
	fs.readFile( __dirname + '/scripts/' + req.params[0], 'utf8', function ( err, data ) {
		if( err ) throw err;
		res.setHeader( 'content-type', 'text/js' );
		res.send( data );
	});
};

module.exports.Index = function( req, res ) {
	req.session.IsAdmin = false;
	req.session.IsLoggedIn = false;
	req.session.UserId = undefined;
	res.render( 'Misc/index', { layout : false } );
};

module.exports.Error = function( req, res ) {
	res.render( 'Misc/error', { layout : false, error: 'Something went wrong. Sorry.' } );
};
