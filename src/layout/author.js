/**
 * Created by 白 on 2015/6/10.
 * 作者页
 */

plugin( function () {
	var Img = imports( "../img" ),
		pointer = imports( "pointer" ),
		async = imports( "async" ),
		object = imports( "object" ),
		ajax = imports( "ajax" ),
		URL = imports( "url" ),
		css = imports( "css" ),

		env = imports( "../env" ),
		tips = imports( "../tips" ),
		ua = imports( "../ua" ),
		ui = imports( "../ui" ),
		p = imports( "../position" ),
		Layout = imports( "../layout" ),
		Content = imports( "../content" ),
		Component = Layout.Component,
		layoutFormats = Layout.formats,

		isFollow = false,
		social = imports( "../social" );

	function tap( element, onIn, onOut, onTap ) {
		ui.onPointerDown( element, function () {
			onIn();

			ui.onTapUp( onTap );

			async.once( function () {
				onOut();
			}, function ( task ) {
				return [pointer.onMoveUp( {
					onUp : task
				} ), ui.onSwipe( task, true ), ui.onLongPress( task )];
			} );
		} );
	}

	layoutFormats.author = {
		load : function ( pageData, done ) {
			var tasks = [],
				authorData = pageData.data;

			if ( !isFollow && social.isLogIn() ) {
				tasks.push( function ( done ) {
					social.request( "api/follow/state", {
						userId : authorData.uid
					}, function ( err, result ) {
						if ( err === null ) {
							isFollow = result;
						}
						done();
					} );
				} );
			}

			if ( authorData.author == null ) {
				tasks.push( function ( done ) {
					var xhr = ajax( {
						url : URL.concatArg( window.virtualPath + "/WorkV2/GetUserInfo", {
							userId : authorData.uid
						} )
					}, function ( err ) {
						if ( !err ) {
							var data = JSON.parse( xhr.responseText );
							if ( data.code === 200 ) {
								data = data.data;
								authorData.author = data.nickname;
								pageData.image = [authorData.avatar = data.thumbnail || Img.staticSrc( "default-avatar.jpg" )];
							}
						}
						done();
					} );
				} );
			}
			else {
				pageData.image = pageData.image || [authorData.avatar];
			}

			async.concurrency( tasks, function () {
				done( pageData );
			} );
		},
		resource : {
			create : "author/create",
			createActive : "author/create-active",
			follow : "author/follow",
			following : "author/following"
		},
		create : function ( layout, ds, resource, context ) {
			var authorData = ds.data(),
				scale = layout.yScale,
				fontSize = Math.max( 14 * scale << 0, 12 );

			function layImage( image, y ) {
				var component = Component( Content.Image( image, scale ), layout );
				component.x = p.center( component, layout );
				component.y = y * scale;
				return component;
			}

			function layText( text, y, color ) {
				var comp = Component( Content.Label( text, {
					lineHeight : fontSize,
					fontSize : fontSize,
					color : color || "#393939"
				} ), layout );
				comp.x = p.center( comp, layout );
				comp.y = y * scale;
				return comp;
			}

			layout.background = "white";

			// 作者
			var authorY = ua.chuye ? 340 / 2 : 194 / 2;
			layText( "作", authorY, "#989898" );
			layText( "者", authorY + 20, "#989898" );
			layText( authorData.author, ua.chuye ? 674 / 2 : 561 / 2 );

			// 头像
			var headSize = 144 / 2 * scale << 0,
				head = Component( Content.Border( Content.Cover( ds.image( 0 ), {w : headSize, h : headSize} ), {
					radius : headSize / 2
				} ), layout );
			head.y = ( ua.chuye ? 490 / 2 : 381 / 2 ) * scale;
			head.x = p.center( head, layout );

			if ( !ua.chuye ) {
				// 创作
				var create = layImage( resource.create, 925 / 2 ),
					createActive = layImage( resource.createActive, 925 / 2 );

				createActive.visible = false;

				tap( create.element, function () {
					create.visible = false;
					createActive.visible = true;
				}, function () {
					create.visible = true;
					createActive.visible = false;
				}, function () {
					env.downloadFirstPage();
				} );

				// 关注
				var following = layImage( resource.following, 631 / 2 );
				if ( !isFollow ) {
					following.visible = false;
					var follow = layImage( resource.follow, 631 / 2 );

					ui.onTap( follow.element, function () {
						env.follow( authorData.uid );
					} )
				}

				// 举报
				var reportText = layText( "举报", 1050 / 2, "#898989" ),
					reportButton = Component( Content.Rect( 50, 40 ), layout );

				reportButton.x = p.center( reportButton, layout );
				reportButton.y = p.middle( reportButton, reportText );
				ui.onTap( reportButton.element, function () {
					env.report( ds.id );
				} );
			}

			// 滑到最后一页时记录
			if ( !context.track ) {
				env.track( ["Download", "View", ua.systemName] );
				context.track = true;
			}
		}
	};
} );