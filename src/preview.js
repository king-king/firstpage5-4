/**
 * Created by 白 on 2015/8/14.
 */

library( function () {
	var Img = imports( "./img" ),
		css = imports( "css" ),
		object = imports( "object" ),
		array = imports( "array" ),
		pageAnimation = imports( "./page-animation" ),
		animationData = imports( "./animation-data" ),
		ui = imports( "./ui" ),
		$ = imports( "element" ),
		widget = imports( "./widget" ),
		onDrag = imports( "pointer-drag" ),
		math = imports( "math" ),
		csa = imports( "css-animation" ),
		env = imports( "./env" );

	function Preview( body, themeData ) {
		window.firstpage = window.firstpage || {};

		var oEditAnimate = $( "div", {
				css : {
					position : "absolute",
					right : "0",
					top : "65px",
					width : "55px",
					height : "55px",
					transition : "0.2s",
					"z-index" : 1000
				},
				children : [$( Img.Icon( "edit-animate" ), {
					css : {
						position : "absolute",
						top : 0,
						right : "10px"
					}
				} )]
			}, document.body ),
			oBackground = $( "div.hidden", {
				css : css.full( {
					background : "#525355"
				} )
			}, document.body ),
			tapHandle = null,
			panel = null,
			panelPageIndex = 0;

		// 显示编辑按钮
		function showEditButton( val ) {
			if ( val ) {
				css.remove( oEditAnimate, "transform" );
				css.remove( oEditAnimate, "pointer-events" );
			}
			else {
				css( oEditAnimate, "pointer-events", "none" );
				css.transform( oEditAnimate, css.translate( 45, 0, 0 ) );
			}
		}

		css( body, {
			"transform-origin" : "50% 0",
			transition : "0.2s"
		} );

		showEditButton( false );

		return function ( page ) {
			if ( tapHandle ) {
				tapHandle.remove();
				$.remove( panel );
				tapHandle = panel = null;
			}

			var enterComponentTable = pageAnimation.analyzePage( page ),
				layout = page.wrapper,
				applyEnter = layout.applyEnter,
				options = {};

			if ( applyEnter && ( enterComponentTable.image.length + enterComponentTable.text.length > 0 ) ) {
				// 动画面板
				panel = $( "div", {
					css : {
						position : "absolute",
						height : "90px",
						left : 0,
						right : 0,
						bottom : 0,
						background : "#000000",
						transition : "0.2s"
					}
				}, document.body );

				var curPanelPage = null,
					panelPages = [],
					selectedAnimation = parseInt( applyEnter.pageAnimation || 0 ),
					select = widget.Select( {
						selected : {
							"border-color" : "#FE2454",
							background : "#FE2454"
						},
						unselected : {
							"border-color" : "#333333",
							background : "transparent"
						}
					} ),
					count = 0,
					redPointWrapper = $( "div", {
						css : {
							position : "absolute",
							height : "4px",
							bottom : 0
						}
					}, panel );

				// 制作动画面板的页
				object.foreach( object.extend( {
					0 : {
						name : "随机配置"
					}
				}, animationData.pageAnimations ), function ( id, data ) {
					var pos = count++ % 8;
					if ( pos === 0 ) {
						var redPoint = $( "div", {
							css : {
								"float" : "left",
								width : "4px",
								height : "4px",
								"border-radius" : "4px",
								"margin-left" : redPointWrapper.childElementCount ? "8px" : 0
							}
						}, redPointWrapper );
						curPanelPage = $( "div", {
							css : {
								position : "absolute",
								left : "14px",
								right : "14px",
								top : 0,
								bottom : 0
							}
						}, panel );
						curPanelPage.selected = widget.State( redPoint, {
							"selected" : {
								background : "#FFFFFF"
							},
							"unselected" : {
								background : "#515151"
							}
						}, "unselected" );
						curPanelPage.pageIndex = panelPages.length;
						panelPages.push( curPanelPage );
					}

					var wrapper = $( "div", {
							css : {
								"float" : "left",
								width : "25%",
								height : "45px",
								position : "relative"
							}
						}, curPanelPage ),
						button = options[id] = select.Option( $( "div", {
							css : object.extend( {
								"font-size" : "11px",
								position : "absolute",
								color : "white",
								height : "20px",
								border : "1px solid",
								top : pos < 4 ? "15px" : "auto",
								bottom : pos < 4 ? "auto" : "14px",
								"line-height" : "20px",
								"border-radius" : "12px",
								"text-align" : "center"
							}, css.center( 58 ) ),
							innerHTML : data.name
						}, wrapper ) );

					button.onSelect( function () {
						page.pageData.pageAnimation = parseInt( id );
					} );

					ui.onTap( wrapper, function () {
						page.fastForward();
						pageAnimation.applyAnimate( page, parseInt( id ) ? data : themeData.appliedGroup[page.index] );
						button.select();
						setTimeout( function () {
							page.prepare();
							page.play();
						}, 0 );
					} );
				} );

				css( redPointWrapper, css.center( redPointWrapper.childElementCount * 12 - 8 ) );

				// 选择页
				function selectPage( targetIndex ) {
					curPanelPage = panelPages[panelPageIndex = targetIndex];
					array.foreach( panelPages, function ( page ) {
						css.remove( page, "transform" );
						if ( page === curPanelPage ) {
							page.selected( "selected" );
							page.classList.remove( "hidden" );
						}
						else {
							page.selected( "unselected" );
							page.classList.add( "hidden" );
						}
					} );
				}

				selectPage( panelPageIndex );

				if ( panelPages.length > 1 ) {
					ui.onSwipeStart( panel, function ( event ) {
						var curX = 0,
							panelWidth = panel.offsetWidth,
							left = panelPages[math.index( panelPageIndex - 1, panelPages.length )],
							right = panelPages[math.index( panelPageIndex + 1, panelPages.length )],
							direction;

						function setX( panel, x ) {
							panel.classList.remove( "hidden" );
							css.transform( panel, css.translate( x, 0, 0 ) );
						}

						if ( event.xOut ) {
							array.foreach( panelPages, function ( page ) {
								page.selected( "unselected" );
							} );

							onDrag( {
								onMove : function ( event ) {
									direction = event.dX > 0;
									curX = math.range( curX + event.dX, -panelWidth, panelWidth );
									right.classList.add( "hidden" );
									left.classList.add( "hidden" );
									curX > 0 ? setX( left, curX - panelWidth ) : setX( right, curX + panelWidth );
									setX( curPanelPage, curX )
								},
								onUp : function ( event ) {
									var ratio = curX / panelWidth + ( Math.abs( event.speedX ) > 0.2 ? math.sign( event.speedX ) * 0.5 : direction ? 0.35 : -0.35 ),
										sign = ratio > 0.5 ? 1 : ratio < -0.5 ? -1 : 0,
										lock = ui.Lock();

									function Animation( el, i ) {
										return [el, {
											100 : {
												transform : css.translate( ( sign + i ) * panelWidth, 0, 0 )
											}
										}, "ease-in-out", 0.2];
									}

									csa.runAnimation( [
										Animation( curPanelPage, 0 ),
										curX > 0 ? Animation( left, -1 ) : Animation( right, 1 )
									], function () {
										lock.remove();
										selectPage( math.index( panelPageIndex - sign, panelPages.length ) );
									} );
								}
							} );
						}
					} );
				}

				// 结束编辑
				function closeEdit() {
					page.fastForward();
					body.classList.remove( "lock" );
					css.remove( body, "transform" );
					showPanel( false );
					showEditButton( true );
				}

				firstpage.completeAnimationEdit = function () {
					firstpage.selectAnimation( page.pid, selectedAnimation = page.pageData.pageAnimation );
					closeEdit();
				};

				firstpage.cancelAnimationEdit = function () {
					page.pageData.pageAnimation = selectedAnimation;
					closeEdit();
				};

				// 显示编辑面板
				function showPanel( val ) {
					oBackground.classList.remove( "hidden" );
					val ? css.remove( panel, "transform" ) : css.transform( panel, "translate3d(0,100%,0)" );
				}

				showPanel( false );
				showEditButton( true );
				tapHandle = ui.onTap( oEditAnimate, function () {
					var lock = ui.Lock();
					env.useClient( ["startAnimationEdit", "selectAnimation"], function () {
						lock.remove();
						page.fastForward();
						body.classList.add( "lock" );
						css.transform( body, css.scale( 1 - 90 / body.offsetHeight ) );
						showEditButton( false );
						showPanel( true );
						firstpage.startAnimationEdit();
						options[selectedAnimation].select();
					} );
				} );
			}
			else {
				showEditButton( false );
			}
		};
	}

	module.exports = Preview;
} );