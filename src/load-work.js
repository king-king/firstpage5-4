/**
 * Created by 白 on 2015/6/9.
 */

library( function () {
	var ajax = imports( "ajax" ),
		URL = imports( "url" ),
		object = imports( "object" ),
		array = imports( "array" ),
		async = imports( "async" ),
		func = imports( "function" ),
		css = imports( "css" ),

		tips = imports( "./tips" ),
		share = imports( "./share" ),
		ua = imports( "./ua" ),

		href = URL( location.href ),

		workDataCache = [];

	href = href.arg.returnUrl || href;

	function loadWork( workInfoUrl, callback, arg ) {
		arg = arg || {};
		workInfoUrl = URL( workInfoUrl );
		var id = array.top( workInfoUrl.pathname.split( "/" ) );

		// 查找缓存中的作品数据
		function findCacheWorkData() {
			var dataInfo = array.findFirst( workDataCache, function ( dataInfo ) {
				return dataInfo.id === id;
			} );
			return dataInfo ? dataInfo.data : null;
		}

		func.callWith( function ( parseWorkData ) {
			var workData = window.workData || findCacheWorkData();
			delete window.workData;
			workData ? parseWorkData( workData ) : ajax( {
				url : workInfoUrl
			}, function ( err, xhr ) {
				var data;
				try {
					data = JSON.parse( xhr.responseText );
				}
				catch ( e ) {
					data = {
						code : 1500
					};
				}

				// 添加到缓存
				workDataCache.push( {
					id : id,
					data : data
				} );
				workDataCache.length > 100 && workDataCache.unshift();

				// 解析作品
				parseWorkData( data );
			} );
		}, function ( data ) {
			var parsedData, workData = data.data || data;

			// 如果code不是200,进入异常流程
			if ( data.code && data.code !== 200 ) {
				parsedData = {
					error : data.code
				};
			}
			// 否则解析页面数据
			else {
				var pages = array.map( workData.pages, function ( pageData ) {
						return pageData.layout;
					} ),
					noLoop = false;

				if ( workData.copyright && !arg.noAuthor ) {
					var authorPageData = {
						label : "author",
						data : {
							uid : workData.uid
						}
					};

					pages.push( authorPageData );
				}
				else {
					noLoop = true;
				}

				parsedData = {
					cut : workData.cut || ( window.fast ? false : undefined ),
					picture : workData.thumbnail,
					title : workData.title,
					url : href.origin + href.pathname,
					desc : workData.description || "",
					uid : workData.uid,
					theme : workData.theme,
					mode : workData.mode,
					color : workData.backgroud ? workData.backgroud.color === "FFFFFF" ? "#FFFFFF" : workData.backgroud.color : "#FFFFFF",
					pageSwitch : workData.pageSwitch ? workData.pageSwitch.animateId || "classic" : "classic",
					music : workData.music ? workData.music.src : null,
					pages : pages,
					noLoop : noLoop
				};
			}

			callback( object.insert( parsedData, {
				id : id,
				data : data
			} ) );
		} );

		return id;
	}

	module.exports = loadWork;
} );