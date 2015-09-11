/**
 * Created by 白 on 2015/6/10.
 */

library( function () {
	var css = imports( "css" ),
		csa = imports( "css-animation" ),
		async = imports( "async" ),
		object = imports( "object" ),
		array = imports( "array" ),
		URL = imports( "url" ),
		$ = imports( "element" ),

		ua = imports( "./ua" ),
		Img = imports( "./img" ),
		ui = imports( "./ui" ),
		inLogin = false,
		openContext = getSessionData( "open-in-browser" );

	if ( openContext ) {
		var tipsPage = $( "div", {
			css : css.full( {
				"background-color" : "rgba(0,0,0,0.88)",
				"z-index" : 100000
			} ),
			children : [
				Img( Img.staticSrc( [openContext, "-", ua.ios ? "ios" : "android", ".png"].join( "" ) ), {
					onLoad : function ( img ) {
						tipsPage.appendChild( $( img, {
							css : {
								position : "absolute",
								top : 0,
								right : 0,
								width : css.px( img.halfWidth )
							}
						} ) );
					}
				} )
			]
		}, document.body );
		ui.onTap( tipsPage, function () {
			$.remove( tipsPage );
		} );
	}

	function workLocation() {
		return location.origin + location.pathname;
	}

	// 保存浏览上下文
	function saveViewContext() {
		window.curWork && sessionStorage.setItem( workLocation(), JSON.stringify( {
			pageIndex : curWork.curPageIndex,
			workData : curWork.workData
		} ) );
	}

	// 跳转到链接,记录当前页码
	function jump( href, notSave ) {
		if ( window.firstpage && firstpage.open ) {
			firstpage.open( URL.toAbsolute( href ) );
		}
		else {
			!notSave && saveViewContext();
			location.href = href;
		}
	}

	// 获取session数据,并清除它
	function getSessionData( key, defaultValue ) {
		var retVal = sessionStorage.getItem( key );
		sessionStorage.removeItem( key );
		return retVal === null ? defaultValue : retVal;
	}

	// 滑页
	function SlidePage() {
		var page = $( "div", {
				css : css.full( {
					overflow : "hidden",
					"z-index" : 1001
				} )
			} ),
			slideInEvent = async.Event(),
			slideOutEvent = async.Event();

		ui.onPointerDown( page, function () {
			ui.preventBodyEvent = true;
		} );

		return object.insert( page, {
			onSlideIn : slideInEvent.regist,
			onSlideOut : slideOutEvent.regist,
			slideIn : function ( parent, noTransition ) {
				page.isIn = true;
				if ( !noTransition ) {
					var lock = ui.Lock();
					css( page, "visibility", "hidden" );
					setTimeout( function () {
						css( page, "visibility", "visible" );
						csa.runAnimation( [page, {
							0 : {
								transform : "translate3d(100%, 0, 0)"
							}
						}, 0.4], function () {
							slideInEvent.trig();
							lock.remove();
						} );
					}, 0 );
				}

				page.slideOut = function () {
					var lock = ui.Lock();
					slideOutEvent.trig();
					csa.runAnimation( [page, {
						100 : {
							transform : "translate3d(100%, 0, 0)"
						}
					}, 0.4], function () {
						lock.remove();
						$.remove( page );
					} );
					page.isIn = false;
				};

				parent.appendChild( page );
			}
		} );
	}

	// 注册一个登录页
	function registLoginPage( name, loginSystem, make ) {
		return registLoginPage[name] = function ( arg ) {
			if ( inLogin ) {
				return;
			}

			arg = arg || {};

			// 滑入页面
			function slidePageIn() {
				var page = SlidePage();
				make( page, arg.data );
				page.slideIn( arg.parent, arg.noAnimate );
			}

			if ( arg.debug ) {
				slidePageIn();
			}
			else if ( !loginSystem ) {
				ui.alert( "当前环境不支持该操作" );
			}
			else if ( loginSystem.canNotLogin ) {
				loginSystem.canNotLogin();
			}
			else if ( !arg.force && ( arg.noLog || loginSystem.isLogIn() ) ) {
				arg.onLogin ? arg.onLogin( slidePageIn ) : slidePageIn();
			}
			else {
				saveViewContext();
				sessionStorage.setItem( "login-data", JSON.stringify( {
					name : name,
					data : arg.data
				} ) );
				inLogin = true;
				loginSystem.logIn( {
					returnUrl : location.href,
					onLogIn : function () {
						sessionStorage.removeItem( workLocation() );
						sessionStorage.removeItem( "login-data" );
						inLogin = false;
						slidePageIn();
					}
				} );
				if ( inLogin ) {
					ui.alert( "登录中,请稍候" );
				}
			}
		};
	}

	// 在浏览器中打开做某事
	function openInBrowser( name, iosLink, androidLink ) {
		saveViewContext();
		sessionStorage.setItem( "open-in-browser", name );
		location.hash = "g:" + ( ua.ios ? iosLink : androidLink );
		location.reload();
	}

	function report( id ) {
		jump( "/report.html" + "#" + id );
	}

	function follow( uid ) {
		openInBrowser( "follow", "Cloud7Chuye://users/" + uid, URL.concatArg( "chuye://chuye.cloud7.com.cn/user", {
			id : uid
		} ) );
	}

	function openInClient( id, uid ) {
		openInBrowser( "open-in-client", "ChuyeWatch://work/" + id, URL.concatArg( "chuye://chuye.cloud7.com.cn/user", {
			userId : uid,
			workId : id
		} ) );
	}

	// 记录页面访问
	function track( args ) {
		window.cas ? cas.trackEvent( args ) : ua.win32 && console.log( args.join( " " ) );
	}

	// 下载初页
	function downloadFirstPage( trackName ) {
		if ( ua.chuye ) {
			ui.alert( "您正在使用初页" );
		}
		else {
			track( [trackName || "Download", "Click", ua.systemName] );

			if ( ua.android ) {
				location.href = "http://a.app.qq.com/o/simple.jsp?pkgname=com.cloud7.firstpage";
			}
			else if ( ua.ios ) {
				location.href = ua.MicroMessenger ? "http://a.app.qq.com/o/simple.jsp?pkgname=com.cloud7.firstpage"
					: "https://itunes.apple.com/cn/app/chu-ye/id910560238?mt=8";
			}
			else {
				jump( "http://www.cloud7.com.cn/chuye" );
			}
		}
	}

	// 和客户端互动
	function useClient( interfaces, callback ) {
		async.polling( function () {
			return !!window.firstpage;
		}, function () {
			// 如果是ios手动制作对应方法
			if ( ua.ios && !ua.win32 ) {
				array.foreach( interfaces, function ( name ) {
					firstpage[name] = function () {
						document.location = "chuyeapp:" + name + ":" + Array.prototype.slice.call( arguments, 0 ).join( "$" );
					};
				} );
			}

			callback && callback();
		} );
	}

	exports.workLocation = workLocation;
	exports.saveViewContext = saveViewContext;
	exports.jump = jump;
	exports.registLoginPage = registLoginPage;
	exports.getSessionData = getSessionData;
	exports.SlidePage = SlidePage;
	exports.report = report;
	exports.follow = follow;
	exports.openInClient = openInClient;
	exports.downloadFirstPage = downloadFirstPage;
	exports.track = track;
	exports.useClient = useClient;
} );