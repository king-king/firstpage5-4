/**
 * Created by 白 on 2014/11/10.
 */

firstpageStyle = null;
library( function () {
	var object = imports( "object" ),
		$ = imports( "element" ),
		pointer = imports( "pointer" ),
		array = imports( "array" ),
		ua = imports( "ua" ),
		css = imports( "css" ),
		async = imports( "async" ),
		URL = imports( "url" ),

		srcPath = "/src/",
		arg = URL( location.href ).arg,
		id = window.workId = parseInt( arg.id || "135291" );

	css( document.body, "font-family", '"Microsoft YaHei", sans-serif' );
	ua.win32 && css.insertRules( "::-webkit-scrollbar", {
		width : 0
	}, true );

	imports( "./console" );

	window.iconPath = "/icon/";
	window.contentPath = "/content/";
	window.virtualPath = "http://" + ( arg.server || "chuye.cloud7.com.cn" ) + "/";
	window.noMusic = arg.music == "false";
	window.workDetailUrl = arg.url || ( virtualPath + "Work/Detail/" + id );
	window.mode = URL( location.href ).arg.mode;

	window.hotLink = function ( address ) {
		return URL.concatArg( location.href, {
			id : array.top( address.split( "/" ) )
		} );
	};

	window.Icon = function ( src ) {
		var info = localIconTable[src = src + ".png"],
			img = $( "img", {
				src : window.iconPath + src
			} );

		css.size( img, img.w = img.halfWidth = Math.round( ( img.fullWidth = info.width ) / 2 ),
			img.h = img.halfHeight = Math.round( ( img.fullHeight = info.height ) / 2 ) );

		return img;
	};

	function loadEnvironment( callback ) {
		// 加载全局变量
		async.concurrency( array.map( [{
			get : "plugin",
			jsonp : "pluginList"
		}, {
			get : "icon",
			jsonp : "localIconTable"
		}], function ( arg ) {
			return function ( done ) {
				var script = $( "script", {
					src : URL.concatArg( "/server.js", arg ),
					onload : done
				}, document.head );
			};
		} ), function () {
			var ua = navigator.userAgent;

			array.foreach( array.map( pluginList.css || [], function ( src ) {
				return srcPath + src;
			} ), function ( path ) {
				$( "link", {
					href : path,
					rel : "stylesheet"
				}, document.head );
			} );

			loadPlugins( array.map( pluginList.js || [], function ( src ) {
				return srcPath + src;
			} ), callback );

			setInterval( function () {
				if ( ua !== navigator.userAgent ) {
					window.parent.location.reload();
				}
			}, 100 );
		} );
	}

	function work( callback ) {
		if ( ua.ios || ua.android || window.parent != window ) {
			callback && callback();
		}
		else {
			css( document.body, {
				margin : 0,
				padding : 0
			} );

			$( "iframe", {
				src : location.href,
				css : {
					position : "absolute",
					display : "block",
					border : "7px solid #555555",
					right : "50%",
					width : "320px",
					height : "568px",
					top : "50%",
					transform : "translateY(-50%)"
				}
			}, document.body );
		}
	}

	exports.work = work;
	exports.runFirstPage = imports( "../src/main" );
	exports.loadEnvironment = loadEnvironment;
} );