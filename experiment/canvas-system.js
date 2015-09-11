/**
 * Created by 白 on 2015/8/13.
 */

library( function () {
	var draw = imports( "canvas" ),
		$ = imports( "element" );

	module.exports = function CanvasSystem( main ) {
		var canvasSystem = draw.CanvasSystem( main ),
			onMouseDown = draw.DOMEvent( canvasSystem, "mousedown" ),
			onMouseUp = draw.DOMEvent( canvasSystem, "mouseup" ),
			onMouseWheel = draw.DOMEvent( canvasSystem, "mousewheel" );

		$.bind( window, "resize", function () {
			canvasSystem.dirty();
		} );

		return {
			dirty : canvasSystem.dirty,
			onMouseDown : onMouseDown,
			onMouseUp : onMouseUp,
			onMouseWheel : onMouseWheel
		};
	}
} );