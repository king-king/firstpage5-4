/**
 * Created by 白 on 2014/10/17.
 * 视频板式
 */

plugin( function () {
	var $ = imports( "element" ),
		css = imports( "css" ),
		pointer = imports( "pointer" ),
		csa = imports( "css-animation" ),

		tips = imports( "../tips" ),
		Img = imports( "../img" ),
		env = imports( "../env" ),
		Layout = imports( "../layout" ),
		Content = imports( "../content" ),
		ui = imports( "../ui" ),
		util = imports( "../util" ),
		p = imports( "../position" ),
		Component = Layout.Component,
		layoutFormats = Layout.formats;

	layoutFormats.video = {
		resource : {
			play : "video/play"
		},
		create : function ( layout, ds, resource ) {
			var l = util.layout504( layout, ds.image( 0 ) ),
				src = ds.video( 0 ),
				icon = l.image( resource.play, layout ),
				circle = Component( Content.Circle( icon.w / 2, "#FFFFFF" ), layout );

			circle.x = icon.x = p.center( icon, layout );
			circle.y = icon.y = icon.y = l.y( 436 / 2 );
			circle.visible = false;
			icon.zi = 1;

			layout.onShow( function () {
				circle.visible = true;
				csa.runAnimation( [circle.element, {
					0 : {
						opacity : 0.8
					},
					100 : {
						transform : css.scale( 2 ),
						opacity : 0
					}
				}, 2.5, "infinite"] );
			} );

			layout.onRemove( function () {
				circle.visible = false;
			} );

			ui.onTap( icon.element, function () {
				// 构建视频页,尝试识别iframe
				var slidePage, iframe;

				// 如果识别出了iframe,创建滑页
				if ( iframe = $( "div", src ).querySelector( "iframe" ) ) {
					slidePage = $( env.SlidePage(), {
						css : {
							background : "black"
						}
					} );

					// 滑入滑出时关闭音乐
					slidePage.onSlideIn( window.stopAudio );
					slidePage.onSlideOut( window.playAudio );

					iframe.width = layout.w;
					iframe.height = layout.w / 16 * 9 << 0;

					css( iframe, {
						position : "absolute",
						left : 0,
						top : css.px( ( layout.h - iframe.height ) / 2 << 0 )
					} );

					var loading = tips.Loading( slidePage );
					iframe.onload = function () {
						$.remove( loading );
						iframe.onload = null;
					};
					slidePage.appendChild( iframe );
					ui.onTap( $( "div", {
						css : {
							"position" : "absolute",
							"right" : "0",
							"top" : "0",
							"width" : "60px",
							"height" : "60px"
						},
						children : [util.staticCenter( Img.Icon( "video/close" ) )]
					}, slidePage ), function () {
						slidePage.slideOut();
					} );
				}

				if ( slidePage ) {
					slidePage.slideIn( layout.body );
				}
				else if ( /(^http:\/\/)|(^https:\/\/)/.test( src ) ) {
					env.jump( src );
				}
				else {
					ui.alert( "未识别的视频地址" );
				}
			} );
		}
	};
} );