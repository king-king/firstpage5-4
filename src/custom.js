/**
 * Created by 白 on 2015/3/13.
 */

library( function () {
	var array = imports( "array" ),
		object = imports( "object" ),
		z2d = imports( "2d" ),

		scaleComponent = imports( "./component-scale" ),
		enterAnimation = imports( "./enter-animation" ),
		pageAnimation = imports( "./page-animation" ),
		Content = imports( "./content" ),
		Transform = imports( "./transform" ),
		MultiImage = imports( "./multi-image" ),
		random = imports( "random" ).Random( 0 ),

		p = imports( "./position" ),
		Layout = imports( "./layout" ),
		layoutFormats = Layout.formats,
		Component = Layout.Component,
		animationTable = enterAnimation.table; // 动画表

	function dealWidth( value, func ) {
		if ( value != null ) {
			return func( value );
		}
	}

	function defaultValue( val, defaultValue ) {
		return val == null ? defaultValue : val;
	}

	function layCustom( layout, ds, type ) {
		var components = ds.component(),
			custom = ds.custom,
			isScreen = type === "screen" || custom.layoutType === "screen",
			isOld = !isScreen && custom.label === "custom",
			transform = isOld ? Transform.cover504( layout ) : custom.type === "cover" ? Transform.cover( layout ) : Transform.y( layout ),
			scale = transform.scale,
			xScale = layout.xScale, yScale = layout.yScale,
			curDelay = 0;

		function Custom( img, info ) {
			var width = ( info.width - ( info.borderWidth || 0 ) ) * scale << 0,
				height = ( info.type === "text" && img.h ? width / img.whr : info.height * scale ) << 0,
				content = img.color ? Content.Rect( width, height, img.color ) :
					ds.cut === false ? Content.Cover( img, {w : width, h : height} ) : Content.Image( img, {w : width, h : height} );

			return img.mask ? Content.Mask( content, img.mask ) : content;
		}

		layout.applyEnter = {
			first : custom.animationFirst,
			pageAnimation : ds.pageAnimation
		};

		// 生成组件
		array.foreach( components, function ( img, index ) {
			var info = img.info,
				component = null;

			// 处理图片
			function dealImage( img, componentInfo, parent ) {
				var imageInfo = componentInfo.info;

				// 边框图
				if ( componentInfo.frame != null ) {
					return dealWidth( componentInfo.frame, function ( frameImg ) {
						var frameInfo = frameImg.info,
							frame = Component( Custom( frameImg, frameInfo ) ),
							content = Component( Custom( img, imageInfo ) ),
							wrapper = Component( Content.Rect( frame.w, frame.h ), parent );

						wrapper.origin = z2d.transform( transform.matrix, [frameInfo.x, frameInfo.y, 1] );
						content.origin = [( imageInfo.x - frameInfo.x ) * scale, ( imageInfo.y - frameInfo.y ) * scale];
						frame.appendTo( wrapper );
						content.appendTo( wrapper );
						wrapper.info = object.extend( frameInfo, {
							type : "image"
						} );

						return wrapper;
					} );
				}

				// 边框
				if ( imageInfo.maskRadius || imageInfo.borderWidth || imageInfo.borderColor ) {
					return Component( Content.Border( Custom( img, imageInfo ), {
						radius : imageInfo.maskRadius * scale << 0,
						width : imageInfo.borderWidth * scale << 0,
						color : imageInfo.borderColor
					} ), parent );
				}

				return Component( Custom( img, imageInfo ), parent );
			}

			// 背景图
			if ( info == null ) {
				if ( img.color ) {
					layout.background = img.color;
				}
				else {
					// 背景覆盖
					if ( isOld || custom.type === "cover" || isScreen ) {
						component = layout.backgroundImage = Component( Content.Cover( img, layout ), layout );
						component.applyEnter = {
							type : "background",
							coverBackground : true
						};
					}
					// 背景撑满y
					else {
						component = Component( Content.Image( img, layout.h / img.h ), layout );
						component.x = p.center( component, layout );
					}
				}
			}
			// 屏幕图
			else if ( info.type === "screen" ) {
				component = Component( Content.Image( img, layout.w, layout.h ), layout );
			}
			// 一般组件
			else {
				if ( isScreen ) {
					!function () {
						var x = info.x * xScale << 0, y = info.y * yScale << 0,
							width = Math.round( info.width * xScale ),
							height = Math.round( ( info.type === "text" ? info.width / img.whr : info.height ) * yScale ),
							content;

						// 遮罩
						if ( info.type === "text" ) {
							var scale = Math.min( width / img.w, height / img.h );
							x += width - img.w * scale;
							y += height - img.h * scale;
							component = Component( Content.Image( img, scale ), layout );
						}
						else {
							content = Content.Cover( img, {w : width, h : height} );
							component = Component( img.mask ? Content.Mask( content, img.mask ) : content, layout );
						}

						component.origin = [x, y];
					}();
				}
				else {
					if ( img.multiImage ) {
						// 多图
						dealWidth( img.multiImage, function ( images ) {
							component = Component( Custom( {
								color : "transparent"
							}, info ), layout );

							MultiImage( {
								layout : layout,
								parent : component,
								images : component.images = array.map( images, function ( contentImg ) {
									return dealImage( contentImg, img );
								} ),
								delay : 3,
								sign : -1,
								animation : false,
								arrow : img.arrow
							} );
						} );
					}
					else {
						component = dealImage( img, img, layout );
					}

					info = component.info || info;
					var point = z2d.transform( transform.matrix, [info.x, info.y, 1] );
					component.origin = array.map( [[point[0], info.alignX, layout.w, component.w],
						[point[1], info.alignY, layout.h, component.h]], array.apply( function ( x, align, pw, w ) {
						return align != null ? ( pw - w ) * align : x;
					} ) );
					delete component.info;
				}

				component.rotate = ( info.rotate || 0 ) * 180 / Math.PI;
				component.opacity = defaultValue( info.opacity, 1 );
				component.zi = info && info.type === "text" ? 100 + index : index;

				// 缩放文字使全部显示
				if ( info.type === "text" ) {
					component.scale *= Math.max( scaleComponent( component, layout ), 0.5 );
				}

				// 处理动画
				if ( isOld ) {
					var enter = object.extend( animationTable[info.animation] || enterAnimation.Emerge(), {
							duration : info["animation-duration"]
						} ),
						delay = info["animation-delay"];

					enter.delay = delay === undefined || delay === null ? curDelay : delay;
					curDelay = enter.delay + ( enter.duration || 1 );
					component.enter = enter;
				}
				else {
					component.applyEnter = info.type == null ? undefined : {
						type : info.type,
						enterTiming : info.enterTiming,
						animationIndex : info.animationIndex,
						animation : info.animation,
						index : index
					};
				}
			}

			if ( component ) {
				component.custom = true;
				component.customInfo = info;
				component.isElement = true;
			}
		} );
	}

	// 组件板式
	layoutFormats.components = {
		create : layCustom
	};

	// 屏幕板式
	layoutFormats.screen = {
		create : function ( layout, ds ) {
			layCustom( layout, ds, "screen" );
		}
	};

	// 单图板式
	layoutFormats.SingleImage = {
		create : function ( layout, ds ) {
			if ( ds.mode === "mv" && random.probability( 0.3 ) ) {
				layout.back = Component( Content.Rect( layout.w, layout.h ), layout );
				layout.bottomImage = Component( Content.Cover( ds.image( 0 ), layout ), layout.back );
				layout.backgroundImage = Component( Content.Cover( ds.image( 0 ), layout ), layout.back );
			}
			else {
				layout.back = Component( Content.Cover( ds.image( 0 ), layout ), layout );
			}
		}
	};

	// 空板式,仅为加载
	layoutFormats.custom = layoutFormats["custom-2"] = {};

	// 多图
	layoutFormats.MutipleImage01 = {
		resource : {
			arrow : "arrow/mi01"
		},
		create : function ( layout, ds, resource ) {
			var height = layout.h * 0.82 << 0,
				frame = Component( Content.Rect( height / 410 * 244 << 0, height ), layout ); // 多图框

			frame.x = p.center( frame, layout );
			frame.y = p.middle( frame, layout );

			// 多图组件
			MultiImage( {
				layout : layout,
				parent : frame,
				images : array.map( ds.component( 0 ).multiImage, function ( img ) {
					return Component( Content.Border( Content.Cover( img, frame ), {
						width : 3,
						color : "#FFFFFF"
					} ), null, true );
				} ),
				sign : -1,
				arrow : resource.arrow
			} );
		}
	};

	// 三行字+多图
	layoutFormats.MutipleImage04 = {
		resource : {
			background : "mi04-background.jpg",
			arrow : "arrow/mi04"
		},
		create : function ( layout, ds, resource ) {
			var scale = layout.yScale;

			// 背景图
			Component( Content.Image( resource.background, layout.w, layout.h ), layout );

			// 元素
			var text1 = Component( Content.Image( ds.component( 0 ), scale ), layout ),
				text2 = Component( Content.Image( ds.component( 1 ), scale ), layout ),
				text3 = Component( Content.Image( ds.component( 2 ), scale ), layout ),
				frame = Component( Content.Rect( 356 / 2 * scale, 518 / 2 * scale ), layout );

			text2.y = p.bottomTo( text2, text1 ) + 11 * scale;
			text3.y = p.bottomTo( text3, text2 ) + 19 * scale;
			frame.y = p.bottomTo( frame, text3 ) + 39 * scale;

			// 垂直居中
			var padding = ( layout.h - p.bottom( frame ) ) / 2 << 0;
			array.foreach( [text1, text2, text3, frame], function ( comp ) {
				comp.y += padding;
				comp.x = p.center( comp, layout );
			} );

			// 入场动画
			text1.enter = text2.enter = text3.enter = enterAnimation.Emerge();
			pageAnimation.applySpeed( [text1, text2, text3], 1, 1 );

			// 多图组件
			MultiImage( {
				layout : layout,
				parent : frame,
				images : array.map( ( ds.component( 3 ) ).multiImage, function ( img ) {
					return Component( Content.Border( Content.Cover( img, frame ), {
						width : 1,
						color : "#FFFFFF"
					} ) );
				} ),
				delay : 3,
				sign : -1,
				arrow : resource.arrow
			} );
		}
	};

	// 处理自定义板式的数据
	array.foreach( ["screen", "custom", "custom-2", "MutipleImage01", "MutipleImage04"], function ( label ) {
		layoutFormats[label].load = function ( pageData, callback ) {
			var newLabel = "components", components = [], componentImages = [], fail = false;

			// 计算新的label
			switch ( label ) {
				case "MutipleImage01":
				case "MutipleImage04":
				case "screen":
					newLabel = label;
					break;
			}

			function ComponentImage( data ) {
				var url = data.url, img;
				if ( url ) {
					img = new Image();
					img.targetSrc = url;
					componentImages.push( img );
				}
				else {
					img = {};
				}

				img.info = data.imageinfo == null ? null : object.extend( {
					x : 0,
					y : 0
				}, data.imageinfo );
				return img;
			}

			array.foreach( pageData.image, function ( data ) {
				if ( data.url == null && data.images == null ) {
					if ( data.imageinfo == null ) {
						fail = true;
					}
					return;
				}

				data = JSON.parse( JSON.stringify( data ) );
				var component = ComponentImage( data ),
					mask, frame, multiImage;

				components.push( component );

				if ( mask = data.mask ) {
					component.mask = ComponentImage( mask );
				}

				if ( frame = data.frame ) {
					component.frame = ComponentImage( frame )
				}

				if ( multiImage = data.images ) {
					component.multiImage = array.map( array.remove( multiImage, function ( src ) {
						return src == null;
					} ), function ( src ) {
						return ComponentImage( {
							url : src
						} );
					} );

					component.arrow = ComponentImage( {
						url : data.arrow || "http://cloudl7dev.b0.upaiyun.com/a7802fd8f506dffd01df67d06308ecf9mi01-arrow.png"
					} );
				}
			} );

			callback( object.extend( pageData, {
				label : newLabel,
				fail : fail,
				custom : object.extend( pageData.custom || {}, {
					label : pageData.label
				} ),
				componentImages : componentImages,
				components : components
			} ) );
		};
	} );

	exports.layCustom = layCustom;
} );