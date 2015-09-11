/**
 * Created by 白 on 2015/8/25.
 */

library( function () {
	var parseLrc = imports( "lrc" ),
		$ = imports( "element" ),
		animation = imports( "animation" ),
		csa = imports( "css-animation" ),
		object = imports( "object" ),
		URL = imports( "url" ),
		hrefArg = URL( location.href ).arg,
		delay = parseFloat( hrefArg.delay || "0" ),
		ajax = imports( "ajax" ),
		String = imports( "string" ),
		array = imports( "array" ),
		css = imports( "css" ),
		random = imports( "random" );

	function split( text, line, margin ) {
		var curSpan = $( "span", line );
		String.foreach( text, function ( ch ) {
			if ( /[A-Za-z]/.test( ch ) ) {
				curSpan.innerHTML += ch;
				curSpan.english = true;
			}
			else {
				curSpan = $( "span", {
					css : {
						"margin-left" : css.px( curSpan.english ? margin * 2 : margin )
					},
					innerHTML : curSpan.english ? ch.replace( " ", "" ) : ch
				}, line );
			}
		} );
	}

	var Engine = {
		"left-right" : function ( body ) {
			var oLine = null,
				left = true;

			return function ( curLine ) {
				if ( oLine ) {
					var lastOLine = oLine;
					csa.runAnimation( [
						[lastOLine, {
							100 : {
								opacity : 0
							}
						}, 0.3]
					], function () {
						$.remove( lastOLine );
					} );
				}

				if ( curLine.lyric ) {
					oLine = $( "div", {
						css : object.extend( {
							position : "absolute",
							"text-shadow" : "1px 1px 1px white",
							color : "black",
							"writing-mode" : "vertical-rl",
							"z-index" : "100"
						}, left ? {
							top : "30px",
							left : "3px"
						} : {
							bottom : "30px",
							right : "3px"
						} ),
						innerHTML : curLine.lyric
					}, body );
					csa.runAnimation( [
						[oLine, {
							0 : {
								opacity : 0
							}
						}, 0.3]
					] );
					left = !left;
				}
			};
		},
		top : function ( body ) {
			var oLine = null;

			return function ( curLine ) {
				if ( oLine ) {
					var lastOLine = oLine;
					csa.runAnimation( [
						[lastOLine, {
							100 : {
								opacity : 0
							}
						}, 0.3]
					], function () {
						$.remove( lastOLine );
					} );
				}

				if ( curLine.lyric ) {
					oLine = $( "div", {
						css : {
							position : "absolute",
							"text-shadow" : "0 1px 2px white",
							color : "black",
							"z-index" : "100",
							top : "14px",
							width : "100%",
							left : 0,
							"text-align" : "center",
							"line-height" : "28px",
							"font-family" : "ljsh433241",
							"font-size" : "16px"
						},
						innerHTML : curLine.lyric
					}, body );
					csa.runAnimation( [
						[oLine, {
							0 : {
								opacity : 0
							}
						}, 0.3]
					] );
				}
			}
		},
		bottom : function ( body ) {
			var oLine = null;

			return function ( curLine, isNew ) {
				if ( !isNew ) {
					if ( oLine ) {
						var lastOLine = oLine;
						csa.runAnimation( array.map( lastOLine.querySelectorAll( "span" ), function ( span ) {
							return [span, {
								100 : {
									opacity : 0,
									filter : "blur(10px)"
								}
							}, 0.7];
						} ), function () {
							$.remove( lastOLine );
						} );
					}
				}

				if ( isNew ) {
					if ( curLine.lyric ) {
						oLine = $( "div", {
							css : {
								"font-size" : "18px",
								position : "absolute",
								"text-shadow" : "0.5px 0.866px 1.5px rgba(0, 0, 0, 0.5)",
								color : "white",
								"z-index" : "100",
								bottom : "50px",
								width : "100%",
								left : 0,
								"text-align" : "center",
								"font-family" : "jdmeiheijian435804"
							}
						}, body );
						split( curLine.lyric, oLine, 3 );
						csa.runAnimation( array.map( oLine.querySelectorAll( "span" ), function ( span, i ) {
							return [span, {
								0 : {
									opacity : 0,
									filter : "blur(10px)"
								}
							}, 0.7, i * 0.035, "linear"];
						} ) );
					}
				}
			}
		},
		bottom2 : function ( body ) {
			var oLine = null;

			return function ( curLine, isNew ) {
				if ( !isNew ) {
					if ( oLine ) {
						var lastOLine = oLine;
						csa.runAnimation( array.map( random.arrange( lastOLine.querySelectorAll( "span" ) ), function ( span, i ) {
							return [span, {
								100 : {
									opacity : 0,
									filter : "blur(10px)"
								}
							}, 0.7, i * 0.07];
						} ), function () {
							$.remove( lastOLine );
						} );
					}
				}

				if ( isNew ) {
					if ( curLine.lyric ) {
						oLine = $( "div", {
							css : {
								"font-size" : "18px",
								position : "absolute",
								"text-shadow" : "0.5px 0.866px 1.5px rgba(0, 0, 0, 0.5)",
								color : "white",
								"z-index" : "100",
								bottom : "25px",
								right : "25px",
								"font-family" : "jdmeiheijian435804"
							}
						}, body );
						split( curLine.lyric, oLine, 5 );

						csa.runAnimation( array.map( random.arrange( oLine.querySelectorAll( "span" ) ), function ( span, i ) {
							return [span, {
								0 : {
									opacity : 0,
									filter : "blur(10px)"
								}
							}, 0.7, i * 0.07];
						} ) );
					}
				}
			}
		},
		right : function ( body ) {
			var oLine = null;

			return function ( curLine ) {
				if ( oLine ) {
					var lastOLine = oLine;
					csa.runAnimation( [
						[lastOLine, {
							100 : {
								opacity : 0
							}
						}, 0.3]
					], function () {
						$.remove( lastOLine );
					} );
				}

				if ( curLine.lyric ) {
					oLine = $( "div", {
						css : {
							position : "absolute",
							"text-shadow" : "1px 1px 1px white",
							color : "black",
							"z-index" : "100",
							right : "18px",
							top : "60px",
							"writing-mode" : "vertical-rl"
						},
						innerHTML : curLine.lyric
					}, body );
					csa.runAnimation( [
						[oLine, {
							0 : {
								opacity : 0
							}
						}, 0.3]
					] );

					if ( hrefArg.font ) {
					}
				}
			}
		}
	};

	module.exports = function ( body, audio, lyricSrc, mode ) {
		var lyricHandle,
			xhr = ajax( {
				url : lyricSrc
			}, function () {
				var lyric = parseLrc( xhr.responseText ),
					engine = Engine[mode || "left-right"]( body ),
					curIndex = 0,
					lastTime;

				xhr = null;

				animation.requestFrame( function () {
					if ( lastTime !== undefined && audio.currentTime < lastTime ) {
						curIndex = 0;
						array.foreach( lyric, function ( line ) {
							line.end = false;
						} );
					}

					var curLine = lyric[curIndex];
					if ( curLine && !curLine.end && audio.currentTime * 100 + 100 > curLine.start + delay * 1000 ) {
						engine( curLine, false );
						curLine.end = true;
					}

					if ( curLine && audio.currentTime * 100 > curLine.start + delay * 1000 ) {
						++curIndex;
						engine( curLine, true );
					}
					lastTime = audio.currentTime;
				} );
			} );

		return {
			remove : function () {
				xhr && xhr.abort();
				lyricHandle && lyricHandle.remove();
			}
		};
	};
} );