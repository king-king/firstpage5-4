/**
 * Created by 白 on 2014/12/26.
 */

library( function () {
	var relativeX = Relative( "w", "x" ),
		relativeY = Relative( "h", "y" );

	function Relative( sizeName, posName ) {
		return function ( d, dAlign, s, sAlign, isIn ) {
			return s[sizeName] * sAlign - d[sizeName] * dAlign + ( isIn ? 0 : ( s[posName] || 0 ) );
		};
	}

	function RelativeX( dAlign, sAlign ) {
		return function ( d, s, isIn ) {
			return relativeX( d, dAlign, s, sAlign, isIn );
		}
	}

	function RelativeY( dAlign, sAlign ) {
		return function ( d, s, isIn ) {
			return relativeY( d, dAlign, s, sAlign, isIn );
		}
	}

	module.exports = {
		leftIn : RelativeX( 0, 0 ),
		leftTo : RelativeX( 1, 0 ),
		rightIn : RelativeX( 1, 1 ),
		rightTo : RelativeX( 0, 1 ),
		center : RelativeX( 0.5, 0.5 ),
		topIn : RelativeY( 0, 0 ),
		topTo : RelativeY( 1, 0 ),
		bottomIn : RelativeY( 1, 1 ),
		bottomTo : RelativeY( 0, 1 ),
		middle : RelativeY( 0.5, 0.5 ),

		right : function ( ps ) {
			return ps.x + ps.w;
		},
		bottom : function ( ps ) {
			return ps.y + ps.h;
		}
	};
} );