/**
 * Created by 白 on 2015/8/27.
 */

library( function () {
	var URL = imports( "url" ),
		hrefArg = URL( location.href ).arg,
		Work = imports( "../src/work" ),
		loadWork = imports( "../src/load-work" ),
		array = imports( "array" ),
		func = imports( "function" ),
		css = imports( "css" ),
		$ = imports( "element" ),
		id = hrefArg.id;

	module.exports = function () {
		if ( !id ) {
			document.body.innerHTML += "没有id";
			return;
		}

		var work = Work( {
			loadWork : function ( callback ) {
				return loadWork( "http://chuye.cloud7.com.cn/Work/Detail/" + id, callback );
			},
			music : false,
			width : 320,
			height : 568
		} );

		work.onLoad( function () {
			if ( work.loadError ) {
				document.body.innerHTML += "解析错误";
				return;
			}

			var pageWrappers = [],
				curOver = null;

			document.title = work.workTitle;

			func.loop( work.pageNumber, function () {
				pageWrappers.push( $( "div", {
					css : {
						height : "568px",
						"float" : "left",
						"margin-bottom" : "10px",
						"text-align" : "center"
					}
				}, document.body ) );
			} );

			function resize() {
				var clientWidth = document.documentElement.clientWidth,
					lineNumber = Math.floor( clientWidth / ( 320 + 40 ) );
				array.foreach( pageWrappers, function ( wrapper ) {
					css( wrapper, {
						width : ( 100 / lineNumber.toFixed( 3 ) ) + "%"
					} );
				} );
			}

			$.bind( window, "resize", resize );

			work.onPageLoad( function () {
				css( document.body, {
					overflow : "auto",
					"padding-top" : "10px"
				} );
				resize();

				array.foreach( pageWrappers, function ( wrapper, index ) {
					work.loadPage( index, function ( page ) {
						$( page, {
							classList : "lock-children",
							css : {
								position : "relative",
								display : "inline-block",
								border : "1px solid #333333"
							}
						}, wrapper );
						page.prepare();
						page.play();

						var enterEndHandle = page.wrapper.onEnterEnd( function () {
							enterEndHandle.remove();
							$.bind( page, "mouseover", function () {
								page.overHandle = setTimeout( function () {
									page.fastForward();
									page.prepare();
									page.play();
									page.overHandle = null;
								}, 1000 );
							} );

							$.bind( page, "mouseout", function () {
								page.overHandle && clearTimeout( page.overHandle );
								page.fastForward();
								curOver = null;
							} );
						} );
					} );
				} );
			} );
		} );
	};
} );