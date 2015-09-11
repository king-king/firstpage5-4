/**
 * Created by Zuobai on 2015/8/26.
 */

library( function () {
	var array = imports( "array" ),
		async = imports( "async" ),
		img = imports( "./img" ),
		$ = imports( "element" ),
		css = imports( "css" ),
		pointer = imports( "pointer" );

	function ImageInput( onChange ) {
		var input = $( "input.need-default", {
			type : "file",
			accept : "image/*",
			multiple : "true"
		} );

		$.bind( input, "change", function () {
			var images = [];

			async.concurrency( array.map( input.files, function ( file, i ) {
				return function ( callback ) {
					var reader = new FileReader();
					reader.onload = function () {
						images[i] = ( file.type ? reader.result : "data:application/octet-stream;" + reader.result.substr( reader.result.indexOf( "base64," ) ) );
						callback();
					};
					reader.readAsDataURL( file );
				};
			} ), function () {
				onChange && onChange( images );
			} );

		} );

		pointer.onPointerDown( input, function ( event ) {
			event.stopPropagation();
		} );

		return input;
	}

	module.exports = function ( workBody, Work ) {
		var myWorkData = JSON.parse( JSON.stringify( workBody.workData ) ),
			toReplace = [];

		myWorkData.cut = false;

		array.foreach( myWorkData.pages, function ( pageData ) {
			if ( pageData.label === "custom-2" || pageData.label === "SingleImage" ) {
				array.foreach( pageData.image, function ( image ) {
					var imageInfo = image.imageinfo,
						url = image.url;
					if ( ( imageInfo == null && !img.isColor( url ) && pageData.custom.type !== "y" ) || imageInfo && imageInfo.type === "image" ) {
						toReplace.push( image );
					}
				} );
			}
		} );

		function Uploader() {
			return ImageInput( function ( images ) {
				array.foreach( images, function ( url ) {
					if ( toReplace.length ) {
						toReplace[0].url = url;
						toReplace.shift();
					}
				} );

				if ( toReplace.length > 0 ) {
					$( "div", {
						css : css.full( {
							"z-index" : 101,
							background : "white"
						} ),
						children : [
							$( "div", {
								css : {
									position : "absolute",
									width : "100%",
									top : "50%",
									"text-align" : "center",
									"line-height" : "14px",
									"font-size" : "14px",
									"z-index" : 1,
									"pointer-events" : "none"
								},
								innerHTML : "还需要" + toReplace.length + "张"
							} ),
							$( Uploader(), {
								css : {
									position : "absolute",
									width : "100%",
									height : "100%",
									"z-index" : 0,
									opacity : 0
								}
							} )
						]
					}, workBody );
				}
				else {
					var newWork = Work( {
						workData : myWorkData,
						width : workBody.offsetWidth,
						height : workBody.offsetHeight
					} );
					workBody.parentNode.replaceChild( newWork, workBody );
					newWork.play();
				}
			} );
		}

		$( "div", {
			css : {
				position : "absolute",
				right : "0",
				top : "50px",
				width : "44px",
				height : "44px",
				"z-index" : 100,
				"font-size" : "10px"
			},
			children : [
				$( "div", {
					css : {
						position : "absolute",
						width : "100%",
						height : "100%",
						"text-align" : "center",
						"line-height" : "44px",
						background : "rgba(0,0,0,0.3)",
						"z-index" : 1,
						"pointer-events" : "none"
					},
					innerHTML : "我的(" + toReplace.length + ")"
				} ),
				$( Uploader(), {
					css : {
						position : "absolute",
						width : "100%",
						height : "100%",
						"z-index" : 0,
						opacity : 0
					}
				} )
			]
		}, workBody );
	};
} );