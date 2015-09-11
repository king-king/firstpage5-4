/**
 * Created by 白 on 2015/9/1.
 * mv模式
 */

library( function () {
	var array = imports( "array" ),
		string = imports( "string" ),
		object = imports( "object" ),
		$ = imports( "element" ),
		animation = imports( "animation" ),
		random = imports( "random" ).Random( 0 ),
		css = imports( "css" ),
		math = imports( "math" ),
		func = imports( "function" ),
		async = imports( "async" ),
		URL = imports( "url" ),

		Music = imports( "./music" ),
		tips = imports( "./tips" ),
		sa = imports( "./switch-animation" ),
		util = imports( "./util" ),
		env = imports( "./env" ),
		ua = imports( "./ua" ),
		ui = imports( "./ui" ),

		Layout = imports( "./layout" ),
		Content = imports( "./content" ),
		Lyric = imports( "./lyric" ),
		myWork = imports( "./my-work" ),
		hrefArg = URL( location.href ).arg,
		scale = parseFloat( hrefArg.scale || 1.15 ),
		duration = parseFloat( hrefArg.duration || 7 );

	module.exports = function ( workBody, arg, Work ) {
		var curPage, // 当前页
			curPageIndex = arg.pageIndex || 0, // 当前页码
			playSchedule = async.Schedule(), // 播放日程
			preloadPageSchedule = async.Schedule(); // 预加载日程

		var blendImages = array.map( array.range( 2 ), function ( i ) {
			var image = new Image();
			image.onload = function () {
				image.loaded = true;
			};
			image.src = "/experiment/blend/" + i + ".jpg";
			return image;
		} );

		return {
			doData : function () {
				workBody.workData.pages = array.remove( workBody.workData.pages, function ( pageData ) {
					return pageData.label === "author";
				} );
			},
			play : playSchedule.start,
			preloadPage : preloadPageSchedule.start,
			resize : function ( width, height ) {
				if ( curPage ) {
					curPage.resize( width, height );
					curPage.play();
				}
			},
			recycle : function () {
				curPage && curPage.recycle();
			},
			load : function ( pageLoadDone ) {
				var workData = workBody.workData, // 作品数据

					pagesData = workData.pages, // 页信息
					pageNum = workBody.pageNumber = pagesData.length, // 页数量
					audio = Music( workBody, $( tips.Album(), workBody ) ), // 音乐

					loadingNewPageTips, // 加载新页提示
					cutHandle = null, // 切换句柄
					cutAnimateHandle = null; // 切换动画句柄

				workBody.workTitle = workData.title; // 标题

				function loadPage( index, onLoad ) {
					workBody.loadPage( index, function ( page ) {
						if ( page ) {
							var layout = page.wrapper,
								back = layout.back,
								backgroundImage = layout.backgroundImage,
								boxWidth = layout.w,
								blendImage = random.select( blendImages );

							function translate( left, top ) {
								var t = scale * 50 - 50;
								return {
									"0" : {
										scale : scale,
										x : t * left + "%",
										y : t * top + "%"
									},
									"100" : {
										scale : scale,
										x : -t * left + "%",
										y : -t * top + "%"
									}
								};
							}

							if ( back ) {
								back.enter = {
									duration : duration + 1,
									progress : random.select( [
										translate( 1, 0 ), translate( -1, 0 ), translate( 0, 1 ), translate( 0, -1 ),
										{
											"0" : {
												scale : scale
											}
										},
										{
											"100" : {
												scale : scale
											}
										}
									] ),
									timing : animation.Timing.linear
								};

								if ( layout.bottomImage ) {
									var filterComp = random.select( [layout.bottomImage, backgroundImage] );
									css( filterComp.element, "filter", random.select( ["blur(10px)", "grayscale(1)", "contrast(200%)", "hue-rotate(90deg)"] ) );
									layout.bottomImage.enter = {
										duration : duration,
										progress : {
											0 : {
												opacity : 0
											}
										},
										timing : animation.Timing.linear
									};
									backgroundImage.enter = {
										duration : duration,
										progress : {
											100 : {
												opacity : 0
											}
										},
										timing : animation.Timing.linear
									};
								}
								else {
									if ( blendImage.loaded ) {
										var blendComp = Layout.Component( Content.Image( blendImage, {
												w : layout.h * blendImage.naturalWidth / blendImage.naturalHeight,
												h : layout.h
											} ), layout ),
											imgWidth = blendComp.w,
											blendMode = random.select( ["screen", "lighten", "soft-light"] );

										css( blendComp.element, "mix-blend-mode", blendMode );
										blendComp.opacity = blendMode === "lighten" ? 0.2 : blendMode === "color-dodge" ? 0.4 : 1;
										blendComp.enter = {
											duration : duration,
											progress : function ( i, duration ) {
												var interval = 100 / ( i + 0.7 ),
													pieceDuration = 100 / i / duration,
													progress = {},
													start = 0,
													curPos = 0;

												function push( key, value ) {
													progress[key.toFixed( 2 )] = value;
												}

												func.loop( i, function () {
													var thisPieceDuration = pieceDuration * random.range( 0.7, 1.2 ) * 2;
													start += interval * random.range( 0.9, 1.1 );

													push( start, {
														opacity : 0,
														x : curPos
													} );
													push( start + thisPieceDuration, {
														opacity : 0.6 * random.range( 0.8, 1.2 ),
														x : ( boxWidth - imgWidth ) / 2
													} );
													push( start + thisPieceDuration * 2, {
														opacity : 0,
														x : curPos = ( boxWidth - imgWidth ) - curPos
													} );
												} );

												progress[0] = progress[100] = {
													opacity : 0
												};

												return progress;
											}( random.select( [1, 2, 3] ), duration ),
											timing : animation.Timing.linear
										};
									}
								}
							}

							// 设置切换动画
							page.switchAnimate = sa.fade;
							page.prepare(); // 页面准备
						}

						onLoad( page );
					} );
				}

				// 获取页码
				function getPageIndex( index ) {
					return ( index + pageNum ) % pageNum;
				}

				// 预加载页面
				function preloadPage() {
					var curIndex = curPage.index;

					function load( i, j ) {
						i !== 0 && async.concurrency( array.map( [-j, j], function ( step ) {
							return function ( done ) {
								workBody.loadPage( curIndex + step, done, false );
							}
						} ), function () {
							load( i - 1, j + 1 );
						} );
					}

					load( 2, 1 );
				}

				// 加载第一页
				loadPage( curPageIndex, function ( page ) {
					curPage = workBody.appendChild( page );

					// 准备播放日程和预加载页面日程
					playSchedule.prepare( function () {
						curPage.play();
					} );
					preloadPageSchedule.prepare( preloadPage );

					// 播放音乐
					ua.ios && window.WeixinJSBridge ? WeixinJSBridge.invoke( 'getNetworkType', {}, workBody.playAudio ) : workBody.playAudio();

					// 切换页面
					function cut( step, callback ) {
						// 清理cutHandle和加载新页提示
						cutHandle = null;
						$.remove( loadingNewPageTips );

						// 切换
						func.recursion( function cut() {
							loadingNewPageTips = workBody.appendChild( tips.LoadingNewPage() );
							cutHandle = cut;

							loadPage( getPageIndex( curPageIndex + step ), function ( newPage ) {
								$.remove( loadingNewPageTips );

								if ( cutHandle === cut ) {
									var oldPage = curPage;
									curPage = newPage;

									preloadPage();

									// 切换动画
									var lock = ui.Lock();
									workBody.appendChild( curPage );
									curPage.play();
									util.cutPage( function () {
										cutAnimateHandle = ( step > 0 ? curPage.switchAnimate : sa.back )( workBody, oldPage, curPage, function () {
											cutAnimateHandle = null;
											$.remove( oldPage );
											lock.remove();
										} );
										curPageIndex += step;
									} );
								}
							} );

							callback && callback();
						} );
					}

					func.recursion( function autoPlay() {
						setTimeout( function () {
							cut( 1, autoPlay );
						}, duration * 1000 );
					} );

					Lyric( workBody, audio, "/experiment/" + workBody.workId + ".txt", hrefArg.lyric || "bottom" );

					myWork( workBody, Work );

					// 第一页加载完成
					pageLoadDone();
				} );
			}
		};
	};
} );
