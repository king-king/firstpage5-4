/**
 * Created by 白 on 2015/7/28.
 */

library( function () {
	var draw = imports( "canvas" ),
		textViewer = imports( "text-viewer" ),
		math = imports( "math" ),
		object = imports( "object" ),
		array = imports( "array" ),
		async = imports( "async" ),
		ajax = imports( "ajax" ),
		rect = imports( "rect" ),
		Text = imports( "./text" );

	function Timer( duration ) {
		var start;

		return {
			tick : function ( onTick ) {
				if ( start === undefined ) {
					start = new Date();
					onTick && onTick();
					return 0;
				}
				else if ( start === null ) {
					return 1;
				}
				else {
					var value = Math.min( ( new Date() - start ) / duration, 1 );
					if ( value === 1 ) {
						start = null;
					}
					onTick && onTick();
					return value;
				}
			}
		};
	}

	function LabelName( label ) {
		object.foreach( {
			"SingleImage" : "单图",
			"ImageText" : "图文",
			"MutipleImage" : "多图",
			"contact" : "联系",
			"map" : "地图",
			"video" : "视频",
			"scratch-card" : "涂抹",
			"custom" : "自定义",
			"qrcode" : "二维码",
			"Sign-Up" : "报名",
			"author" : "作者",
			"razzies-double" : "酸梅双",
			"razzies-single" : "酸梅单"
		}, function ( e, c ) {
			label = label.replace( e, c );
		} );
		return label;
	}

	function Scroll() {
		var ratio = 0,
			range, inner, outer;

		return {
			setSize : function ( i, o ) {
				range = ( inner = i ) - ( outer = o );
			},
			move : function ( diff ) {
				ratio = range > 0 ? Math.max( Math.min( ( range * ratio + diff ) / range, 1 ), 0 ) : 0;
			},
			canScroll : function () {
				return range > 0;
			},
			contentRange : function () {
				var start = ( range > 0 ? range * ratio : 0 ) << 0;
				return {
					start : start,
					end : start + outer
				};
			},
			scrollBar : function () {
				var size = Math.ceil( outer * outer / range << 0 ),
					offset = Math.ceil( ( outer - size ) * ratio ) << 0;

				return range > 0 ? {
					offset : offset,
					size : Math.min( size, outer - offset )
				} : null;
			}
		};
	}

	function FloatLayout( arg ) {
		var parentWidth = arg.width,
			curLineHeight = 0, curY = 0, curX = 0,
			lines = [], curLine = [],
			maxLineWidth = 0;

		arg.foreach( function ( area ) {
			if ( curX + area.width > parentWidth ) {
				lines.push( {
					y : curY,
					height : curLineHeight,
					layouts : curLine
				} );
				curLine = [];
				curY += curLineHeight + arg.marginY;
				maxLineWidth = Math.max( maxLineWidth, curX - arg.marginX );
				curLineHeight = 0;
				curX = 0;
			}

			curLine.push( {
				x : curX,
				area : area
			} );
			curLineHeight = Math.max( area.height, curLineHeight );
			curX += area.width + arg.marginX;
		} );

		return {
			height : curY,
			width : maxLineWidth,
			lines : lines
		};
	}

	function LayoutList( cc ) {
		var layoutList = null,
			loadEvent = async.Event(),
			scroll = Scroll(),
			selectedList = [],
			tags = [],
			maxImageNumber = 0, // 板式最多图片
			scrollTop = 0,
			imageWidth = 120,
			xhr = ajax( {
				url : "/debug/layout.json"
			}, function () {
				var tags = [], // 标签列表
					list = [], // 板式列表
					imageHeight = imageWidth / 320 * 568,
					textTop = imageHeight + 7,
					fontSize = 14,
					height = textTop + fontSize;

				// 添加板式
				layoutList = array.map( JSON.parse( xhr.responseText ), function ( item ) {
					var layout = item.layout,
						label = LabelName( layout.label ),
						layoutTag = {},
						typeCount = {
							image : 0,
							text : 0
						},
						backgroundImage = null,
						image = new Image(),
						node = {},
						oId = Text.Label( item.id, {
							fontSize : fontSize
						}, fontSize ),
						oName = Text.Label( label, {
							fontSize : fontSize
						}, fontSize ),
						transition = Timer( 200 );

					image.onload = function () {
						cc.dirty();
						image.loaded = true;
						image.onload = null;
					};

					// 类型划分
					if ( label === "custom-2" || label === "screen" ) {
						layoutTag["自定义-2"] = true;
					}
					else if ( label === "custom" ) {
						layoutTag["自定义"] = true;
					}
					else if ( /SingleImage|ImageText|MutipleImage/.test( label ) ) {
						layoutTag["图文"] = true;
					}
					else {
						layoutTag["功能"] = true;
					}

					if ( layoutTag["自定义-2"] === true ) {
						var custom = layout.custom;

						layoutTag[custom.type === "y" ? "y板式" : "覆盖板式"] = true;

						array.foreach( layout.image, function ( image ) {
							var imageInfo = image.imageinfo;
							if ( imageInfo ) {
								var type = imageInfo.type;
								if ( type in typeCount ) {
									typeCount[type]++;
								}

								if ( image.mask ) {
									layoutTag["遮罩"] = true;
								}

								if ( image.frame ) {
									layoutTag["相框"] = true;
								}
							}
							else {
								backgroundImage = image;
							}
						} );

						if ( typeCount.image === 0 ) {
							if ( backgroundImage && /^http/.test( backgroundImage.url ) ) {
								layoutTag["背景图"] = true;
							}
						}
						else {
							layoutTag[typeCount.image + "图"] = true;
						}

						maxImageNumber = Math.max( typeCount.image, maxImageNumber );
					}

					object.insert( node, {
						height : height,
						draw : function ( gc, point ) {
							if ( !image.src ) {
								image.src = item.thumbnail;
							}

							if ( image.loaded ) {
								var target = {width : imageWidth, height : imageHeight};
								image.clip = image.clip || [image].concat( rect.clipImage( image, target, rect.scale.cover( image, target ), 0.5, 0.5 ) );
								gc.save();
								gc.globalAlpha *= transition.tick( cc.dirty );
								gc.drawImage.apply( gc, image.clip );
								gc.restore();

								if ( point ) {
									gc.fillStyle = "rgba(0,0,0,0.2)";
									gc.fillRect( 0, 0, imageWidth, imageHeight );
								}
							}

							gc.translate( 0, textTop );
							oId.draw( gc );
							gc.translate( oId.width + 7, 0 );
							oName.draw( gc );
						},
						isIn : function ( x, y ) {
							return math.inRect( x, y, 0, 0, imageWidth, height );
						}
					} );

					return node;
				} );

				loadEvent.trig();

				cc.dirty();
			} );

		return {
			onLoad : loadEvent.regist,
			area : function ( width, height ) {
				if ( layoutList ) {
					function getLayout( width ) {
						return FloatLayout( {
							width : width,
							marginX : Math.floor( ( width - numberPerLine * imageWidth ) / ( numberPerLine - 1 ) ),
							marginY : 14,
							foreach : function ( callback ) {
								array.foreach( layoutList, function ( layout ) {
									callback( {
										width : imageWidth,
										height : layout.height,
										draw : layout.draw,
										isIn : layout.isIn
									} );
								} );
							}
						} );
					}

					var numberPerLine = Math.floor( width / ( imageWidth + 14 ) ),
						floatLayout = getLayout( width );

					scroll.setSize( floatLayout.height, height );
					if ( scroll.canScroll() ) {
						floatLayout = getLayout( width - 14 );
					}

					return {
						draw : function ( gc, point ) {
							var contentRange = scroll.contentRange(),
								scrollBar = scroll.scrollBar();

							gc.save();
							array.foreach( floatLayout.lines, function ( line ) {
								if ( line.y + line.height > contentRange.start ) {
									if ( line.y > contentRange.end ) {
										return true;
									}

									array.foreach( line.layouts, function ( layout ) {
										gc.save();
										gc.translate( layout.x, line.y - contentRange.start );
										draw( gc, layout.area, point );
										gc.restore();
									} );
								}
							} );
							gc.restore();

							if ( point ) {
								// 滚动
								cc.onMouseWheel( function ( e ) {
									scroll.move( e.deltaY / 120 * 80 );
									cc.dirty();
								} );
							}

							// 滚动条
							if ( scrollBar ) {
								gc.save();
								gc.fillStyle = "rgba(0,0,0,0.8)";
								gc.fillRect( width - 6, scrollBar.offset, 6, scrollBar.size );
							}
						},
						isIn : function ( x, y ) {
							return math.inRect( x, y, 0, 0, width, height );
						}
					};
				}
			}
		};
	}

	module.exports = LayoutList;
} );