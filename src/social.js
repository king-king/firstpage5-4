/**
 * Created by 白 on 2015/7/29.
 * 初页社交系统
 */

library( function () {
	var social = {},
		ua = imports( "./ua" ),
		cookie = imports( "cookie" ),
		URL = imports( "url" ),
		ajax = imports( "ajax" ),
		object = imports( "object" ),
		token = URL( location.href ).arg.token || cookie.get( "_token" ),
		ui = imports( "./ui" ),

		isLogin = !!token,
		userInfo = null,
		onValidate = null;

	function request( path, data, callback, isGet, noToken ) {
		data = data || {};
		var xhr = ajax( {
			url : URL.concatArg( "http://social.cloud7.com.cn/" + path, isGet ? data : {} ),
			data : isGet ? null : JSON.stringify( data ),
			method : isGet ? "get" : "post",
			headers : object.extend( {
				Accept : "application/json"
			}, isGet ? {} : {
				"Content-Type" : "application/json"
			}, token && !noToken ? {
				Authorization : "_token " + token
			} : {} )
		}, function ( err ) {
			if ( err ) {
				callback && callback( err );
			}
			else {
				try {
					var data = JSON.parse( xhr.responseText );
				}
				catch ( e ) {
					callback && callback( e );
					return;
				}

				if ( data.code === 200 ) {
					callback && callback( null, data.data );
				}
				else {
					callback && callback( data );
				}
			}
		} );
	}

	social.getIndex = function ( workId, callback ) {
		request( "api/Total/Index", {
			relateId : workId
		}, function ( err, result ) {
			if ( err && err.code === 401 ) {
				isLogin = false;
				onValidate && onValidate();
				request( "api/Total/Index", {
					relateId : workId
				}, callback, true, true );
			}
			else {
				isLogin = !!token;
				onValidate && onValidate();
				sessionStorage.setItem( "social", "true" );
				callback( err, result );
			}
		}, true );
	};

	social.getUserInfo = function ( callback ) {
		if ( userInfo ) {
			callback( null, userInfo );
		}
		else {
			request( "api/User/Summary", null, function ( err, data ) {
				if ( err ) {
					callback( err );
				}
				else {
					callback( null, userInfo = data );
				}
			}, true );
		}
	};

	if ( ua.MicroMessenger ) {
		social.isLogIn = function () {
			return sessionStorage.getItem( "social" ) || !!isLogin;
		};
		social.logIn = function ( arg ) {
			function login() {
				if ( isLogin ) {
					arg.onLogIn();
				}
				else {
					sessionStorage.setItem( "social", "true" );
					location.href = "http://passport.cloud7.com.cn/wechat/oauth";
				}
			}

			isLogin === undefined ? onValidate = login : login();
		};
	}
	else {
		social.canNotLogin = function () {
			ui.alert( "请在微信中使用" );
		};

		social.isLogIn = function () {
			return false;
		};
	}

	module.exports = object.extend( social, {
		request : request
	} )
} );