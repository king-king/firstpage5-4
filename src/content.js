/**
 * Created by 白 on 2015/7/14.
 */

library( function () {
	var $ = imports( "element" ),
		css = imports( "css" ),
		px = css.px,

		object = imports( "object" ),
		insert = object.insert,
		textViewer = imports( "text-viewer" ),
		Font = textViewer.Font,

		Transform = imports( "./transform" ),
		ua = imports( "./ua" ),
		Img = imports( "./img" ),
		Layout = imports( "./layout" );

	// 内容
	function Content( func ) {
		return function ( ds ) {
			return object.insert( func.apply( null, arguments ), {
				dataSource : ds ? ds.dataSource : null
			} );
		};
	}

	// region 图片
	// 图片覆盖
	var Frame = exports.Frame = Content( function ( img, transform ) {
		return img.fail ? Fail( img, transform ) : {
			width : transform.w,
			height : transform.h,
			element : function () {
				img = img.cloneNode( false );
				if ( ua.android ) {
					css( img, {
						height : css.px( transform.th ),
						"margin-left" : css.px( transform.x ),
						"margin-top" : css.px( transform.y )
					} );
				}
				else {
					css( img, "transform-origin", "0 0" );
					css.transform( img, css.matrix( transform.matrix ) );
				}

				return $( "div", {
					css : {
						overflow : "hidden"
					},
					children : img
				} );
			},
			draw : function ( gc ) {
				Transform.drawImage( gc, img, transform );
			}
		};
	} );

	// 失败的图片
	function Fail( img, arg ) {
		var notFound = Img.imageNotFound;

		if ( img.fail === "fatal" ) {
			throw new Error();
		}

		return img.fail !== "empty" && arg.w && arg.h ? Frame( notFound, Transform( {
			s : notFound,
			d : arg,
			scale : function () {
				return Math.min( 0.5, arg.w / notFound.fullWidth * 0.3, arg.h / notFound.fullHeight * 0.3 );
			}
		} ) ) : {
			width : 0,
			height : 0,
			element : function () {
				return $( "div" );
			},
			draw : function () {
			}
		};
	}

	// 图片
	exports.Image = Content( function ( img, arg ) {
		var wh = object.is.Number( arg ) ? {w : img.w * arg, h : img.h * arg} : arg,
			width = wh.w, height = wh.h;

		return img.fail ? Fail( img, wh ) : {
			width : width,
			height : height,
			element : function () {
				return img.cloneNode( true );
			},
			draw : function ( gc ) {
				gc.drawImage( img, 0, 0, width, height );
			}
		};
	} );

	// 覆盖图片
	exports.Cover = Content( function ( img, arg ) {
		return Frame( img, Transform( {
			s : {w : img.fullWidth, h : img.fullHeight},
			d : arg,
			scale : Transform.scale.cover
		} ) );
	} );

	// 画布
	exports.Canvas = function ( canvas ) {
		return {
			width : canvas.logicalWidth,
			height : canvas.logicalHeight,
			element : function () {
				return canvas;
			},
			draw : function ( gc ) {
				gc.drawImage( canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvas.logicalWidth, canvas.logicalHeight )
			}
		};
	};

	// 边框
	exports.Border = function ( content, borderStyle ) {
		var borderWidth = borderStyle.width || 0,
			borderColor = borderStyle.color || "transparent",
			borderRadius = borderStyle.radius || 0,
			width = content.width,
			height = content.height;

		return {
			dataSource : content.dataSource,
			width : width + borderWidth,
			height : height + borderWidth,
			element : function () {
				var inner = $( Layout.contentToElement( content ), {
						css : {
							overflow : "hidden",
							"box-sizing" : "border-box",
							border : ["solid", px( borderWidth ), borderColor].join( " " ),
							"border-radius" : px( borderRadius )
						}
					} ),
					outer = inner;

				// 处理安卓的圆角bug
				if ( ua.android && inner.querySelector( "img" ) ) {
					outer = $( "div", [inner] );
					css.size( inner, width + borderWidth, height + borderWidth );
				}

				return outer;
			},
			draw : function ( gc ) {
				gc.save();
				if ( borderRadius ) {
					gc.beginPath();
					gc.moveTo( borderRadius, 0 );
					gc.lineTo( width - borderRadius, 0 );
					gc.arcTo( width, 0, width, borderRadius, borderRadius );
					gc.lineTo( width, height - borderRadius );
					gc.arcTo( width, height, width - borderRadius, height, borderRadius );
					gc.lineTo( borderRadius, height );
					gc.arcTo( 0, height, 0, height - borderRadius, borderRadius );
					gc.lineTo( 0, borderRadius );
					gc.arcTo( 0, 0, borderRadius, 0, borderRadius );
					gc.clip();
				}

				gc.save();
				gc.translate( borderWidth, borderWidth );
				content.draw( gc );
				gc.restore();

				if ( borderWidth ) {
					gc.fillStyle = borderColor;
					gc.fillRect( 0, 0, width, borderWidth );
					gc.fillRect( 0, 0, borderWidth, height );
					gc.fillRect( width, 0, borderWidth, height + borderWidth );
					gc.fillRect( 0, height, width + borderWidth, borderWidth );
				}
				gc.restore();
			}
		};
	};

	exports.Mask = function ( content, mask ) {
		var width = content.width,
			height = content.height;

		return {
			dataSource : content.dataSource,
			width : width,
			height : height,
			element : function () {
				var inner = $( Layout.contentToElement( content ), {
						css : {
							overflow : "hidden",
							"box-sizing" : "border-box",
							"mask-image" : css.url( mask.src ),
							"mask-size" : "100% 100%"
						}
					} ),
					outer = inner;

				// 处理安卓的mask bug
				if ( ua.android ) {
					outer = $( "div.mask", [inner] );
					css.size( inner, width, height );
				}

				return outer;
			},
			draw : function ( gc ) {
				var contentCanvas = Img.Canvas( width, height, 1 ),
					contentGc = contentCanvas.context;
				content.draw( contentGc );
				contentGc.globalCompositeOperation = "destination-in";
				contentGc.drawImage( mask, 0, 0, width, height );
				gc.drawImage( contentCanvas, 0, 0, width, height );
			}
		};
	};
	// endregion

	// region 形状
	// 矩形,如未提供颜色,就是一个空矩形
	exports.Rect = function ( width, height, color ) {
		return {
			width : width,
			height : height,
			element : function () {
				return $( "div", {
					css : {
						background : color || "transparent"
					}
				} );
			},
			draw : function ( gc ) {
				if ( color ) {
					gc.fillStyle = color;
					gc.fillRect( 0, 0, width, height );
				}
			}
		};
	};

	// 圆形
	exports.Circle = function ( r, color ) {
		return {
			width : r * 2,
			height : r * 2,
			element : function () {
				return $( "div", {
					css : {
						"border-radius" : px( r ),
						background : color || "transparent"
					}
				} );
			},
			draw : function ( gc ) {
				if ( color ) {
					gc.save();
					gc.beginPath();
					gc.arc( r, r, r, 0, 2 * Math.PI );
					gc.closePath();
					gc.fillStyle = color;
					gc.fill();
					gc.restore();
				}
			}
		}
	};
	// endregion

	// region 文本
	// 测量
	function measure( func ) {
		var canvas = document.createElement( "canvas" );
		func( canvas.getContext( "2d" ) );
	}

	// 行文本
	function LineText( text, width, info ) {
		var fontSize = info.fontSize;

		function draw( gc, height ) {
			// 绘制
			gc.font = Font( info );
			gc.textBaseline = "middle";
			gc.fillStyle = info.color;
			gc.fillText( text, 0, height / 2 << 0 );
		}

		return {
			width : width,
			height : fontSize,
			element : function () {
				var canvas = Img.Canvas( width + 4, fontSize + 4 ),
					gc = canvas.context;
				gc.translate( 2, 0 );
				draw( gc, fontSize + 4 );

				return $( "div", [$( canvas, {
					css : {
						"margin-left" : "-2px",
						"margin-top" : "-2px"
					}
				} )] );
			},
			draw : function ( gc ) {
				draw( gc, fontSize );
			}
		};
	}

	// 标签,不指定宽度.文字多长,宽度就是多少
	exports.Label = Content( function ( text, info ) {
		text = text.toString();
		return LineText( text, textViewer.measureText( text, info ).width, info );
	} );

	// 行文本,需指定宽度,多出部分截取
	exports.LineText = Content( function ( text, info ) {
		text = text.toString();
		var width = info.width,
			drawText = "";

		measure( function ( gc ) {
			function getWidth( text ) {
				return gc.measureText( text ).width;
			}

			gc.font = Font( info );
			if ( info.overflow && getWidth( text ) > width ) {
				for ( var i = 0; i !== text.length; ++i ) {
					if ( getWidth( text.substring( 0, i + 1 ) + "…" ) > width ) {
						break;
					}
				}
				drawText = text.substring( 0, i ) + "…";
			}
			else {
				drawText = text;
			}
		} );

		return LineText( drawText, width, info );
	} );

	// 块文本
	exports.BlockText = Content( function ( text, info ) {
		text = text.toString();

		var textLayout = textViewer.layText( text, info.width, insert( info, {
			lineBreak : info.breakWord ? textViewer.LineBreak.breakAll : textViewer.LineBreak.normal,
			align : info.breakWord ? textViewer.Align.left : textViewer.Align.side
		} ) );

		return {
			width : info.width,
			height : textLayout.height,
			draw : function ( gc ) {
				textViewer.drawTextLayout( gc, textLayout );
			}
		};
	} );
	// endregion
} );