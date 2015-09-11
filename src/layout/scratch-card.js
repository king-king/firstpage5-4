/**
 * Created by 白 on 2014/11/3.
 * 刮刮卡板式
 */

plugin( function () {
	var array = imports( "array" ),
		$ = imports( "element" ),
		css = imports( "css" ),
		csa = imports( "css-animation" ),
		animation = imports( "animation" ),
		pointer = imports( "pointer" ),
		tips = imports( "../tips" ),
		Transform = imports( "../transform" ),
		Layout = imports( "../layout" ),
		Component = Layout.Component,
		layoutFormats = Layout.formats,
		Content = imports( "../content" ),
		ua = imports( "../ua" ),
		ui = imports( "../ui" ),
		Img = imports( "../img" );

	layoutFormats["scratch-card"] = {
		crossOrigin : true,
		create : function ( layout, ds, context ) {
			var cover504 = Transform.cover504( layout ),
				cw = layout.w,
				ch = layout.h,
				backImage = ds.image( 0 ),
				coverImage = ds.image( 1 ),
				canvas = Img.Canvas( cw, ch );

			function TransformCover( img ) {
				return Transform( {
					s : {w : img.fullWidth, h : img.fullHeight},
					d : layout,
					scale : Transform.scale.cover
				} );
			}

			Transform.drawImage( canvas.context, backImage, TransformCover( backImage ) );

			// 源图
			Component( Content.Canvas( canvas ), layout );

			// 刮图
			if ( !context.complete ) {
				var scratchTransform = TransformCover( coverImage ),
					scratchLayer = Img.Canvas( cw, ch ),
					gc = scratchLayer.context;

				Transform.drawImage( gc, coverImage, scratchTransform );
				Component( Content.Canvas( scratchLayer ), layout );

				layout.onShow( function () {
					var scratchTips = tips.Scratch( layout.element ),
						tipsHide = tips.hide();

					$( scratchLayer, {
						css : {
							position : "absolute",
							left : 0,
							top : 0,
							"z-index" : 1000,
							transform : "translateZ(10001px)"
						}
					}, layout.element );

					var line = [],
						pointerHandle = ui.onSwipeStart( scratchLayer, function ( event ) {
							var points = [], isIn = true;
							line.push( points );

							ui.preventDrag = true;

							points.push( {
								x : event.x,
								y : event.y
							} );

							pointer.onMoveUp( {
								onMove : function ( event ) {
									$.remove( scratchTips );
									points.push( {
										x : event.x,
										y : event.y
									} );
								},
								onUp : function () {
									isIn = false;
								}
							} );

							// 动画循环
							var animateHandle = animation.requestFrame( function () {
								Transform.drawImage( gc, coverImage, scratchTransform );
								gc.save();
								gc.lineCap = "round";
								gc.lineJoin = "round";

								gc.globalCompositeOperation = "destination-out";
								gc.beginPath();

								array.foreach( line, function ( points ) {
									array.foreach( points, function ( point, i ) {
										i === 0 ? gc.moveTo( point.x, point.y ) : gc.lineTo( point.x, point.y );
									} );

									gc.lineWidth = 50 * cover504.scale;
									if ( ua.android ) {
										scratchLayer.style.display = 'none';
										//noinspection BadExpressionStatementJS
										scratchLayer.offsetHeight;
										scratchLayer.style.display = 'inherit';
									}
									gc.stroke();
								} );
								gc.restore();

								if ( !isIn ) {
									var error = false;
									animateHandle.remove();

									try {
										// 抬起时判断是否划过了30%,划过后移除刮刮卡效果
										var imgData = gc.getImageData( 0, 0, scratchLayer.width, scratchLayer.height ),
											pixels = imgData.data, count = 0;

										for ( var i = 0, j = pixels.length; i < j; i += 4 ) {
											if ( pixels[i + 3] < 128 ) {
												++count;
											}
										}
									}
									catch ( e ) {
										error = true;
									}

									if ( error || count / ( pixels.length / 4 ) > 0.3 ) {
										pointerHandle.remove();

										// 淡出动画
										csa.runAnimation( [scratchLayer, {
											100 : {
												opacity : 0
											}
										}, 0.8], function () {
											// 移除层
											tipsHide.remove();
											context.complete = true;
											$.remove( scratchLayer );
										} );
									}
								}
							} );
						} );

					layout.onRemove( function () {
						tipsHide.remove();
						$.remove( scratchTips );
					} );
				} );
			}
		}
	};
} );