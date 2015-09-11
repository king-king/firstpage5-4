/**
 * Created by 白 on 2015/9/1.
 * 卷轴模式
 */

library( function () {
	var object = imports( "object" ),
		URL = imports( "url" ),
		async = imports( "async" ),
		array = imports( "array" ),
		css = imports( "css" ),
		csa = imports( "css-animation" ),
		Music = imports( "./music" ),
		tips = imports( "./tips" ),
		PageAnimation = imports( "./page-animation" ),
		ea = imports( "./enter-animation" ),
		Lyric = imports( "./lyric" ),
		$ = imports( "element" ),
		hrefArg = URL( location.href ).arg,
		myWork = imports( "./my-work" ),
		ua = imports( "./ua" );

	module.exports = function ( workBody, arg, Work ) {
		var curPage,
			lyricMode = hrefArg.lyric;

		return {
			load : function ( workLoadDone ) {
				function duration( length ) {
					return length / 40;
				}

				// 预加载页面
				function preloadPage() {
					if ( curPage ) {
						var curIndex = curPage.index;

						function load( i, j ) {
							i !== 0 && async.concurrency( array.map( [-j, j], function ( step ) {
								return function ( done ) {
									workBody.loadPage( curIndex + step, done );
								}
							} ), function () {
								load( i - 1, j + 1 );
							} );
						}

						load( 3, 1 );
					}
				}

				// 加载页并调整其图片位置
				function loadPage( index, callback ) {
					workBody.loadPage( index, function ( page ) {
						if ( !page ) {
							callback( null );
							return;
						}

						var width = 0,
							compTable = PageAnimation.analyzePage( page );

						if ( hrefArg["no-text"] ) {
							compTable.text = [];
						}

						page.innerHTML = "";

						array.foreach( compTable.text.concat( compTable.image.concat( compTable.background || [] ) ), function ( comp ) {
							var overSize = comp.h - ( workBody.h - 106 );
							comp.x = width;
							comp.scale = 1;

							if ( overSize > 0 ) {
								comp.scale = 1 - overSize / comp.h;
							}
							else if ( lyricMode === "top" && comp.y < 56 ) {
								comp.y = 56;
							}

							page.appendChild( comp.element );
							comp.enter = object.extend( ea.fadeIn, {
								duration : 1.5,
								delay : duration( width ) + duration( Math.min( comp.w, workBody.w / 3 ) + 40 )
							} );
							width += comp.w + 20;
						} );

						css.size( page, page.w = width + 20, page.h = workBody.h );
						css( page, "background", "white" );

						callback( page );
					} );
				}

				function scrollPage( index, callback ) {
					function scroll( index ) {
						loadPage( index, function ( scrollPage ) {
							if ( !scrollPage ) {
								callback && callback();
								return;
							}

							var scrollCurPage = csa.runAnimation( [
								[scrollPage, {
									0 : {
										transform : css.translate( workBody.w, 0, 0 )
									},
									100 : {
										transform : css.translate( -scrollPage.w, 0, 0 )
									}
								}, css.s( duration( scrollPage.w + workBody.w ) ), "linear"]
							], function () {
								$.remove( scrollPage );
							}, {
								play : false
							} );

							setTimeout( function () {
								scroll( index + 1 );
							}, duration( scrollPage.w ) * 1000 );

							preloadPage();
							workBody.appendChild( curPage = scrollPage );
							scrollPage.prepare();
							scrollPage.play();
							scrollCurPage.play();
						} );
					}

					scroll( index );
				}

				async.concurrency( [
					function ( callback ) {
						workBody.loadPage( 0, callback );
					},
					function ( callback ) {
						workBody.loadPage( 1, callback );
					}
				], function () {
					var audio = Music( workBody, $( tips.Album(), workBody ) );
					scrollPage( 0 );

					css( workBody, "background", "white" );
					Lyric( workBody, audio, "/ignore/" + workBody.workId + ".txt", lyricMode );
					ua.ios && window.WeixinJSBridge ? WeixinJSBridge.invoke( 'getNetworkType', {}, workBody.playAudio ) : workBody.playAudio();

					location.hash === "#edit" && myWork( workBody, Work ); // 编辑作品
					workLoadDone();
				} );
			},
			recycle : function () {
			},
			play : function () {
			},
			preloadPage : function () {
			},
			resize : function () {
			}
		};
	};
} );