/**
 * Created by 白 on 2015/7/16.
 */

library( function () {
	var css = imports( "css" ),
		$ = imports( "element" ),
		ua = imports( "ua" ),
		pointer = imports( "pointer" );

	if ( !ua.win32 && ( ua.ios || ua.android ) ) {
		var pre = $( "div", {
			css : {
				position : "fixed",
				left : 0,
				top : 0,
				right : 0,
				"max-height" : "100%",
				"z-index" : "100000",
				background : "white",
				color : "#000000",
				"font-size" : "13px",
				"line-height" : "15px"
			}
		}, document.body );

		pointer.onPointerDown( pre, function () {
			pre.innerHTML = "";
		} );

		window.console = {
			log : function () {
				var text = "";
				for ( var i = 0; i !== arguments.length; ++i ) {
					i !== 0 && ( text += " " );
					text += arguments[i];
				}
				pre.innerHTML += text + "<br/>";
			},
			clear : function () {
				pre.innerHTML = "";
			}
		};

		window.onerror = function ( e ) {
			console.log( e.toString() );
		};
	}
} );