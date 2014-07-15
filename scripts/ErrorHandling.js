function setError(errId, err, callback) {
  var a = $('#' + errId);
  var b = $('#' + errId + '>small');
  var c = b.length > 0;
  var d = callback();
  var e = null;
  
  if(d) {
    a.addClass( 'error' );

    if(c) {
      b.html( b.html() + '<br>' + err );
    } else {
      b = $('<small class="error"></small>').html(err);
      a.append(b);
    }
  }
  return d;
}

function clearError(errId) {
  var a = $('#' + errId);
  var b = $('#' + errId + '>small');
  
  a.removeClass( 'error' );
  b.remove();
}