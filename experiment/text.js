/**
 * Created by 白 on 2015/7/28.
 */

library( function () {
	var textViewer = imports( "text-viewer" ),
		math = imports( "math" );

	function Label( text, style ) {
		var width = textViewer.measureText( text, style ).width;

		return {
			width : width,
			draw : function ( gc ) {
				gc.textBaseline = "top";
				gc.font = textViewer.Font( style );
				gc.fillStyle = style.color || "black";
				gc.fillText( text, 0, 0 );
			}
		};
	}

	exports.Label = Label;
} );