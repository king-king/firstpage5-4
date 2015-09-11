/**
 * Created by bai on 2015/4/7.
 */

!function () {
	var arg = {};

	decodeURIComponent( location.search ).replace( "?", "" ).split( "&" ).forEach( function ( searchPair ) {
		var keyValue = searchPair.split( "=" );
		arg[keyValue[0]] = keyValue[1];
	} );

	var id = arg.id || "135291",
		server = arg.server || "chuye.cloud7.com.cn",
		script, scriptCode;

	window.contentPath = arg.contentPath || "content/";
	window.virtualPath = "http://" + server + "/";
	window.workDetailUrl = arg.url || ( virtualPath + "Work/Detail/" + id );
	window.firstpageVersion = 1;

	window.onerror = function ( e ) {
		console.log( e );
	};

	try {
		if ( window.firstpageVersion ) {
			window.localResource = JSON.parse( localStorage.getItem( "resource" ) || JSON.stringify( {
					list : []
				} ) );
		}
	}
	catch ( e ) {
	}

	if ( !arg.debug && window.localResource && localResource.version === window.firstpageVersion && ( scriptCode = localStorage.getItem( "script" ) ) ) {
		( new Function( "return " + scriptCode ) )()();
		window.runFirstPage();
	}
	else {
		script = document.head.appendChild( document.createElement( "script" ) );
		script.onload = function () {
			window.runFirstPage();
			script.onload = null;
		};
		script.src = "content/" + ( arg.debug ? "firstpage.js" : "firstpage.min.js" );
	}
}();