/**
 * Created by 白 on 2015/3/18.
 */

plugin( function () {
	var $ = imports( "element" ),
		css = imports( "css" ),
		tips = imports( "../tips" ),
		bmap = imports( "../lib/bmap" ),
		csa = imports( "css-animation" ),
		Img = imports( "../img" ),
		env = imports( "../env" ),
		Layout = imports( "../layout" ),
		Content = imports( "../content" ),
		ui = imports( "../ui" ),
		util = imports( "../util" ),
		p = imports( "../position" ),
		Component = Layout.Component,
		layoutFormats = Layout.formats;

	css.insertRules( {
		".BMap_Marker img" : {
			width : "100%"
		}
	} );

	layoutFormats.map = {
		resource : {
			location : "map/location"
		},
		create : function ( layout, ds, resource ) {
			var l = util.layout504( layout, ds.image( 0 ) );

			var icon = l.image( resource.location, layout );
			icon.x = p.center( icon, layout );
			icon.y = l.y( 574 / 2 );

			var address = Component( Content.Label( ds.location( 0 ).address, {
				lineHeight : 14 * l.scale << 0,
				fontSize : 12 * l.scale << 0,
				color : "#FFFFFF"
			} ), layout );
			address.x = p.center( address, layout );
			address.y = l.y( 680 / 2 );

			// 地图图标闪烁
			layout.onShow( function () {
				csa.runAnimation( [icon.element, {
					"50" : {
						opacity : 0.4
					}
				}, 3, "linear", "infinite"] );
			} );

			var click = Component( Content.Rect( 120 * l.scale, 100 * l.scale ), layout );
			click.x = p.center( click, layout );
			click.y = l.y( ( 574 - 20 ) / 2 );

			// 点击地图图标,弹出地图页
			var slidePage;
			ui.onTap( click.element, function () {
				// 如果没有地图页,创建它
				if ( !slidePage ) {
					slidePage = $( env.SlidePage(), {
						css : {
							background : "white"
						}
					} );

					var back = slidePage.appendChild( $( "div", {
							css : {
								position : "absolute",
								left : "10px",
								top : "10px",
								width : "143px",
								height : "38px",
								"background-color" : "rgba(0, 0, 0, 0.8)",
								"box-shadow" : "0 0 1px 0 rgba(0, 0, 0, 0.6)",
								"z-index" : "1000"
							},
							children : [$( "div",
								{
									css : {
										position : "absolute",
										width : "49px",
										left : "0",
										top : "0",
										bottom : "0"
									},
									children : [$( util.staticCenter( Img.Icon( "map/back" ) ) )]
								} ), $( "div", {
								css : {
									position : "absolute",
									left : "49px",
									width : "1px",
									top : "0",
									bottom : "0",
									"background-color" : "#000",
									"box-shadow" : "1px 0 rgba(113, 113, 113, .75)"
								}
							} ), $( "div", {
								css : {
									position : "absolute",
									left : "50px",
									right : "0",
									top : "0",
									bottom : "0",
									color : "#e7e7e7",
									"text-align" : "center",
									"line-height" : "38px",
									"font-size" : "16px",
									"letter-spacing" : "2px"
								},
								innerHTML : "地图"
							} )]
						} ) ),
						loading = tips.Loading( slidePage );

					ui.onTap( back, function () {
						slidePage.slideOut();
					} );

					bmap.MarkerMap( {
						data : ds.location(),
						parent : slidePage,
						make : function ( item ) {
							return $( "div", [
								$( "div", {
									css : {
										"font-size" : "16px",
										"font-weight" : "bold",
										"line-height" : "22px",
										"padding-bottom" : "6px",
										width : "220px"
									},
									innerHTML : item.name
								} ),
								$( "div", {
									css : {
										"font-size" : "12px"
									},
									children : [
										$( "div", {
											css : {
												display : "inline-block",
												"vertical-align" : "top"
											},
											innerHTML : "地址:"
										} ),
										$( "div", {
											css : {
												display : "inline-block",
												width : "184px",
												"margin-left" : "5px",
												"vertical-align" : "top"
											},
											innerHTML : item.address
										} )
									]
								} )
							] );
						},
						onLoad : function () {
							$.remove( loading );
						}
					} );
				}

				slidePage.slideIn( layout.body );
			} );
		}
	};
} );