/**
 * Created by 白 on 2015/7/14.
 */

library( function () {
	var switchAnimations = {},
		css = imports( "css" ),
		csa = imports( "css-animation" ),
		func = imports( "function" ),
		$ = imports( "element" ),
		array = imports( "array" ),

		Img = imports( "./img" ),
		ua = imports( "./ua" ),
		px = css.px;

	function Fragment( parent, targetCanvas, x, y, width, height, zi ) {
		var canvas = Img.Canvas( width, height ),
			gc = canvas.context,
			dpr = canvas.dpr;

		gc.drawImage( targetCanvas, x * dpr, y * dpr, width * dpr, height * dpr, 0, 0, width, height );
		css( canvas, {
			"backface-visibility" : "hidden",
			position : "absolute",
			left : px( x ),
			top : px( y ),
			"z-index" : zi || 0
		} );
		parent.appendChild( canvas );
		return canvas;
	}

	// 渐变
	switchAnimations.fade = function ( parent, curPage, newPage, callback, duration ) {
		duration = duration || 0.8;
		parent.appendChild( newPage );

		return csa.runAnimation( [
			[curPage, {
				100 : {
					opacity : 0
				}
			}, duration, 0, "linear"],
			[newPage, {
				0 : {
					opacity : 0
				}
			}, duration, 0, "linear"]
		], callback );
	};

	// 经典
	switchAnimations.classic = function ( parent, curPage, newPage, callback ) {
		parent.appendChild( newPage );
		return csa.runAnimation( [
			[curPage, {
				100 : {
					transform : "translate3d(0, -30%, 0) scale(0.5)"
				}
			}, 0.8, 0],
			[newPage, {
				0 : {
					transform : "translate3d(0, 100%, 0)"
				}
			}, 0.8, 0]
		], callback );
	};

	// 推
	switchAnimations.push = function ( parent, curPage, newPage, callback, duration ) {
		duration = duration || 0.8;
		parent.appendChild( newPage );

		return csa.runAnimation( [
			[curPage, {
				100 : {
					transform : "translate3d(0, -100%, 0)"
				}
			}, duration, "ease-in-out", 0],
			[newPage, {
				0 : {
					transform : "translate3d(0, 100%, 0)"
				}
			}, duration, "ease-in-out", 0]
		], callback );
	};

	// 后退
	switchAnimations.back = function ( parent, curPage, newPage, callback, duration ) {
		duration = duration || 0.5;
		parent.appendChild( newPage );

		return csa.runAnimation( [
			[curPage, {
				100 : {
					transform : "translate3d(0, 100%, 0)"
				}
			}, duration, "ease-in-out", 0],
			[newPage, {
				0 : {
					transform : "translate3d(0, -100%, 0)"
				}
			}, duration, "ease-in-out", 0]
		], callback );
	};

	// 揭开
	switchAnimations.uncover = function ( parent, curPage, newPage, callback ) {
		css( curPage, "z-index", 100 );
		parent.appendChild( newPage );

		return csa.runAnimation( [
			[curPage, {
				100 : {
					transform : "translate3d(0, -100%, 0)"
				}
			}, 0.8, 0]
		], callback );
	};

	// 立方体
	switchAnimations.cube = function ( parent, curPage, newPage, callback ) {
		parent.appendChild( newPage );

		var cssHandle = css( parent, {
			perspective : 1000
		} );

		return csa.runAnimation( [
			[curPage, {
				0 : {
					"transform-origin" : "50% 100%",
					"z-index" : 2
				},
				100 : {
					"transform-origin" : "50% 100%",
					transform : "translate3d(0, -100%, 0) rotateX(90deg)",
					"z-index" : 0
				}
			}, 1, 0, "linear"],
			[newPage, {
				0 : {
					"transform-origin" : "50% 0%",
					transform : "translate3d(0, 100%, 0) rotateX(-90deg)",
					"z-index" : 0
				},
				100 : {
					"transform-origin" : "50% 0%",
					"z-index" : 1
				}
			}, 1, 0, "linear"]
		], function () {
			cssHandle.remove();
			callback && callback();
		} );
	};

	// 翻转
	switchAnimations.overturn = function ( parent, curPage, newPage, callback ) {
		parent.appendChild( newPage );

		var cssHandle = css( parent, {
			perspective : 1000
		} );

		return csa.runAnimation( [
			[curPage, {
				0 : {
					"transform-origin" : "0 50%",
					"z-index" : 2
				},
				50 : {
					"transform-origin" : "0 50%",
					transform : "translate3d(50%, 0, 100px) rotateY(90deg)",
					"z-index" : 1
				},
				100 : {
					"transform-origin" : "0 50%",
					transform : "translate3d(100%, 0, 0) rotateY(180deg)",
					"z-index" : 0
				}
			}, 1, 0, "linear"],
			[newPage, {
				0 : {
					"transform-origin" : "100% 50%",
					transform : "translate3d(-100%, 0, 0) rotateY(180deg)",
					"z-index" : 0
				},
				50 : {
					"transform-origin" : "100% 50%",
					transform : "translate3d(-50%, 0, 100px) rotateY(270deg)",
					"z-index" : 0.5
				},
				100 : {
					"transform-origin" : "100% 50%",
					transform : "translate3d(0, 0, 0) rotateY(360deg)",
					"z-index" : 1
				}
			}, 1, 0, "linear"]
		], function () {
			cssHandle.remove();
			callback && callback();
		} );
	};

	// 切换
	switchAnimations["switch"] = function ( parent, curPage, newPage, callback ) {
		parent.appendChild( newPage );

		var cssHandle = css( parent, {
			perspective : 1000
		} );

		return csa.runAnimation( [
			[curPage, {
				0 : {
					"transform-origin" : "100% 50%",
					"z-index" : 2
				},
				50 : {
					"transform-origin" : "100% 50%",
					transform : "translate3d(50%, 0, 0) rotateY(-30deg)",
					"z-index" : 1
				},
				100 : {
					"transform-origin" : "100% 50%",
					transform : "translate3d(0, 0, -130px)",
					"z-index" : 0
				}
			}, 1, 0, "linear"],
			[newPage, {
				0 : {
					"transform-origin" : "0 50%",
					transform : "translate3d(0, 0, -130px)",
					"z-index" : 0
				},
				50 : {
					"transform-origin" : "0 50%",
					transform : "translate3d(-50%, 0, 0) rotateY(30deg)",
					"z-index" : 0.5
				},
				100 : {
					"transform-origin" : "0 50%",
					"z-index" : 1
				}
			}, 1, 0, "linear"]
		], function () {
			cssHandle.remove();
			callback && callback();
		} );
	};

	// 梳理
	switchAnimations.tease = function ( parent, curPage, newPage, callback ) {
		var height = curPage.h,
			width = curPage.w,
			curCanvas = curPage.toCanvas(),
			partHeight = height / 8 << 0,
			animates = [];

		$.remove( curPage );
		parent.appendChild( newPage );

		func.loop( 8, function ( i ) {
			var thisHeight = i === 7 ? height - partHeight * 7 : partHeight,
				thisTop = i === 7 ? height - thisHeight : thisHeight * i,
				j = 7 - i;

			animates.push( [
				Fragment( parent, curCanvas, 0, thisTop, width, thisHeight, 1 ),
				j % 2 === 0 ? {
					100 : {
						transform : "translate3d(-100%, 0, 0)"
					}
				} : {
					100 : {
						transform : "translate3d(100%, 0, 0)"
					}
				}, 0.3, j * 0.1, "linear"
			] );
		} );

		return csa.runAnimation( animates, function () {
			array.foreach( animates, function ( animate ) {
				$.remove( animate[0] );
			} );
			callback && callback();
		} );
	};

	// 门
	switchAnimations.door = function ( parent, curPage, newPage, callback ) {
		var w = curPage.w,
			h = curPage.h,
			curCanvas = curPage.toCanvas(),
			cssHandle = css( parent, {
				perspective : 1000
			} ),
			doors = [];

		$.remove( curPage );
		parent.appendChild( newPage );
		array.foreach( [0, 0.5], function ( rx ) {
			doors.push( Fragment( parent, curCanvas, rx * w, 0, w / 2, h, 1 ) );
		} );

		return csa.runAnimation( [
			[doors[0], {
				100 : {
					transform : "translate3d(-100%, 0, 0)",
					opacity : 0.4
				}
			}, 0.8, 0],
			[doors[1], {
				100 : {
					transform : "translate3d(100%, 0, 0)",
					opacity : 0.4
				}
			}, 0.8, 0],
			[newPage, {
				0 : {
					transform : "translate3d(0, 0, -1400px)"
				}
			}, 0.8, 0]
		], function () {
			cssHandle.remove();
			array.foreach( doors, function ( door ) {
				$.remove( door );
			} );
			callback && callback();
		} );
	};
	switchAnimations.door.highPerformance = true;

	// 翻页
	switchAnimations.flipOver = function ( parent, curPage, newPage, callback ) {
		var width = curPage.w,
			height = curPage.h,
			curCanvas = curPage.toCanvas(),
			newCanvas = newPage.toCanvas(),
			cssHandle = css( parent, {
				perspective : 1000
			} ),
			curTop = Fragment( parent, curCanvas, 0, 0, width, height / 2, 1 ),
			curBottom = Fragment( parent, curCanvas, 0, height / 2, width, height / 2, 1 ),
			newTop = Fragment( parent, newCanvas, 0, 0, width, height / 2, 2 ),
			newBottom = Fragment( parent, newCanvas, 0, height / 2, width, height / 2, 0 );

		$.remove( curPage );

		return csa.runAnimation( [
			[curBottom, {
				0 : {
					"transform-origin" : "50% 0",
					"z-index" : 3
				},
				100 : {
					"transform-origin" : "50% 0",
					transform : "rotateX(180deg)",
					"z-index" : 1
				}
			}, 0.8, 0],
			[newTop, {
				0 : {
					"transform-origin" : "50% 100%",
					transform : "rotateX(-180deg)",
					"z-index" : 1
				},
				100 : {
					"transform-origin" : "50% 100%",
					transform : "rotateX(0deg)",
					"z-index" : 2
				}
			}, 0.8, 0]
		], function () {
			cssHandle.remove();
			array.foreach( [curTop, curBottom, newTop, newBottom], function ( fragment ) {
				$.remove( fragment );
			} );
			callback && callback();
		} );
	};
	switchAnimations.flipOver.highPerformance = true;

	// 棋盘
	switchAnimations.chessboard = function ( parent, curPage, newPage, callback ) {
		var w = curPage.w,
			h = curPage.h,
			curCanvas = curPage.toCanvas(),
			newCanvas = newPage.toCanvas(),
			cssHandle = css( parent, {
				perspective : 1000
			} ),

			numX = ua.ios ? 4 : 2, numY = ua.ios ? 5 : 3, t,
			animates = [],
			left = 0;

		$.remove( curPage );

		if ( w > h ) {
			t = numX;
			numX = numY;
			numY = t;
		}

		// 制作碎片
		func.loop( numX, function ( i ) {
			var right = ( i + 1 ) / numX * w << 0,
				top = 0;

			func.loop( numY, function ( j ) {
				var bottom = ( j + 1 ) / numY * h << 0,
					width = right - left,
					height = bottom - top,
					delay = 0.8 / numX * i + Math.random() * 0.4;

				func.loop( 2, function ( n ) {
					animates.push( [
						Fragment( parent, n === 0 ? curCanvas : newCanvas, left, top, width, height, 2 - n ),
						n === 0 ? {
							0 : {
								"z-index" : 2
							},
							100 : {
								transform : "rotateY(180deg)",
								"z-index" : 0
							}
						} : {
							0 : {
								transform : "rotateY(180deg)",
								"z-index" : 0
							},
							100 : {
								transform : "rotateY(360deg)",
								"z-index" : 1
							}
						},
						0.8, delay, "linear"
					] );
				} );

				top = bottom;
			} );

			left = right;
		} );

		return csa.runAnimation( animates, function () {
			cssHandle.remove();
			array.foreach( animates, function ( animate ) {
				$.remove( animate[0] );
			} );
			callback && callback();
		} );
	};
	switchAnimations.chessboard.highPerformance = true;

	module.exports = switchAnimations;
} );