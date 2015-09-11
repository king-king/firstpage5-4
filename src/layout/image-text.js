/**
 * Created by Zuobai on 2014/10/1.
 * 老图文板式
 */

plugin( function () {
	var string = imports( "string" ),
		func = imports( "function" ),
		array = imports( "array" ),
		object = imports( "object" ),

		Layout = imports( "../layout" ),
		enterAnimation = imports( "../enter-animation" ),
		util = imports( "../util" ),
		Content = imports( "../content" ),
		p = imports( "../position" ),
		pageAnimation = imports( "../page-animation" ),
		ua = imports( "../ua" ),

		oldToNewRatio = 1136 / 1008,
		Layout504 = util.layout504,
		applySpeed = pageAnimation.applySpeed,
		Component = Layout.Component,
		layoutFormats = Layout.formats;

	function rgba() {
		return string.tuple( "rgba", Array.prototype.slice.call( arguments, 0 ) );
	}

	// region 背景图+透明层+文字板式
	function PureTextLayout( style ) {
		return {
			ignorePureColor : true,
			create : function ( layout, ds ) {
				var scale = layout.h / 504,
					margin = style.margin,
					lineHeight = style.lineHeight,
					fontSize = style.fontSize,
					text;

				// 背景
				Component( Content.Cover( ds.image( 0 ), layout ), layout );

				// 透明层
				var transparent = Component( Content.Rect( layout.w, layout.h, style.background ), layout );
				transparent.zi = 1;

				// 文字
				do {
					text = Component( Content.BlockText( ds.text( 0 ), {
						margin : margin * scale << 0,
						lineHeight : Math.max( lineHeight * scale << 0, 16 ),
						fontSize : Math.max( fontSize * scale << 0, 12 ),
						color : style.color,
						width : Math.min( 280 * Math.max( scale, 1 ) << 0, layout.w - 40 )
					} ) );
					margin = Math.max( margin - 1, 0 );
					lineHeight = Math.max( lineHeight - 1, 0, fontSize + 2 );
					if ( margin <= 0 || lineHeight <= fontSize + 2 ) {
						break;
					}
				}
				while ( text.h > layout.h * 0.8 );
				text.appendTo( layout );

				text.x = p.center( text, layout );
				text.y = p.middle( text, layout );
				text.zi = 2;
				text.enter = enterAnimation.Emerge();
			}
		};
	}

	// 黑色透明层
	layoutFormats.ImageText04 = PureTextLayout( {
		margin : 5,
		lineHeight : 25,
		fontSize : 15,
		color : "#FFFFFF",
		background : rgba( 0, 0, 0, 0.8 )
	} );

	// 白色透明层
	layoutFormats.ImageText07 = PureTextLayout( {
		margin : 5,
		lineHeight : 25,
		fontSize : 14,
		color : "#333333",
		background : rgba( 255, 255, 255, 0.85 )
	} );
	// endregion

	// region 相框图
	function layFrameImg( images, frameInfo, layout ) {
		// 遍历图片,分配区域,并计算入场动画
		applySpeed( array.map( images, function ( image, i ) {
			var info = frameInfo[i],
				content = Content.Cover( image, {
					w : Math.ceil( info.width * layout.xScale ) + 1,
					h : Math.ceil( info.height * layout.yScale ) + 1
				} ),
				comp = Component( content, layout );

			comp.x = info.x * layout.xScale;
			comp.y = info.y * layout.yScale;
			comp.enter = info.enter;
			return comp;
		} ), 1, 1 );
	}

	layoutFormats.MutipleImage02 = {
		resource : object.extend( {
			shadow : "mi02-shadow.png"
		}, !ua.android ? {
			grad : "mi02-grad.svg"
		} : {} ),
		create : function ( layout, ds, resource ) {
			layFrameImg( ds.image(), [
				{
					x : 25,
					y : 16 * oldToNewRatio,
					width : 280,
					height : 157 * oldToNewRatio,
					enter : enterAnimation.FlyInto( 3 )
				},
				{
					x : 25,
					y : 173 * oldToNewRatio,
					width : 280,
					height : 157 * oldToNewRatio,
					enter : enterAnimation.FlyInto( 1 )
				},
				{
					x : 25,
					y : 330 * oldToNewRatio,
					width : 280,
					height : 157 * oldToNewRatio,
					enter : enterAnimation.FlyInto( 3 )
				}
			], layout );

			// 阴影图和渐变图
			Component( Content.Image( resource.shadow, layout ), layout );
			resource.grad && Component( Content.Image( resource.grad, layout ), layout );
		}
	};

	layoutFormats.MutipleImage03 = {
		resource : {
			frame : "mi03-frame.png"
		},
		create : function ( layout, ds, resource ) {
			layFrameImg( ds.image(), [
				{
					x : 15,
					y : 15 * oldToNewRatio,
					width : 290,
					height : 231 * oldToNewRatio,
					enter : enterAnimation.FlyInto( 0 )
				},
				{
					x : 15,
					y : 250 * oldToNewRatio,
					width : 143,
					height : 239 * oldToNewRatio,
					enter : enterAnimation.FlyInto( 3 )
				},
				{
					x : 162,
					y : 250 * oldToNewRatio,
					width : 143,
					height : 239 * oldToNewRatio,
					enter : enterAnimation.FlyInto( 1 )
				}
			], layout );

			// 相框图
			Component( Content.Image( resource.frame, layout ), layout );
		}
	};
	// endregion

	// region 背景图+纯色矩形+三段文字板式
	function RectLayout( pos ) {
		return {
			ignorePureColor : true,
			create : function ( layout, ds ) {
				var color = ds.color || "#FFFFFF",
					scale = layout.yScale / 1008 * 1136,
					fontSize = [27, 16, 10],
					textTop = [22, 57, 88],
					rectHeight = 115 * scale << 0,
					rectTop, imgTop, imgBottom,
					texts = [];

				switch ( pos ) {
					case "top":
						rectTop = 0;
						imgTop = rectHeight;
						imgBottom = layout.h;
						break;
					case "middle":
						rectTop = layout.h * 0.6 << 0;
						imgTop = 0;
						imgBottom = layout.h;
						break;
					case "bottom":
						imgTop = 0;
						rectTop = imgBottom = layout.h - rectHeight;
						break;
				}

				// 图
				var img = Component( Content.Cover( ds.image( 0 ), {w : layout.w, h : imgBottom - imgTop} ), layout );
				img.y = imgTop;

				// 矩形
				var rect = Component( Content.Rect( layout.w, rectHeight, color ), layout );
				rect.y = rectTop;

				// 字
				func.loop( 3, function ( i ) {
					if ( ds.text( i ).toString() ) {
						var fs = fontSize[i] * scale << 0,
							text = Component( Content.Label( ds.text( i ), {
								fontSize : fs,
								color : color.toUpperCase() === "#FFFFFF" ? "#000000" : "#FFFFFF"
							} ), rect );

						text.x = p.center( text, layout );
						text.y = textTop[i] * scale << 0;
						text.enter = enterAnimation.Emerge();
						text.zi = 2;
						texts.push( text );
					}
				} );

				applySpeed( texts, 1, 1 );
			}
		};
	}

	layoutFormats.ImageText01 = RectLayout( "top" );
	layoutFormats.ImageText02 = RectLayout( "bottom" );
	layoutFormats.ImageText03 = RectLayout( "middle" );
	// endregion

	// 互联网分析沙龙,电商专场
	layoutFormats.ImageText05 = {
		ignorePureColor : true,
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				scale = l.scale;

			// 字
			var text = Component( Content.BlockText( ds.text( 0 ), {
				width : 157 * scale << 0,
				lineHeight : 30 * scale << 0,
				fontSize : 22 * scale << 0,
				color : "#FFFFFF",
				breakWord : true
			} ), layout );

			// 透明颜色背景
			var rect = Component( Content.Rect( text.w + 17 * scale * 2 << 0,
				Math.max( text.h + 20 * scale, 60 * scale ) << 0, rgba( 0, 0, 0, 0.85 ) ), layout );
			rect.x = p.rightIn( rect, layout );
			rect.y = p.middle( rect, layout );

			text.x = p.center( text, rect, true );
			text.y = p.middle( text, rect, true );
			text.appendTo( rect );
		}
	};

	// 国际创新峰会,三段文字依次飞入
	layoutFormats.ImageText06 = {
		ignorePureColor : true,
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				s = l.scale;

			// 透明层
			var rect = Component( Content.Rect( 250 * s, 350 * s, rgba( 0, 0, 0, 0.85 ) ), layout );
			rect.x = p.center( rect, layout );
			rect.y = p.middle( rect, layout );

			applySpeed( array.map( [35, 132, 229], function ( y, i ) {
				var text = Component( Content.BlockText( ds.text( i ), {
					width : rect.w - 2 * 17 * s,
					lineHeight : 25 * s << 0,
					fontSize : 14 * s << 0,
					color : "#FFFFFF",
					breakWord : true
				} ), rect );
				text.y = y * s << 0;
				text.x = p.center( text, rect, true );
				text.enter = enterAnimation.FlyInto( 1 );
				return text;
			} ), 1, 0.3 );
		}
	};

	// 他们特立独行
	layoutFormats.ImageText08 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text = l.image( ds.image( 1 ), layout );

			text.x = p.center( text, layout );
			text.y = l.y( 354 );
			text.enter = enterAnimation.Emerge();
		}
	};

	// 他们有一个共同的名字
	layoutFormats.ImageText09 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text = l.image( ds.image( 1 ), layout );

			text.x = p.center( text, layout );
			text.y = l.y( 289 );
			text.enter = enterAnimation.Emerge();
		}
	};

	// 有一家咖啡馆
	layoutFormats.ImageText10 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text = l.image( ds.image( 1 ), layout );

			text.x = l.x( 25 );
			text.y = l.y( 155 );
			text.enter = enterAnimation.Emerge();
		}
	};

	// 越极客,越性感
	layoutFormats.ImageText11 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text1 = l.image( ds.image( 1 ), layout ),
				text2 = l.image( ds.image( 2 ), layout );

			text1.x = p.center( text1, layout );
			text1.y = l.y( 189 );
			text2.x = p.center( text2, layout );
			text2.y = p.bottomTo( text2, text1 ) + 15 * l.scale;

			text1.enter = text2.enter = enterAnimation.Emerge();
			applySpeed( [text1, text2], 1, 1 );
		}
	};

	// 马云
	layoutFormats.ImageText12 = {
		resource : {
			mask : "im12-mask.png",
			mayun : "im12-mayun.jpg"
		},
		create : function ( layout, ds, resource ) {
			var scale = layout.yScale;

			// 马云头像和用户头像
			var mayun = Component( Content.Cover( resource.mayun, {w : layout.w / 2, h : 818 / 2 * scale} ), layout ),
				userAvatar = Component( Content.Cover( ds.image( 0 ), mayun ), layout );
			userAvatar.x = layout.w / 2;

			// 红色遮罩
			var mask = Component( Content.Cover( resource.mask, {w : layout.w, h : 200 * scale} ), layout );
			mask.y = p.bottomIn( mask, layout );

			// 文字
			var text = Component( Content.Image( ds.image( 1 ), scale ) );
			text.x = p.center( text, mask, true );
			text.y = 75 * scale;
			text.enter = enterAnimation.Emerge();
		}
	};

	// 新年大发
	layoutFormats.ImageText13 = {
		ignorePureColor : true,
		create : function ( layout, ds ) {
			var yScale = layout.yScale;

			// 背景
			Component( Content.Cover( ds.image( 0 ), layout ), layout );

			// 矩形
			var rect = Component( Content.Rect( layout.w, 248 / 2 * yScale << 0, "#FFFFFF" ), layout );
			rect.y = p.bottomIn( rect, layout );

			// 字
			var text = Component( Content.Image( ds.image( 1 ), yScale ), rect );
			text.x = p.center( text, layout );
			text.y = ( 766 - ( 1008 - 248 ) ) / 2 * yScale << 0;
			text.enter = enterAnimation.fadeIn;
		}
	};

	// 黄有维,1965年,湖南岳阳人
	layoutFormats.ImageText14 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text = l.image( ds.image( 1 ), layout );

			text.x = p.rightIn( text, layout ) - 14 * l.scale;
			text.y = l.y( 78 );
			text.enter = enterAnimation.Emerge();
		}
	};

	// 他的作品格调清新,充满阳光和朝气
	layoutFormats.ImageText15 = {
		ignorePureColor : true,
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text1 = l.image( ds.image( 1 ) ),
				text2 = l.image( ds.image( 2 ) ),
				scale = l.scale;

			var paddingY = 40 * scale << 0,
				paddingX = 23 * scale << 0,
				margin = 15 * scale << 0;

			text1.y = paddingY;
			text2.y = p.bottomTo( text2, text1 ) + margin;

			// 透明层
			var rect = Component( Content.Rect( Math.max( text1.w, text2.w, 246 * scale ) + paddingX * 2,
				text2.y + text2.h + paddingY, rgba( 255, 255, 255, 0.9 ) ), layout );
			rect.x = p.center( rect, layout );
			rect.y = p.middle( rect, layout );

			text1.appendTo( rect );
			text1.x = paddingX;

			text2.appendTo( rect );
			text2.x = p.rightIn( text2, rect, true ) - paddingX;

			text1.enter = text2.enter = enterAnimation.Emerge();
			applySpeed( [text1, text2], 1, 1 );
		}
	};

	// 稻城亚丁
	layoutFormats.ImageText16 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text1 = l.image( ds.image( 1 ), layout ),
				text2 = l.image( ds.image( 2 ), layout ),
				scale = l.scale;

			text1.x = l.x( 324 / 2 );
			text1.y = l.y( 114 / 2 );
			text2.x = text1.x + 3 * scale;
			text2.y = p.bottomTo( text2, text1 ) + 5 * scale;
			text1.enter = text2.enter = enterAnimation.fadeIn;
			applySpeed( [text1, text2], 1, 1 );
		}
	};

	// 沙雅
	layoutFormats.ImageText17 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text1 = l.image( ds.image( 1 ), layout ),
				text2 = l.image( ds.image( 2 ), layout ),
				scale = l.scale;

			text1.x = l.x( 68 / 2 );
			text1.y = l.y( 696 / 2 );
			text2.x = text1.x + 4 * scale;
			text2.y = p.bottomTo( text2, text1 ) + 5 * scale;
			text1.enter = text2.enter = enterAnimation.fadeIn;
			applySpeed( [text1, text2], 1, 1 );
		}
	};

	function MXZS( y ) {
		return {
			create : function ( layout, ds ) {
				var l = Layout504( layout, ds.image( 0 ) ),
					text1 = l.image( ds.image( 1 ), layout ),
					text2 = l.image( ds.image( 2 ), layout ),
					text3 = l.image( ds.image( 3 ), layout ),
					scale = l.scale;

				text1.x = p.center( text1, layout );
				text2.x = p.center( text2, layout );
				text3.x = p.center( text3, layout );
				text1.y = l.y( y / 2 );
				text2.y = p.bottomTo( text2, text1 ) + 57 / 2 * scale;
				text3.y = p.bottomTo( text3, text2 ) + 12 * scale;
				text1.enter = text2.enter = text3.enter = enterAnimation.Emerge();
				applySpeed( [text1, text2, text3], 1, 1 );
			}
		};
	}

	// 莫西子诗
	layoutFormats.ImageText18 = MXZS( 231 );

	// 有那么一些人
	layoutFormats.ImageText19 = MXZS( 612 );

	// 莫西子诗乐队
	layoutFormats.ImageText20 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				scale = l.scale,
				fs1 = 27 * scale << 0,
				text1 = Component( Content.Label( ds.text( 0 ), {
					fontSize : fs1,
					fontWeight : "bold",
					color : "white"
				} ), layout ),
				text2 = Component( Content.BlockText( ds.text( 1 ), {
					width : layout.w - 150,
					fontSize : 10 * scale << 0,
					lineHeight : 20 * scale << 0,
					color : "#d2d2d2"
				} ), layout );

			text1.x = p.center( text1, layout );
			text1.y = l.y( 191 / 2 );
			text2.x = p.center( text2, layout );
			text2.y = p.bottomTo( text2, text1 ) + 26 * scale;

			text1.enter = text2.enter = enterAnimation.Emerge();
			applySpeed( [text1, text2], 1, 1 );
		}
	};

	// 玛丽莲梦露,妮可基德曼
	layoutFormats.ImageText21 = layoutFormats.ImageText22 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text1 = l.image( ds.image( 1 ), layout ),
				text2 = l.image( ds.image( 2 ), layout ),
				scale = l.scale;

			text1.x = l.x( 516 / 2 );
			text1.y = l.y( 195 / 2 );
			text1.enter = enterAnimation.Emerge( 1 );
			text2.x = p.rightIn( text2, text1 );
			text2.y = p.bottomTo( text2, text1 ) + 5 * scale;
			text2.enter = enterAnimation.Emerge( 3 );
		}
	};

	// 斯嘉丽约翰逊
	layoutFormats.ImageText23 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text1 = l.image( ds.image( 1 ), layout ),
				text2 = l.image( ds.image( 2 ), layout ),
				scale = l.scale;

			text1.x = l.x( 60 / 2 );
			text1.y = l.y( 140 / 2 );
			text1.enter = enterAnimation.Emerge( 0 );
			text2.x = text1.x + 2 * scale;
			text2.y = p.bottomTo( text2, text1 ) + 5 * scale;
			text2.enter = enterAnimation.Emerge( 2 );
		}
	};

	// 安娜莫格拉莉丝
	layoutFormats.ImageText24 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text1 = l.image( ds.image( 1 ), layout ),
				text2 = l.image( ds.image( 2 ), layout ),
				scale = l.scale;

			text1.x = l.x( 82 / 2 );
			text1.y = l.y( 720 / 2 );
			text1.enter = enterAnimation.Emerge( 0 );
			text2.x = text1.x + 2 * scale;
			text2.y = p.bottomTo( text2, text1 ) + 5 * scale;
			text2.enter = enterAnimation.Emerge( 2 );
		}
	};

	// 愤怒的丘吉尔
	layoutFormats.ImageText25 = {
		ignorePureColor : true,
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text = l.image( ds.image( 1 ), layout );

			text.x = p.center( text, layout );
			text.y = p.bottomIn( text, layout ) - 40 * l.scale;
			text.enter = enterAnimation.Emerge( 0 );
		}
	};

	// 初夜在乎你的感受,所以才用心表达
	layoutFormats.ImageText26 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text1 = l.image( ds.image( 1 ), layout ),
				text2 = l.image( ds.image( 2 ), layout );

			text1.x = 0;
			text1.y = l.y( 588 / 2 );
			text2.x = 144 / 2;
			text2.y = p.bottomTo( text2, text1 );
			text1.enter = text2.enter = enterAnimation.Emerge( 1 );
			applySpeed( [text1, text2], 1, 1 );
		}
	};

	// Happy new year 2015
	layoutFormats.ImageText27 = {
		create : function ( layout, ds ) {
			var l = Layout504( layout, ds.image( 0 ) ),
				text = l.image( ds.image( 1 ), layout );

			text.x = p.center( text, layout );
			text.y = l.y( 503 / 2 );
			text.enter = enterAnimation.Emerge();
		}
	};
} );