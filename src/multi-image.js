/**
 * Created by 白 on 2015/3/18.
 * 多图组件
 */

library( function () {
	var math = imports( "math" ),
		css = imports( "css" ),
		csa = imports( "css-animation" ),
		array = imports( "array" ),
		animation = imports( "animation" ),
		$ = imports( "element" ),

		ui = imports( "./ui" ),
		p = imports( "./position" ),
		Layout = imports( "./layout" ),
		ua = imports( "./ua" );

	function applyAnimation( arg, enterDelay ) {
		var last = {
			duration : 0,
			delay : 0
		};

		array.foreach( arg.images, function ( image, i ) {
			last = image.enter = {
				duration : 0.6,
				delay : enterDelay + i * 0.3,
				progress : {
					"0" : {
						rotate : -30,
						scale : !ua.ios && !ua.iphone6 ? 1 : 3,
						x : -arg.w * 2.4,
						y : arg.h * 2.4
					}
				}
			};
		} );

		return last.duration + last.delay;
	}

	function MultiImage( arg ) {
		var layout = arg.layout,
			body = layout.element,
			parent = arg.parent,
			images = arg.images,
			len = images.length,

			enterDelay = arg.delay || 0,
			deg = arg.sign * Math.min( 25 / len, 4 ),
			arrowIcon = arg.arrow,

			width = parent.w,
			height = parent.h,

			duration = math.range( 3 / len, 0.08, 0.6 ),
			delay = math.range( 1.5 / len, 0.04, 0.3 );

		array.foreach( images, function ( image, i ) {
			image.x = p.center( image, parent, true );
			image.y = p.middle( image, parent, true );
			image.zi = 10000 + i;
			image.rotate = ( i + 1 - len ) * deg;
			image.appendTo( parent );
		} );

		if ( arg.animation !== false ) {
			applyAnimation( {
				images : images,
				w : width,
				h : height
			}, enterDelay );
		}

		layout.onEnterEnd( function () {
			var curTopIndex = len - 1,
				resetHandles = null,
				flyHandle = null;

			function fly( direction ) {
				var lock = ui.Lock(),
					flyIndex = curTopIndex--,
					flyImage = images[( flyIndex % len + len ) % len];

				// 移除重置动画
				if ( resetHandles ) {
					resetHandles = null;
				}

				flyHandle = Layout.transition( flyImage, {
					end : {
						x : ( direction ? layout.w : -flyImage.w ),
						opacity : 0
					},
					duration : 0.3,
					onEnd : function () {
						flyHandle = null;
						flyImage.x = p.center( flyImage, parent, true );
						flyImage.opacity = 1;
						flyImage.zi -= len;
						flyImage.rotate = ( 1 - len ) * deg;

						// 启动重制动画
						resetHandles = array.map( images, function ( image, pos ) {
							var bottomImage = images[( ( flyIndex + pos ) % len + len ) % len];
							return Layout.transition( bottomImage, {
								end : {
									rotate : ( pos + 1 - len ) * deg
								},
								timing : animation.Timing.easeOut,
								delay : delay * pos / 2,
								duration : duration / 2
							} );
						} );

						lock.remove();
					}
				} );
			}

			// 滑动动画
			ui.onSwipeStart( parent.element, function ( event ) {
				event.xOut && fly( event.dX > 0 );
			} );

			// 显示箭头
			if ( arrowIcon ) {
				css( prev, "opacity", 1 );
				css( next, "opacity", 1 );
			}

			// 结束时快进动画
			layout.onRemove( function () {
				flyHandle && flyHandle.fastForward();
				if ( resetHandles ) {
					array.foreach( resetHandles, function ( animation ) {
						animation.fastForward();
					} );
					resetHandles = null;
				}
			} );
		} );

		if ( arrowIcon ) {
			var prev = $( arrowIcon, {
					css : {
						width : css.px( arrowIcon.w ),
						height : css.px( arrowIcon.h )
					}
				} ), next = arrowIcon.cloneNode( true ),
				offset = arrowIcon.offset || 15;

			function guideAnimation( sign ) {
				function pos( x ) {
					return {
						transform : [css.scale( sign, 1 ), css.translate( x, 0, 0 )].join( " " )
					};
				}

				return csa.animation( [{
					0 : pos( 0 ),
					20 : pos( 0 ),
					35 : pos( 12 ),
					50 : pos( -20 ),
					65 : pos( 0 ),
					80 : pos( -12 ),
					100 : pos( 0 )
				}, 1.5, "infinite"] );
			}

			array.foreach( [prev, next], function ( arrow ) {
				css( arrow, {
					visibility : "visible",
					"z-index" : 10000,
					opacity : 0,
					transition : "0.8s"
				} );
			} );

			layout.onShow( function () {
				css( prev, {
					position : "absolute",
					left : css.px( p.leftIn( prev, layout ) + offset ),
					top : css.px( p.middle( prev, parent ) ),
					animation : guideAnimation( 1 )
				} );

				css( next, {
					position : "absolute",
					left : css.px( p.rightIn( prev, layout, true ) - offset ),
					top : css.px( p.middle( prev, parent ) ),
					animation : guideAnimation( -1 )
				} );

				body.appendChild( prev );
				body.appendChild( next );
			} );

			layout.onRemove( function () {
				$.remove( prev );
				$.remove( next );
			} );
		}
	}

	MultiImage.applyAnimation = applyAnimation;
	module.exports = MultiImage;
} );