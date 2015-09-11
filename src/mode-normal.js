/**
 * Created by 白 on 2015/9/1.
 * 普通的模式
 */

library( function () {
	var array = imports( "array" ),
		string = imports( "string" ),
		object = imports( "object" ),
		$ = imports( "element" ),
		animation = imports( "animation" ),
		random = imports( "random" ),
		css = imports( "css" ),
		math = imports( "math" ),
		func = imports( "function" ),
		async = imports( "async" ),

		Music = imports( "./music" ),
		Preview = imports( "./preview" ),
		tips = imports( "./tips" ),
		sa = imports( "./switch-animation" ),
		util = imports( "./util" ),
		env = imports( "./env" ),
		animationData = imports( "./animation-data" ),
		pageAnimationData = animationData.pageAnimations,
		pageAnimation = imports( "./page-animation" ),
		ua = imports( "./ua" ),
		ui = imports( "./ui" ),
		Toolbar = imports( "./toolbar" ),
		lyric = imports( "./lyric" ),
		myWork = imports( "./my-work" ),

		switchAnimateList = [sa.classic, sa.push, sa.fade, sa.cube, sa.door, sa["switch"], sa.uncover]; // 动画切换数组,用来取随机用

	module.exports = function ( workBody, arg, Work ) {
		var curPage, // 当前页
			curPageIndex = arg.pageIndex || 0, // 当前页码
			playSchedule = async.Schedule(), // 播放日程
			preloadPageSchedule = async.Schedule(); // 预加载日程

		return {
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
					themeData = parseInt( workData.theme ) ? animationData.Theme( workData ) : null, // 主题数据
					mode = workData.mode, // 模式

					rawPageSwitch = workData.pageSwitch, // 页面切换
					switchAnimateId = mode === "push" || !sa[rawPageSwitch] ? "classic" : rawPageSwitch, // 切换动画id

					noLoop = workData.noLoop, // 无循环
					pagesData = workData.pages, // 页信息
					pageNum = workBody.pageNumber = pagesData.length, // 页数量

					musicIcon, // 播放图标
					loadingNewPageTips, // 加载新页提示
					cutHandle = null, // 切换句柄
					cutAnimateHandle = null, // 切换动画句柄
					tailArrived = curPageIndex === pageNum - 1,  // 已经到达尾部

					preview = arg.preview ? Preview( workBody, themeData ) : null, // 预览
					toolbar = arg.toolbar && !arg.preview ? Toolbar( workBody ) : null, // 工具条

					oPageNumber = $( "div.hidden", {
						css : {
							position : "absolute",
							left : "15px",
							bottom : "20px",
							"text-shadow" : "1px 1px 1px black",
							color : "white",
							"z-index" : 1
						}
					}, workBody ), // 总页码
					oCurPageIndex = $( "span", {
						css : {
							"font-size" : "16px"
						},
						innerHTML : curPageIndex + 1
					}, oPageNumber ); // 当前页码

				workBody.workTitle = workData.title; // 标题
				noLoop && workBody.appendChild( tips.PoweredBy() ); // 如果不循环,在workBody中添加PoweredBy
				arg.music && Music( workBody, musicIcon = $( tips.Music() ) ); // 音乐

				function loadPage( index, onLoad ) {
					workBody.loadPage( index, function ( page ) {
						if ( page ) {
							var layout = page.wrapper,
								applyEnter = layout.applyEnter;

							// 设置切换动画
							page.switchAnimate = ( rawPageSwitch === "random" ? random.select( switchAnimateList ) : sa[switchAnimateId] );

							// 设置主题
							if ( themeData ) {
								// 重新分配切换动画
								page.switchAnimate = themeData.switchAnimation;

								// 分配
								applyEnter && pageAnimation.applyAnimate( page, applyEnter.pageAnimation ?
									pageAnimationData[applyEnter.pageAnimation] : themeData.appliedGroup[page.index] );
							}

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
					var firstTips = workBody.appendChild( tips.CutFirst() );
					curPage = workBody.appendChild( page );

					// 显示页码和工具栏
					oPageNumber.classList.remove( "hidden" );

					// 准备播放日程和预加载页面日程
					playSchedule.prepare( function () {
						curPage.play();
					} );
					preloadPageSchedule.prepare( preloadPage );

					// 如果有音乐,添加音乐播放
					if ( workBody.playAudio ) {
						// 点击图标切换播放状态
						ui.onTap( workBody.appendChild( musicIcon ), function () {
							musicIcon.play ? workBody.stopAudio() : workBody.playAudio();
						} );

						// 如果在微信中,立刻播放音乐
						ua.MicroMessenger && ( ua.ios && window.WeixinJSBridge ?
							WeixinJSBridge.invoke( 'getNetworkType', {}, workBody.playAudio ) : workBody.playAudio() );
					}

					// 切换页面
					function cut( step ) {
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
									oldPage.fastForward(); // 快进当前页
									oldPage.recycle(); // 回收当前页

									$.classList( workBody ).remove( "last-page" ).remove( "show-copyright" );

									curPage = newPage;
									oCurPageIndex.innerHTML = ( curPageIndex = curPage.index ) + 1;

									preloadPage();

									// 切换动画
									var lock = ui.Lock();
									util.cutPage( function () {
										cutAnimateHandle = ( step > 0 ? curPage.switchAnimate : sa.back )( workBody, oldPage, curPage, function () {
											cutAnimateHandle = null;
											$.remove( oldPage );
											workBody.appendChild( curPage );
											curPage.play();

											if ( curPageIndex === pageNum - 1 ) {
												tailArrived = true;
												workBody.classList.add( "last-page" );
											}

											lock.remove();

											toolbar && toolbar.show( step < 0 || curPageIndex === pageNum - 2 || curPageIndex === 0 );
											preview && preview( curPage );

											env.track( ["PV", workBody.workId, ua.systemName] );
										} );
									} );
								}
							} );
						} );
					}

					// 手势切换
					func.callWith( function ( cut ) {
						ui.onSwipeStart( workBody, function ( event ) {
							if ( event.yOut && Math.abs( event.dX ) < 10 ) {
								var toDown = event.dY < 0;
								// 在第一页并且没有到达过最后一页时,向上滑时无效
								if ( !( !toDown && ( curPageIndex === 0 && ( !tailArrived || noLoop ) ) ) ) {
									cut( toDown ? 1 : -1 );
								}
							}
						} );
					}, function ( step ) {
						if ( ui.preventBodyEvent || ui.preventDrag || noLoop && curPageIndex === pageNum - 1 && step === 1 ) {
							return;
						}

						// 如果还是第一个提示,换成普通提示
						if ( firstTips ) {
							$.remove( firstTips );
							firstTips = null;
							workBody.appendChild( tips.Cut() );
							workBody.audioPlayIntention && workBody.playAudio && workBody.playAudio(); // 如果有音乐播放意图,播放音乐
						}

						cut( step );
					} );

					// 总页码
					oPageNumber.appendChild( $( "span", {
						innerHTML : "/" + pageNum,
						css : {
							"font-size" : "12px"
						}
					} ) );

					// 当前页接口
					Object.defineProperty( workBody, "curPage", {
						get : function () {
							return curPage;
						}
					} );

					// 页码接口
					Object.defineProperty( workBody, "curPageIndex", {
						get : function () {
							return curPageIndex;
						},
						set : function ( targetPageIndex ) {
							if ( !document.documentElement.classList.contains( "lock" ) ) {
								targetPageIndex = getPageIndex( targetPageIndex );
								if ( targetPageIndex !== curPageIndex ) {
									cut( targetPageIndex - curPageIndex );
								}
							}
						}
					} );

					// 页面数据接口
					Object.defineProperty( workBody, "curPageData", {
						get : function () {
							return workData.pages[curPageIndex];
						}
					} );

					toolbar && toolbar.prepare(); // 准备工具条
					preview && preview( curPage ); // 预览
					location.hash === "#edit" && myWork( workBody, Work ); // 编辑作品

					// 第一页加载完成
					pageLoadDone();
				} );
			}
		};
	};
} );
