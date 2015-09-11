/**
 * Created by 白 on 2015/7/14.
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

		Layout = imports( "./layout" ),
		tips = imports( "./tips" ),
		util = imports( "./util" ),
		env = imports( "./env" ),
		ua = imports( "./ua" ),
		ui = imports( "./ui" ),
		Img = imports( "./img" ),
		ModeNormal = imports( "./mode-normal" ),
		ModeScroll = imports( "./mode-scroll" ),
		ModeMv = imports( "./mode-mv" ),

		curBody; // 当前作品

	module.exports = function Work( arg ) {
		var width = arg.width,
			height = arg.height,
			workBody = $( "div", {
				css : {
					overflow : "hidden",
					background : "#000000",
					"z-index" : 1
				}
			} ),
			playSchedule = async.Schedule(), // 播放日程
			preloadPageSchedule = async.Schedule(), // 预加载日程
			loading = workBody.appendChild( tips.Loading() ), // 加载图标
			mode = null; // 模式

		css.size( workBody, workBody.w = width, workBody.h = height );

		// 加载作品数据
		workBody.onLoad = async.Waiter( function ( loadDone ) {
			func.callWith( function ( doData ) {
				if ( arg.workData ) {
					var workData = workBody.workData = arg.workData;
					workBody.workId = workData.id;
					doData( workData );
				}
				else {
					workBody.workId = arg.loadWork( function ( workData ) {
						workBody.workData = workData;
						doData( workData );
					} );
				}
			}, function ( workData ) {
				// 错误流程
				if ( workData.error ) {
					var iconCode, title;
					switch ( workData.code ) {
						case 1401:
							iconCode = 1401;
							title = "您没有权限查看该作品";
							break;
						case 1500:
							iconCode = 1500;
							title = "哎呀,页面出错了,一会再来吧";
							break;
						default :
							iconCode = 500;
							title = "抱歉,您访问的页面已失踪";
							break;
					}

					workBody.loadError = true;
					workBody.workTitle = title;
					Img.pageError( workBody, iconCode + ".png" );
				}
				else {
					mode = ( {
						scroll : ModeScroll,
						mv : ModeMv
					}[workData.mode = window.mode || workData.mode] || ModeNormal )( workBody, arg, Work );
					mode.doData && mode.doData();

					playSchedule.prepare( function () {
						mode.play();
					} );
					preloadPageSchedule.prepare( function () {
						mode.preloadPage();
					} );

					// 页面加载器
					var pagesLoader = array.map( workData.pages, function ( pageData, index ) {
						var loader = {
							data : {},
							load : async.Loader( function ( done ) {
								Layout.loadPage( object.extend( workData, pageData ), function ( create ) {
									loader.create = function ( noParent ) {
										return $( create( width, height, loader.data, noParent ? null : workBody ), {
											pid : pageData.pid,
											index : index,
											css : {
												position : "absolute",
												left : 0,
												top : 0
											}
										} );
									};

									done();
								} );
							} ).load
						};
						return loader;
					} );

					// 加载页接口
					workBody.loadPage = function loadPage( index, onLoad, create ) {
						var pageLoader = pagesLoader[index];
						pageLoader ? pageLoader.load( function () {
							create !== false && onLoad && onLoad( pagesLoader[index].create() );
						} ) : onLoad && onLoad();
					};
				}

				loadDone();
			} );
		} ).onComplete;

		// 加载第一页
		workBody.onPageLoad = async.Waiter( function ( pageLoadDone ) {
			workBody.onLoad( function () {
				func.callWith( function ( done ) {
					workBody.loadError ? done() : mode.load( done );
				}, function () {
					pageLoadDone();
					$.remove( loading );
				} );
			} );
		} ).onComplete;

		return object.insert( workBody, {
			recycle : function () {
				mode && mode.recycle();
			},
			play : function () {
				curBody = workBody;
				playSchedule.start();
			},
			preloadPage : function () {
				preloadPageSchedule.start();
			},
			resize : function ( newWidth, newHeight ) {
				css.size( workBody, workBody.w = width = newWidth, workBody.h = height = newHeight );
				mode && mode.resize( newWidth, newHeight );
			}
		} );
	};
} );