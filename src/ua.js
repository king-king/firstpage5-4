/**
 * Created by 白 on 2015/7/14.
 */

library( function () {
	var ua = imports( "ua" ),
		object = imports( "object" ),
		URL = imports( "url" );

	// 添加ua
	object.insert( ua, {
		iphone4 : ua.iphone && screen.height === 480,
		iphone5 : ua.iphone && screen.height === 568,
		iphone6 : ua.iphone && screen.height > 568,
		mi4 : /Mi 4LTE/gi.test( navigator.userAgent )
	} );

	// 判断是否在初页中,以及初页的版本
	if ( ua.chuye = window.chuye || /chuye/gi.test( navigator.userAgent ) ) {
		ua.chuyeVersion = /chuye\/([\d.]*)/gi.test( navigator.userAgent ) ? parseFloat( RegExp.$1 ) : 1;
		ua.chuyeList = window.chuyeList || /chuyeFlow/gi.test( navigator.userAgent ) || !!URL( location.href ).arg.list;
		ua.chuyePreview = window.chuyePreview || /chuyePreview/gi.test( navigator.userAgent );
	}

	// 系统名
	if ( ua.iphone ) {
		ua.systemName = "iphone";
	}
	else if ( ua.ipad ) {
		ua.systemName = "ipad";
	}
	else if ( ua.ios ) {
		ua.systemName = "ios-other"
	}
	else if ( ua.android ) {
		ua.systemName = "android";
	}
	else {
		ua.systemName = "other";
	}

	// 根据不同的操作系统添加类
	ua.ios && document.documentElement.classList.add( "ios" );
	ua.win32 && document.documentElement.classList.add( "win32" );

	module.exports = ua;
} );