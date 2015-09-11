/**
 * Created by 白 on 2015/7/30.
 */

library( function () {
	var social = imports( "./social" ),
		array = imports( "array" ),
		ajax = imports( "ajax" ),
		$ = imports( "element" ),
		css = imports( "css" ),
		img = imports( "./img" ),
		ui = imports( "./ui" ),
		tips = imports( "./tips" ),
		string = imports( "string" ),
		async = imports( "async" ),
		object = imports( "object" ),
		z3d = imports( "3d-css" ),
		m3d = z3d.matrix,
		Vector = imports( "vector-2" ),
		Sphere = imports( "sphere" ),
		onDrag = imports( "pointer-drag" ),
		localResource = imports( "./local-resource" ),
		animation = imports( "animation" ),
		ua = imports( "./ua" );

	module.exports = function ( page, workId ) {
		var loading = $( tips.Loading(), page ),
			maxNumber = ua.iphone6 ? 30 : ua.iphone5 ? 25 : 20,
			size = document.documentElement.clientWidth >= 360 ? 36 : 30,
			fragmentBottom = 136,
			matrix = m3d.eye(),
			r = Math.min( document.documentElement.clientHeight - 136 - 80, document.documentElement.clientWidth - 60 ) / 2,
			isLike = false,
			likeNumber = 0,

			sphereData = JSON.parse( localResource( "sphere" ) || "null" ),
			tasks = [],
			likeList = null,
			background = $( "div", {
				css : object.extend( css.full(), {
					background : "rgba(0,0,0,0.88)"
				} )
			}, page ),
			topBar = $( "div", {
				css : {
					position : "absolute",
					left : 0,
					top : 0,
					right : 0,
					bottom : css.px( fragmentBottom )
				}
			}, page ),
			bottomBar = $( "div.hidden", {
				css : {
					position : "absolute",
					left : 0,
					height : css.px( fragmentBottom ),
					right : 0,
					bottom : 0
				}
			}, background ),
			fragmentWrapper = $( "div", {
				css : {
					perspective : "800px",
					"transform-style" : "preserve-3d",
					position : "absolute",
					left : "50%",
					top : "50%"
				}
			}, topBar ),
			likeIcon = img.Icon( "comment/like" ),
			likeButton = $( "div", {
				css : {
					position : "relative",
					display : "inline-block",
					height : "44px",
					width : "44px",
					"border-radius" : "22px",
					background : "white"
				}
			}, $( "div", {
				css : {
					position : "relative",
					"text-align" : "center"
				}
			}, bottomBar ) ),
			oLike = $( likeIcon, {
				css : object.extend( css.center( likeIcon.w ), css.middle( likeIcon.h ) )
			}, likeButton ),
			oLiking = $( img.Icon( "comment/liking" ), {
				css : object.extend( css.center( likeIcon.w ), css.middle( likeIcon.h ) )
			}, likeButton ),
			oLikeNumber = $( "div", {
				css : {
					"margin-top" : "10px",
					"font-size" : "14px",
					"text-align" : "center",
					"color" : "white"
				}
			}, bottomBar ),

			direction = [1, 0], speed = 0.3, inDrag = false;

		function setOutNumber( number ) {
			var o = page.parentNode ? page.parentNode.querySelector( ".like" ) : null;
			if ( o ) {
				o.innerHTML = number;
			}
			return number;
		}

		// 关闭按钮
		$( img.Icon( "comment/close" ), {
			css : {
				position : "absolute",
				right : "15px",
				top : "15px"
			}
		}, page );
		ui.onTap( $( "div", {
			css : {
				position : "absolute",
				right : 0,
				top : 0,
				width : "50px",
				height : "50px"
			}
		}, page ), function () {
			page.slideOut();
		} );

		// 获取球数据
		if ( sphereData == null ) {
			tasks.push( function ( callback ) {
				var xhr = ajax( {
					url : window.contentPath + "sphere.json"
				}, function () {
					sphereData = JSON.parse( xhr.responseText );
					localResource( "sphere", function () {
						return JSON.stringify( sphereData );
					} );
					callback();
				} );
			} );
		}

		// 获取赞数据
		tasks.push( function ( callback ) {
			social.request( "api/Comment/Like", {
				relateId : workId,
				take : maxNumber
			}, function ( err, result ) {
				likeList = result;
				callback();
			}, true );
		} );

		// 获取我的点赞数据
		tasks.push( function ( callback ) {
			social.request( "api/Total/Index", {
				relateId : workId,
				like : true
			}, function ( err, result ) {
				likeNumber = result.Like;
				isLike = result.IsLike;
				callback();
			}, true );
		} );

		async.concurrency( tasks, function () {
			var fragments = [];

			$.remove( loading );
			bottomBar.classList.remove( "hidden" );

			oLikeNumber.innerHTML = setOutNumber( likeNumber ) + ( isLike ? "已赞" : "赞" );

			if ( isLike ) {
				oLike.classList.add( "hidden" );
			}
			else {
				oLiking.classList.add( "hidden" );
			}

			function Fragment( likeItem, inFirst ) {
				var fragment = $( "div", {
						css : {
							position : "absolute",
							background : css.url( likeItem.User.HeadPhoto ),
							width : css.px( size ),
							height : css.px( size ),
							top : "-15px",
							left : "-15px",
							"background-size" : "cover"
						}
					}, fragmentWrapper ),
					tips = fragment.tips = $( "div", {
						css : {
							position : "absolute",
							display : "inline-block",
							background : "rgba(255,255,255,0.85)",
							height : "26px",
							padding : "0 10px",
							"line-height" : "26px",
							"font-size" : "12px",
							"border-radius" : "2px",
							"transform-origin" : "50% 31px",
							top : "-35px"
						},
						children : [
							$( "div", {
								css : {
									"max-width" : "150px",
									overflow : "hidden",
									"white-space" : "nowrap",
									"text-overflow" : "ellipsis"
								},
								innerHTML : likeItem.User.Nickname
							} ),
							$( "div", {
								css : {
									position : "absolute",
									top : "100%",
									left : "50%",
									"margin-left" : "-3px",
									"border-top" : "rgba(255, 255, 255, 0.85) 5px solid",
									"border-left" : "transparent 3px solid",
									"border-right" : "transparent 3px solid"
								}
							} )
						]
					}, fragment );

				tips.show = function ( ratio ) {
					css.transform( tips, css.scale( Math.max( 0.001, ratio ) ) );
				};

				tips.show( 0 );

				$.onInsert( tips, function () {
					css( tips, "left", css.px( ( fragment.offsetWidth - tips.offsetWidth ) / 2 << 0 ) );
				} );

				inFirst ? fragments.unshift( fragment ) : fragments.push( fragment );
				return fragment;
			}

			array.foreach( likeList, function ( likeData ) {
				Fragment( likeData );
			} );

			function setPosition() {
				array.foreach( fragments, function ( fragment, i ) {
					var data = sphereData[Math.max( fragments.length, 4 )];
					fragment.position = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2], 1];
				} );
			}

			function setStyle() {
				array.foreach( fragments, function ( fragment ) {
					var tips = fragment.tips,
						p = z3d.transform( matrix, fragment.position );

					function tipsAnimation( enlarge ) {
						if ( tips.animation ) {
							tips.animation.remove();
						}
						tips.animation = animation.requestFrames( {
							duration : 0.3,
							onAnimate : function ( ratio ) {
								tips.show( enlarge ? ratio : 1 - ratio );
							},
							onEnd : function () {
								tips.animation = null;
							}
						} );
						fragment.isIn = enlarge;
					}

					if ( !inDrag ) {
						if ( !fragment.isIn && p[2] > 0.77 ) {
							tipsAnimation( true );
						}
						else if ( fragment.isIn && p[2] < 0.77 ) {
							tipsAnimation( false );
						}
					}

					css.transform( fragment, css.translate( p[0] * r, p[1] * r, p[2] * r ),
						css.rotateY( Sphere.lng( p ) / Math.PI * 180 ),
						css.rotateX( Sphere.lat( p ) / Math.PI * 180 ) );
				} );
			}

			ui.onPointerDown( topBar, function () {
				if ( !inDrag ) {
					inDrag = true;
					array.foreach( fragments, function ( fragment ) {
						var tips = fragment.tips;

						if ( tips.animation ) {
							tips.animation.remove();
						}
						tips.animation = null;
						fragment.isIn = false;
						tips.show( 0 );
					} );

					onDrag( {
						onMove : function ( event ) {
							var move = direction = [event.dX, event.dY],
								vertical = Vector.vertical( move );

							matrix = z3d.combine( m3d.rotate( [vertical[0], vertical[1], 0], Vector.cross( move, vertical ) * Vector.norm( move ) / 75 ), matrix );
							setStyle();
						},
						onUp : function ( event ) {
							speed = Vector.norm( [event.speedX, event.speedY] ) * 2;
							inDrag = false;
						}
					} );
				}
			} );

			var animationHandle = animation.requestFrame( function () {
				if ( !inDrag ) {
					speed += ( 0.5 - speed ) / 30;
					var vertical = Vector.vertical( direction );
					matrix = z3d.combine( m3d.rotate( [vertical[0], vertical[1], 0], Vector.cross( direction, vertical ) * speed / 75 ), matrix );
					setStyle();
				}
			} );

			ui.onTap( likeButton, function () {
				if ( !inDrag && !isLike ) {
					var loading = $( tips.LoadingButton(), likeButton.parentNode );
					likeButton.classList.add( "hidden" );

					social.request( "api/Comment/Add", {
						RelateId : workId,
						Type : 1
					}, function ( err, data ) {
						if ( err == null ) {
							inDrag = isLike = true;

							// 碎片添加动画
							$( Fragment( data, true ), {
								css : {
									transform : "scale(0.01)"
								}
							} );
							array.foreach( fragments, function ( fragment ) {
								css( fragment, "transition", "0.3s" );
							} );
							setTimeout( function () {
								matrix = m3d.eye();
								setPosition();
								setStyle();

								setTimeout( function () {
									array.foreach( fragments, function ( fragment ) {
										css.remove( fragment, "transition" );
										inDrag = false;
									} );
								}, 350 );
							}, 20 );

							// 更新点赞数量
							oLikeNumber.innerHTML = setOutNumber( likeNumber + 1 ) + "已赞";

							// 移除加载,更新按钮状态
							$.remove( loading );
							likeButton.classList.remove( "hidden" );
							oLike.classList.add( "hidden" );
							oLiking.classList.remove( "hidden" );
						}
						else {
							ui.alert( "出错了,请重试" );
						}
					} );
				}
			} );

			setPosition();
			setStyle();

			page.onSlideOut && page.onSlideOut( function () {
				animationHandle.remove();
			} );
		} );
	};
} );