/**
 * Created by 白 on 2015/8/7.
 */

library( function () {
	var array = imports( "array" );

	function align( outer, inner, align ) {
		return ( outer - inner ) * align;
	}

	function cover( s, t ) {
		return Math.max( t.width / s.width, t.height / s.height );
	}

	function contain( s, t ) {
		return Math.min( t.width / s.width, t.height / s.height );
	}

	function clipImage( s, t, scale, alignX, alignY ) {
		function clip( sourceSize, targetSize, a ) {
			var offset = align( targetSize, sourceSize * scale, a );
			return offset > 0 ? [0, sourceSize, offset, sourceSize * scale] : [-offset / scale, targetSize / scale, 0, targetSize];
		}

		return array.zip( [clip( s.width, t.width, alignX ), clip( s.height, t.height, alignY )] );
	}

	exports.align = align;
	exports.clipImage = clipImage;
	exports.scale = {
		cover : cover,
		contain : contain
	};
} );