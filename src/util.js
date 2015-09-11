/**
 * Created by 白 on 2015/7/15.
 * 用于封装一些偷懒的写法
 */

library( function () {
	var z2d = imports( "2d" ),
		array = imports( "array" ),
		css = imports( "css" ),

		ua = imports( "./ua" ),
		Layout = imports( "./layout" ),
		Content = imports( "./content" ),
		Transform = imports( "./transform" );

	// 切换页面,修复一些特殊机型的bug
	function cutPage( cut ) {
		ua.chuye && ua.mi4 ? setTimeout( cut, 30 ) : cut();
	}

	// 504板式
	function layout504( layout, backgroundImage ) {
		var transform = Transform.cover504( layout );

		if ( backgroundImage ) {
			Layout.Component( Content.Cover( backgroundImage, layout ), layout );
		}

		return {
			scale : transform.scale,
			image : function ( image, parent ) {
				return Layout.Component( Content.Image( image, transform.scale ), parent );
			},
			x : function ( x ) {
				return z2d.transform( transform.matrix, [x, 0, 1] )[0];
			},
			y : function ( y ) {
				return z2d.transform( transform.matrix, [0, y, 1] )[1];
			}
		};
	}

	function staticCenter( el ) {
		return css( el, {
			position : "absolute",
			left : "50%",
			top : "50%",
			transform : "translate3d(-50%,-50%,0)"
		} ).element;
	}

	exports.cutPage = cutPage;
	exports.layout504 = layout504;
	exports.staticCenter = staticCenter;
} );