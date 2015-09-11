/**
 * Created by 白 on 2015/6/10.
 * 全局函数
 */

library( function () {
	var $ = imports( "element" ),
		object = imports( "object" ),
		pointer = imports( "pointer.js" ),
		async = imports( "async" ),
		array = imports( "array" ),
		css = imports( "css" ),

		ua = imports( "./ua" ),

		outRange = ua.chuye ? 5 : 8,
		tapTrig = false,
		longPressDuration = 500,
		inDown = 0,
		removeHandles = [],

		onMoveUp = pointer.onMoveUp,
		onPointerMove = pointer.onPointerMove,
		onPointerUp = pointer.onPointerUp,

		ui = {},
		alert,
		preventBodyEvent = false,
		preventDrag = false;

	// 全局屏蔽默认事件,如果某节点需要默认事件,加类.need-default
	pointer.onPointerDown( document, function ( event ) {
		var prevent = true;
		$.bubble( event.origin.target, function ( node ) {
			if ( node.classList.contains( "need-default" ) ) {
				prevent = false;
			}
		} );

		if ( inDown === 0 ) {
			inDown = 1;
		}
		else if ( inDown === 1 ) {
			inDown = 2;
		}

		prevent && event.preventDefault();
	}, true );

	onPointerUp( document, function () {
		array.foreach( removeHandles, function ( removeHandle ) {
			removeHandle.remove();
		} );
		inDown = 0;
		removeHandles = [];
	}, true );

	function onPointerDown( el, response ) {
		el.style && css( el, "pointer-events", "auto" );
		return pointer.onPointerDown( el, function ( event ) {
			var removeHandle = $.bind( event.origin.target, "DOMNodeRemovedFromDocument", function () {
				removeHandle.remove();
				inDown = 0;
			} );
			removeHandles.push( removeHandle );

			if ( inDown !== 2 ) {
				response( event );
			}
		} );
	}

	function PointerTrack() {
		var dX = 0,
			dY = 0,
			info = {
				track : function ( event ) {
					dX += event.dX;
					dY += event.dY;

					var x = Math.abs( dX ) > outRange,
						y = Math.abs( dY ) > outRange;

					info.dX = dX;
					info.dY = dY;
					info.xOut = x;
					info.yOut = y;
					info.out = x || y;
				}
			};

		return info;
	}

	function onSwipe( response, hasTimeout ) {
		var pointerTrack = PointerTrack(),
			checkHandle = onMoveUp( {
				onMove : function ( event ) {
					pointerTrack.track( event );
					if ( pointerTrack.out ) {
						checkHandle.remove();
						response && response( {
							xOut : pointerTrack.xOut,
							yOut : pointerTrack.yOut,
							dX : pointerTrack.dX,
							dY : pointerTrack.dY
						} );
					}
				},
				onUp : function () {
					timeout && clearTimeout( timeout );
				}
			} ),
			timeout = hasTimeout ? null : setTimeout( function () {
				inDown = 0;
				checkHandle.remove();
			}, longPressDuration );

		return {
			remove : function () {
				checkHandle.remove();
				timeout && clearTimeout( timeout );
			}
		};
	}

	function onSwipeStart( el, response ) {
		return onPointerDown( el, function () {
			onSwipe( response );
		} );
	}

	onPointerUp( document, function () {
		tapTrig = false;
		preventBodyEvent = false;
		preventDrag = false;
	} );

	function onTapUp( response ) {
		var pointerTrack = PointerTrack(),

			tapHandle = onPointerUp( document.documentElement, function ( event ) {
				if ( !tapTrig ) {
					response && response( event );
					tapTrig = true;
				}
			} ),

			timeout = setTimeout( function () {
				tapHandle.remove();
				checkHandle.remove();
			}, longPressDuration ),

			checkHandle = onMoveUp( {
				onMove : function ( event ) {
					pointerTrack.track( event );
					if ( pointerTrack.out ) {
						clear();
					}
				},
				onUp : clear
			} );

		function clear() {
			checkHandle.remove();
			clearTimeout( timeout );
			tapHandle.remove();
		}

		return {
			remove : clear
		};
	}

	function onTap( el, response ) {
		return onPointerDown( el, function () {
			onTapUp( response );
		} );
	}

	function onLongPress( response ) {
		var pointerTrack = PointerTrack(),

			timeout = setTimeout( function () {
				checkHandle.remove();
				response && response();
			}, longPressDuration ),
			checkHandle = onMoveUp( {
				onMove : function ( event ) {
					pointerTrack.track( event );
					if ( pointerTrack.out ) {
						clear();
					}
				},
				onUp : clear
			} );

		function clear() {
			checkHandle.remove();
			clearTimeout( timeout );
		}

		return {
			remove : clear
		};
	}

	// 锁定屏幕,不接受鼠标动作
	function Lock( el ) {
		el = el || document.documentElement;
		el.classList.add( "lock" );

		return {
			remove : function () {
				el.classList.remove( "lock" );
			}
		};
	}

	// 弹出消息
	alert = function () {
		var msgBox, msg;

		return function ( text, delay ) {
			// 第一次弹出消息时创建消息框
			if ( !msgBox ) {
				msgBox = $( "div.msg-box", {
					css : {
						transform : ua.chuyeList ? "translate3d(0,50%,0)" : undefined,
						bottom : ua.chuyeList ? "50%" : css.px( 40 )
					}
				}, document.body );
				msg = $( "div.msg", msgBox );
			}

			msg.innerHTML = text;
			$.classList( msgBox ).remove( "remove" ).add( "show" );

			async.once( function () {
				$.classList( msgBox ).add( "remove" ).remove( "show" );
			}, function ( removeMsg ) {
				return [onPointerDown( document, removeMsg ), async.setTimeout( removeMsg, delay || 2000 )];
			} );
		};
	}();

	Object.defineProperties( ui, {
		preventBodyEvent : {
			get : function () {
				return preventBodyEvent
			},
			set : function ( val ) {
				preventBodyEvent = val;
			}
		},
		preventDrag : {
			get : function () {
				return preventDrag;
			},
			set : function ( val ) {
				preventDrag = val;
			}
		}
	} );

	// 焦点时设置focus类
	$.onBubble( "focusin", function ( node ) {
		node.classList.add( "focus" );
	} );
	$.onBubble( "focusout", function ( node ) {
		node.classList.remove( "focus" );
	} );

	module.exports = object.insert( ui, {
		onPointerDown : onPointerDown,
		onPointerMove : onPointerMove,
		onPointerUp : onPointerUp,
		onMoveUp : onMoveUp,
		onSwipeStart : onSwipeStart,
		onSwipe : onSwipe,
		onLongPress : onLongPress,
		onTap : onTap,
		onTapUp : onTapUp,

		alert : alert,
		Lock : Lock
	} );
} );