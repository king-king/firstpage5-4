/**
 * Created by 白 on 2015/8/31.
 */

main( function () {
	var debug = imports( "../debug" ),
		Work = imports( "../src/work" ),
		CanvasSystem = imports( "./canvas-system" ),
		loadWork = imports( "../src/load-work" ),
		draw = imports( "canvas" ),
		URL = imports( "url" ),
		hrefArg = URL( location.href ).arg;

	debug.loadEnvironment( function () {
		if ( !hrefArg.id ) {
			document.body.innerHTML = "没有id";
			return;
		}

		var work = Work( {
			loadWork : function ( callback ) {
				return loadWork( "http://chuye.cloud7.com.cn/Work/Detail/" + hrefArg.id, callback );
			},
			music : false,
			width : 320,
			height : 568
		} );

		work.onPageLoad( function () {
			if ( work.loadError ) {
				document.body.innerHTML = "解析错误";
				return;
			}

			var cc = CanvasSystem( main );

			function main( gc, point ) {
				var clientWidth = Math.max( document.documentElement.clientWidth, 600 ),
					clientHeight = Math.max( document.documentElement.clientHeight, 600 );

			}

			console.log( work.workData );
		} );
	} );
} );