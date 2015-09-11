/**
 * Created by 白 on 2015/6/10.
 * 封装图片
 */

library( function () {
	var css = imports( "css" ),
		async = imports( "async" ),
		URL = imports( "url" ),
		imageUtil = imports( "image-util" ),
		$ = imports( "element" ),
		object = imports( "object" ),
		ajax = imports( "ajax" ),
		ua = imports( "./ua" ),

		localResource = imports( "./local-resource" ),

		imageNotFoundLoader = async.Loader( function ( done ) {
			var imageNotFound = Img.imageNotFound = Icon( "image-not-found" ),
				loadHandle = $.bind( imageNotFound, "load", function () {
					loadHandle.remove();
					done();
				} );
		} ),

		testImg = new Image(),
		lowPerformance = testImg.crossOrigin === undefined || ua.iphone && !ua.iphone6;

	function isColor( src ) {
		return /^#/.test( src ) || /^rgba/gi.test( src );
	}

	// 静态图片地址
	function staticSrc( src ) {
		return window.contentPath + "image/" + src;
	}

	// 设置图片尺寸
	function setSize( img, ps ) {
		ps = ps || {};
		var width = img.fullWidth = ps.w || img.naturalWidth || img.width,
			height = img.fullHeight = ps.h || img.naturalHeight || img.height;
		img.w = img.halfWidth = Math.round( width / 2 );
		img.h = img.halfHeight = Math.round( height / 2 );
		img.whr = width / height;
	}

	// 加载图片
	function load( img, src, arg ) {
		arg = arg || {};
		var tryCache = false,
			crossOrigin = !!arg.crossOrigin,
			extName,
			dataUrl = /^data:/.test( src );

		function fail( isFatal ) {
			img.fail = isFatal ? "fatal" : true;
			imageNotFoundLoader.load( function () {
				arg.onError && arg.onError();
			} );
		}

		if ( !src ) {
			fail( true );
			return img;
		}

		if ( isColor( src ) ) {
			img.color = src;
			setTimeout( function () {
				arg.onLoad && arg.onLoad();
			}, 0 );
			return img;
		}

		function tryAgain() {
			if ( !tryCache ) {
				img.src = "";
				img.src = URL.concatArg( src, {
					t : ( new Date() ).getTime()
				} );
				tryCache = true;
			}
			else {
				fail();
			}
		}

		// 如果src是音乐,直接失败
		if ( !dataUrl && /\.([^.]*)$/.test( URL( src ).pathname.replace( /!([^!]*)$/, "" ) ) && !( ( extName = RegExp.$1 ) in {
				"jpeg" : true,
				"jpg" : true,
				"svg" : true,
				"png" : true,
				"gif" : true,
				"bmp" : true
			} ) ) {
			setTimeout( fail, 0 );
			return img;
		}

		crossOrigin && ( img.crossOrigin = "*" );

		img.onerror = tryAgain;
		img.onload = function () {
			if ( crossOrigin && !lowPerformance ) {
				try {
					var canvas = document.createElement( "canvas" ),
						gc = canvas.getContext( "2d" );
					canvas.width = 1;
					canvas.height = 1;
					gc.drawImage( img, 0, 0 );
					canvas.toDataURL();
				}
				catch ( e ) {
					tryAgain();
					return;
				}
			}
			setSize( img );
			img.onerror = null;
			img.onload = null;
			arg.onLoad && arg.onLoad( img );
		};

		if ( extName === "svg" ) {
			var xhr = ajax( {
				url : src
			}, function ( err ) {
				if ( err ) {
					fail();
				}
				else {
					img.src = img.imageData = "data:image/svg+xml;utf8," + xhr.responseText;
				}
			} );
		}
		else {
			img.src = src;
		}

		return img;
	}

	function Img( src, arg ) {
		return load( new Image(), src, arg );
	}

	var Icon = window.Icon || ( lowPerformance ? function ( src ) {
			var img = Img( staticSrc( "icon/" + src + ".png" ) );
			setSize( img, iconMap[src] );
			css.size( img, img.w, img.h );
			return img;
		} : (function () {
			var icons = {};

			function loadIcon( src, onLoad ) {
				var srcParts = src.split( "/" ),
					groupName = ["icon"].concat( srcParts.slice( 0, srcParts.length - 1 ) ).join( "-" ),
					img = icons[groupName] = icons[groupName] || new Image();

				if ( !img.waiter ) {
					img.waiter = async.Waiter( function ( done ) {
						var iconSrc = staticSrc( groupName + ".png" ),
							dataUrl = localResource( iconSrc );

						load( img, dataUrl || iconSrc, {
							crossOrigin : dataUrl == null,
							onLoad : function () {
								done();
								localResource( iconSrc, function () {
									return imageUtil.toDataURL( img );
								} );
							}
						} );
					} );
				}

				img.waiter.onComplete( function () {
					onLoad( img );
				} );
			}

			return function ( src ) {
				var ps = iconMap[src],
					canvas = document.createElement( "canvas" ),
					gc = canvas.getContext( "2d" ),
					unit = new Image();

				canvas.width = ps.w;
				canvas.height = ps.h;
				setSize( unit, ps );
				css.size( unit, unit.w, unit.h );
				css( unit, "visibility", "hidden" );

				loadIcon( src, function ( icon ) {
					gc.drawImage( icon, ps.x, ps.y, ps.w, ps.h, 0, 0, ps.w, ps.h );
					unit.onload = function () {
						unit.onload = null;
						css( unit, "visibility", "visible" );
					};
					unit.src = canvas.toDataURL( "image/png" );
				} );

				return unit;
			};
		})() );

	function clone( img ) {
		var newImage = new Image();
		newImage.src = img.src;
		setSize( newImage, img );
		return newImage;
	}

	// 画布
	function Canvas( width, height, dpr ) {
		var canvas = document.createElement( "canvas" ),
			gc = canvas.context = canvas.getContext( "2d" );

		dpr = canvas.dpr = dpr || ( window.devicePixelRatio || 1 ) / ( gc.webkitBackingStorePixelRatio || gc.mozBackingStorePixelRatio ||
			gc.msBackingStorePixelRatio || gc.oBackingStorePixelRatio || gc.backingStorePixelRatio || 1 );

		canvas.width = width * dpr;
		canvas.height = height * dpr;

		css( canvas, {
			display : "block",
			width : css.px( canvas.logicalWidth = width ),
			height : css.px( canvas.logicalHeight = height )
		} );

		gc.scale( dpr, dpr );

		return canvas;
	}

	function pageError( page, src ) {
		page.innerHTML = "";
		css( page, "background", "white" );
		Img( staticSrc( src ), {
			onLoad : function ( img ) {
				$( img, {
					css : object.insert( css.center( img.halfWidth ), css.middle( img.halfHeight ) )
				}, page );
			}
		} );
	}

	Img.isColor = isColor;
	Img.load = load;
	Img.clone = clone;
	Img.Canvas = Canvas;
	Img.Icon = Icon;
	Img.staticSrc = staticSrc;
	Img.pageError = pageError;
	module.exports = Img;
} );
