/**
 * Created by Zuobai on 2014/7/12.
 * zachCanvas 2d GUI系统
 */

library( function () {
	// 引入
	var object = imports( "object" ),
		insert = object.insert,
		z2d = imports( "2d" ),
		pointer = imports( "pointer" ),
		$ = imports( "element" ),
		css = imports( "css" ),
		matrix = z2d.matrix,
		combine = z2d.combine,
		async = imports( "async" ),
		LinkedList = imports( "linked-list" );

	// 强化版gc
	function Context2D( gc ) {
		var prepare = [1, 0, 0, 1, 0, 0],
			cur = [1, 0, 0, 1, 0, 0],
			transformStack = [];

		// 设置矩阵
		function s() {
			var r = combine( prepare, cur );
			gc.setTransform( r[0], r[1], r[2], r[3], r[4], r[5] );
		}

		// 在当前基础上进行转换
		function t( m ) {
			cur = combine( cur, m );
			s();
		}

		// 几个经典转换
		function ClassicTransform( genFunc ) {
			return function () {
				t( genFunc.apply( null, arguments ) );
			}
		}

		return insert( gc, {
			// 该方法用于设置一个预矩阵,解决dpr变换
			setPrepareTransform : function ( m ) {
				prepare = m;
				s();
			},
			transform : function () {
				t( arguments );
			},
			getTransform : function () {
				return [cur[0], cur[1], cur[2], cur[3], cur[4], cur[5]];
			},
			save : function () {
				CanvasRenderingContext2D.prototype.save.call( gc );
				transformStack.push( cur );
			},
			restore : function () {
				CanvasRenderingContext2D.prototype.restore.call( gc );
				cur = transformStack.pop();
				s();
			},
			translate : ClassicTransform( matrix.translate ),
			rotate : ClassicTransform( matrix.rotate ),
			scale : ClassicTransform( matrix.scale )
		} );
	}

	function CanvasSystem( main ) {
		var canvas = $( "canvas", {
				css : {
					position : "absolute",
					left : 0,
					top : 0
				},
				width : screen.width,
				height : screen.height
			}, $( document.body, {
				css : {
					overflow : "hidden"
				}
			} ) ),
			gc = Context2D( canvas.getContext( "2d" ) ),
			isDirty = true,

			taskList = LinkedList(),

			point = null;

		function dirty() {
			isDirty = true;
		}

		$.bind( document, "mouseout", function () {
			point = null;
			dirty();
		} );

		pointer.onPointerMove( document, function ( event ) {
			event.preventDefault();
			point = {
				x : event.x,
				y : event.y
			};
			dirty();
		} );

		object.defineAutoProperty( gc, "cursor", {
			value : "default",
			set : function ( value ) {
				css( canvas, "cursor", value );
			}
		} );

		requestAnimationFrame( function draw() {
			if ( isDirty ) {
				isDirty = false;
				LinkedList.foreach( taskList, function ( task ) {
					task.remove();
				} );
				gc.clearRect( 0, 0, canvas.width, canvas.height );
				main( gc, point );
			}
			requestAnimationFrame( draw );
		} );

		return {
			dirty : dirty,
			bind : function ( event ) {
				return function ( task ) {
					var handle = event.regist( task ),
						node = taskList.insert( handle, null );

					return {
						remove : function () {
							handle.remove();
							taskList.remove( node );
						}
					};
				};
			}
		};
	}

	function draw( gc, area, p ) {
		var ap;
		p = p && area.isIn && area.isIn.apply( null, ap = z2d.transform( z2d.inverse( gc.getTransform() ), [p.x, p.y, 1] ) ) ? {
			areaX : ap[0],
			areaY : ap[1],
			x : p.x,
			y : p.y
		} : null;
		area.draw( gc, p );
		return p;
	}

	function DOMEvent( canvasSystem, eventName ) {
		var event = async.Event();
		$.bind( document, eventName, function ( e ) {
			event.trig( e );
		} );
		return canvasSystem.bind( event );
	}

	draw.DOMEvent = DOMEvent;
	draw.CanvasSystem = CanvasSystem;
	module.exports = draw;
} );