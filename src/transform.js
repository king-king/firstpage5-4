/**
 * Created by 白 on 2015/7/14.
 */

library( function () {
	var object = imports( "object" ),
		css = imports( "css" ),
		z2d = imports( "2d" ),
		m2d = z2d.matrix,
		ua = imports( "./ua" ),
		array = imports( "array" ),

		rect568 = {w : 320, h : 568},
		rect504 = {w : 320, h : 504};

	function transform( arg ) {
		var s = arg.s, d = arg.d,
			sWidth = s.w, sHeight = s.h,
			dWidth = d.w, dHeight = d.h,
			scale = arg.scale( sWidth, sHeight, dWidth, dHeight ),
			x = ( dWidth - sWidth * scale ) * ( arg.x || 0.5 ),
			y = ( dHeight - sHeight * scale ) * ( arg.y || 0.5 ),
			matrix = z2d.combine( m2d.translate( x, y ), m2d.scale( scale, scale ) );

		function clip( dSize, size, align ) {
			var offset = ( dSize - size * scale ) * align;
			return offset > 0 ? [0, size, offset, size * scale] : [-offset / scale, dSize / scale, 0, dSize];
		}

		return {
			x : x,
			y : y,
			w : dWidth,
			h : dHeight,
			tw : sWidth * scale,
			th : sHeight * scale,
			scale : scale,
			matrix : matrix,
			draw : array.zip( [clip( dWidth, sWidth, arg.x || 0.5 ), clip( dHeight, sHeight, arg.y || 0.5 )] )
		};
	}

	function drawImage( gc, image, l ) {
		var scale = l.scale, draw = l.draw,
			nW = image.naturalWidth, nH = image.naturalHeight,
			sX = draw[0], sY = draw[1],
			sW = draw[2], sH = draw[3],
			tX = draw[4], tY = draw[5],
			tW = draw[6], tH = draw[7];

		if ( ua.ios ) {
			gc.save();
			gc.translate( tX, tY );
			gc.beginPath();
			gc.rect( 0, 0, tW, tH );
			gc.clip();
			gc.drawImage( image, -sX / sW * tW, -sY / sH * tH, nW * scale, nH * scale );
			gc.restore();
		}
		else {
			gc.drawImage.apply( gc, [image].concat( draw ) );
		}
	}

	var scale = transform.scale = {
		cover : function ( sWidth, sHeight, dWidth, dHeight ) {
			return dWidth / dHeight < sWidth / sHeight ? dHeight / sHeight : dWidth / sWidth;
		},
		contain : function ( sWidth, sHeight, dWidth, dHeight ) {
			return dWidth / dHeight < sWidth / sHeight ? dWidth / sWidth : dHeight / sHeight;
		},
		y : function ( sWidth, sHeight, dWidth, dHeight ) {
			return dHeight / sHeight;
		}
	};

	transform.cover = function ( d ) {
		return transform( {
			s : rect568,
			d : d,
			scale : scale.cover
		} );
	};

	transform.y = function ( d ) {
		return transform( {
			s : rect568,
			d : d,
			scale : scale.y
		} );
	};

	transform.cover504 = function ( d ) {
		return transform( {
			s : rect504,
			d : d,
			scale : scale.cover
		} );
	};

	transform.drawImage = drawImage;
	module.exports = transform;
} );