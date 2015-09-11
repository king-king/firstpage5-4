/**
 * Created by 白 on 2014/11/24.
 * 初页系统的启动
 */

library( function () {
	var async = imports( "async" ),
		$ = imports( "element" ),
		URL = imports( "url" ),
		array = imports( "array" ),
		css = imports( "css" ),
		csa = imports( "css-animation" ),
		pointer = imports( "pointer" ),
		object = imports( "object" ),

		Img = imports( "./img" ),
		util = imports( "./util" ),
		share = imports( "./share" ),
		tips = imports( "./tips" ),
		ui = imports( "./ui" ),
		loadWork = imports( "./load-work" ),
		ua = imports( "./ua" ),
		Work = imports( "./work" ),
		switchAnimation = imports( "./switch-animation" ),
		env = imports( "./env" ),
		localResource = imports( "./local-resource" ),

		href = URL( location.href ),
		hash = href.hash.replace( "#", "" ),
		arg = href.arg,
		loadingStart = new Date();

	imports( "./custom" );

	// 处理从客户端获取的列表
	function ClientList( list ) {
		return list === undefined || object.is.Array( list ) ? list : JSON.parse( list );
	}

	// 通过动画移除元素
	function removeByAnimation( el, last, duration ) {
		csa.runAnimation( [el, {
			100 : last
		}, duration], function () {
			$.remove( el );
		} );
	}

	function WorkBody( url, arg ) {
		return $( Work( object.extend( {
			loadWork : function ( callback ) {
				return loadWork( url, callback );
			},
			music : !/ChuyeNoMusic/gi.test( navigator.userAgent ) && !window.noMusic,
			width : document.documentElement.clientWidth,
			height : document.documentElement.clientHeight,
			disableClickMode : ua.inChuyeList,
			toolbar : ua.MicroMessenger
		}, arg || {} ) ), {
			css : {
				position : "absolute",
				left : 0,
				top : 0
			}
		} );
	}

	// 如果有firstpageStyle,样式来自于脚本内部变量
	firstpageStyle && $( "style", firstpageStyle, document.head );

	module.exports = function () {
		var lock,
			curBody = document.body.appendChild( WorkBody( workDetailUrl, object.extend( {
				pageIndex : parseInt( hash ) == hash ? parseInt( hash ) : undefined,
				preview : ua.chuyePreview
			}, JSON.parse( env.getSessionData( env.workLocation() ) || "{}" ) ) ) );

		// 本地缓存脚本
		if ( window.firstpageVersion ) {
			localResource( "script", function () {
				return firstpageScript.toString();
			} );
		}

		if ( ua.chuyeList ) {
			lock = ui.Lock();
			env.useClient( ["open", "enterFullScreen", "leaveFullScreen", "switchWorkStart", "switchWorkEnd", "switchFirst", "switchLast"], function () {
				var workList = firstpage.workList || JSON.parse( firstpage.getWorkList() ),
					originalWorkId = curBody.workId,
					listIndex = findIndexById( originalWorkId ),
					bodyCache = {},
					preloaded = false,

					workPlayCache = {},
					setTitleHandle = null, loadNextHandle = null,

					screenMask = $( "div", {
						css : css.full( {
							"z-index" : 100000
						} )
					}, document.body ),
					maskTapper = $( "div", {
						css : css.full( {
							left : 0,
							right : 0,
							top : css.px( 90 ),
							bottom : css.px( 90 )
						} )
					}, screenMask );

				window.loadGA && window.loadGA();

				firstpage.updateWorkList = null;

				function flag( name ) {
					return firstpage[name] == null ? false : object.is.Boolean( firstpage[name] ) ? firstpage[name] : firstpage[name]();
				}

				// 根据id制作body
				function ListWorkBody( id ) {
					return WorkBody( workDetailUrl.replace( originalWorkId + "", id ), {
						pageIndex : workPlayCache[id]
					} );
				}

				// 预加载作品
				function preloadWork() {
					preloaded = true;
					array.foreach( [-1, 1], function ( sign ) {
						var workId = workList[listIndex + sign];
						bodyCache[sign] = workId ? ListWorkBody( workId ) : null;
					} );
				}

				// 设置标题
				function setTitle( workBody, listIndex ) {
					if ( listIndex !== undefined ) {
						history.replaceState( null, "", href.toString().replace( originalWorkId + "", workBody.workId ) );
						window.cas && cas.trackPageview && cas.trackPageview();
						document.title = "作品加载中";
					}

					setTitleHandle = workBody.onLoad( function () {
						document.title = workBody.workTitle;
						setTitleHandle = null;
					} );
				}

				// 显示新的body
				function showBody( newBody ) {
					// 移除旧的body
					curBody.recycle();
					$.remove( curBody );

					// 记录当前播放的页码
					workPlayCache[curBody.workId] = curBody.curPageIndex;

					// 设置新的body
					curBody = newBody;
					curBody.play(); // 播放body

					preloadWork(); // 预加载作品
					setTitle( curBody, listIndex ); // 设置标题
				}

				// 寻找id对应的index
				function findIndexById( targetId ) {
					return array.foreach( workList, function ( id, i ) {
						if ( id == targetId ) {
							return i;
						}
					} );
				}

				// 如果是ios手动制作对应方法
				if ( ua.ios && !ua.win32 ) {
					array.foreach( ["open", "enterFullScreen", "leaveFullScreen", "switchWorkStart", "switchWorkEnd",
						"switchFirst", "switchLast"], function ( name ) {
						firstpage[name] = function () {
							document.location = "chuyeapp:" + name + ":" + Array.prototype.slice.call( arguments, 0 ).join( "$" );
						};
					} );
				}

				// 进入全屏
				ui.onTap( maskTapper, firstpage.enterFullScreenA = function () {
					if ( !curBody.loadError ) {
						// 恢复音乐播放
						if ( curBody.audioNeedResume ) {
							curBody.audioNeedResume = false;
							curBody.playAudio();
						}

						// 回复提示
						document.documentElement.classList.remove( "hide-tips-fade" );

						// 通知客户端
						firstpage.enterFullScreen();

						// 移除屏幕遮罩
						screenMask.classList.add( "hidden" );

						// 预加载页面
						curBody.preloadPage();
					}
				} );

				// 退出全屏
				ui.onTap( document.documentElement, firstpage.leaveFullScreenA = function () {
					if ( !ui.preventBodyEvent && screenMask.classList.contains( "hidden" ) ) {
						// 移除提示
						document.documentElement.classList.add( "hide-tips-fade" );

						// 停止播放音乐并记录是否需要恢复
						curBody.audioNeedResume = curBody.audioPlayIntention;
						curBody.stopAudio && curBody.stopAudio();

						// 通知客户端
						firstpage.leaveFullScreen();

						// 回复屏幕遮罩
						screenMask.classList.remove( "hidden" );
					}
				} );

				// 跳转到某作品
				firstpage.jump = function ( index ) {
					if ( curBody.workId != workList[index] ) {
						showBody( document.body.appendChild( ListWorkBody( workList[listIndex = index] ) ) );
					}
				};

				// 手动更新作品列表
				firstpage.updateWorkListA = function ( list ) {
					workList = ClientList( list );
					if ( ( listIndex = findIndexById( curBody.workId ) ) === undefined ) {
						firstpage.jump( 0 );
					}
				};

				if ( arg.full || flag( "full" ) ) {
					setTimeout( function () {
						firstpage.enterFullScreenA();
						lock.remove();
					}, Math.max( 0, 1500 - ( new Date() - loadingStart ) ) );
				}
				else {
					lock.remove();
					document.documentElement.classList.add( "hide-tips-fade" );
				}

				// 第一页加载完成后,预加载其他作品
				curBody.onPageLoad( preloadWork );

				// 设置页面标题
				setTitle( curBody );

				curBody.play();

				ui.onSwipeStart( screenMask, function ( event ) {
					if ( event.yOut ) {
						// 如果还没有预加载过,预加载
						if ( !preloaded ) {
							preloadWork();
						}

						var sign = event.dY > 0 ? -1 : 1,
							newBody = bodyCache[sign];

						// 切换作品
						function cutBody( cut, endIndex ) {
							var lock = ui.Lock();
							firstpage.switchWorkStart();
							util.cutPage( function () {
								cut( document.body, curBody, newBody, function () {
									listIndex = endIndex;
									showBody( newBody ); // 显示新body
									firstpage.switchWorkEnd( endIndex ); // 切换结束
									lock.remove(); // 解锁
								}, 0.4 );
							} );
						}

						// 如果有新body,切换
						if ( newBody ) {
							// 清理标题设置句柄
							if ( setTitleHandle ) {
								setTitleHandle.remove();
								setTitleHandle = null;
							}
							// 清理加载新页句柄
							loadNextHandle = null;
							cutBody( sign === 1 ? switchAnimation.push : switchAnimation.back, listIndex + sign );
						}

						// 如果不能刷新,弹出提示
						else if ( arg["no-refresh"] || flag( "noRefresh" ) ) {
							ui.alert( sign === 1 ? "没有下一个作品了" : "没有上一个作品了" );
						}

						// 如果有回调但没有被调用,弹出提示
						else if ( firstpage.updateWorkList !== null ) {
							ui.alert( "加载中,请稍候" );
						}

						// 底部上滑,加载新列表
						else if ( sign === 1 ) {
							// 加载图标
							var loadMoreWrapper = $( "div", {
								css : {
									position : "absolute",
									left : "50%",
									bottom : css.px( 80 ),
									"z-index" : 100,
									opacity : 0,
									transition : "0.2s"
								}
							}, document.body );

							$( tips.LoadingChrysanthemum( loadMoreWrapper ), {
								css : {
									"z-index" : 0
								}
							} );

							setTimeout( function () {
								css( loadMoreWrapper, "opacity", 1 );
							}, 0 );

							// 加载下一页句柄
							loadNextHandle = function () {
								var newId = workList[listIndex + 1];
								if ( newId ) {
									newBody = ListWorkBody( newId );
									cutBody( switchAnimation.push, listIndex + 1 );
								}
								else {
									ui.alert( "没有下一个作品了" );
								}
							};

							firstpage.updateWorkList = function ( newList ) {
								newList = ClientList( newList );

								// 移除加载图标
								removeByAnimation( loadMoreWrapper, {
									opacity : 0
								}, 0.3 );

								if ( JSON.stringify( newList ) === JSON.stringify( workList ) ) {
									ui.alert( "没有下一个作品了" );
									loadNextHandle = null;
								}
								else {
									workList = newList;
									listIndex = findIndexById( curBody.workId );
									loadNextHandle && loadNextHandle();
								}
								firstpage.updateWorkList = null;
							};

							firstpage.switchLast();
						}

						// 顶部下滑,刷新列表
						else {
							var refreshArrow = $( Img.Icon( "refresh-arrow" ), {
									css : {
										position : "absolute",
										left : 0,
										top : 0,
										"z-index" : 1,
										transition : "0.3s"
									}
								} ),
								refreshArrowSize = refreshArrow.w,
								refreshWrapper = $( "div", {
									css : {
										position : "absolute",
										left : "50%",
										"margin-left" : css.px( -refreshArrowSize / 2 ),
										width : css.px( refreshArrowSize ),
										height : css.px( refreshArrowSize ),
										top : css.px( -refreshArrowSize ),
										"z-index" : 100
									},
									children : [refreshArrow]
								}, document.body ),
								refreshLoading = $( tips.Loading( refreshWrapper ), {
									css : {
										"z-index" : 0,
										transition : "0.3s",
										transform : "scale(0.88)",
										opacity : 0
									}
								} ),
								refreshY = 0,
								releaseRefresh = false;

							pointer.onMoveUp( {
								onMove : function ( event ) {
									css.transform( refreshWrapper, css.translate( 0, Math.atan( ( refreshY += event.dY ) / 100 ) * 60 ) );
									releaseRefresh = refreshY > 100;
									css.transform( refreshArrow, css.rotateZ( releaseRefresh ? 180 : 0 ) );
								},
								onUp : function () {
									function removeTips() {
										removeByAnimation( refreshWrapper, {
											transform : "translate3d(0,0,0)"
										}, 0.3 );
									}

									if ( releaseRefresh ) {
										css( refreshArrow, "opacity", 0 );
										css( refreshLoading, "opacity", 1 );

										firstpage.updateWorkList = function ( newList ) {
											newList = ClientList( newList );
											if ( newList === undefined || ( workList = newList )[listIndex] == curBody.workId ) {
												var msgBox = $( "div.msg-box", {
														css : {
															top : css.px( Math.atan( ( refreshY += event.dY ) / 100 ) * 60 + 3 ),
															visibility : "visible"
														}
													}, document.body ),
													msg = $( "div.msg", {
														css : {
															opacity : 1,
															"border-radius" : "25px",
															"line-height" : "25px",
															padding : "0 12px"
														},
														innerHTML : "没有新的作品了"
													}, msgBox );

												async.once( function () {
													removeByAnimation( msgBox, {
														opacity : 0
													}, 0.3 );
												}, function ( remove ) {
													return [async.setTimeout( remove, 2000 ), ui.onPointerDown( document, remove )];
												} );

												preloadWork();
											}
											else {
												newBody = ListWorkBody( newList[0] );
												cutBody( switchAnimation.fade, 0 );
											}
											firstpage.updateWorkList = null;
											removeTips();
										};
										firstpage.switchFirst();
									}
									else {
										removeTips();
									}
								}
							} );
						}
					}
				} );
			} );
		}
		else {
			var loginData;
			// 如果有登录数据,切出登录页面
			if ( loginData = JSON.parse( env.getSessionData( "login-data" ) || "null" ) ) {
				env.registLoginPage[loginData.name]( object.extend( loginData, {
					noAnimate : true,
					parent : curBody
				} ) );
			}

			curBody.onLoad( function () {
				var workData = curBody.workData;

				// 在初页中,回调onFirstPageDataLoad方法
				if ( ua.chuye ) {
					ua.chuyeVersion < 2 && async.polling( function () {
						return !!document.onFirstPageDataLoad;
					}, function () {
						document.thumbnail = workData.picture;
						document.description = workData.desc;
						document.onFirstPageDataLoad();
					} );
				}

				// 在iframe中,回调父页面的onWorkLoad方法
				window.parent.onWorkLoad && window.parent.onWorkLoad( workData.data );

				// 设置分享url
				share( workData );

				// 预加载
				curBody.preloadPage();
			} );

			// 播放作品
			curBody.play();

			window.loadGA && window.loadGA();
		}

		// 修改尺寸
		$.bind( window, "resize", function () {
			curBody.resize( document.documentElement.clientWidth, document.documentElement.clientHeight );
		} );

		// 全局接口
		window.playAudio = function () {
			curBody && curBody.playAudio && curBody.playAudio();
		};

		window.stopAudio = function () {
			curBody && curBody.stopAudio && curBody.stopAudio();
		};

		Object.defineProperty( window, "curPageIndex", {
			set : function ( index ) {
				curBody && ( curBody.curPageIndex = index );
			},
			get : function () {
				return curBody ? curBody.curPageIndex : undefined;
			}
		} );

		Object.defineProperty( window, "curPageData", {
			get : function () {
				return curBody ? curBody.curPageData : undefined;
			}
		} );

		Object.defineProperty( window, "curWork", {
			get : function () {
				return curBody;
			}
		} );
	};
} );