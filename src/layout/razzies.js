/**
 * Created by 白 on 2015/3/27.
 * 金酸梅板式
 */

plugin( function () {
	var array = imports( "array" ),
		object = imports( "object" ),
		Content = imports( "../content" ),
		p = imports( "../position" ),
		ea = imports( "../enter-animation" ),
		Layout = imports( "../layout" ),
		Component = Layout.Component,
		layoutFormats = Layout.formats;

	function Razzies( isSingle ) {
		return {
			resource : {
				background : isSingle ? "razzies-single.png" : "razzies-double.png",
				bannerLeft : "razzies/banner-left",
				bannerCenter : "razzies/banner-center",
				bannerRight : "razzies/banner-right",
				cup : "razzies-cup.png"
			},
			create : function ( layout, ds, resource ) {
				var scale = layout.yScale / 1008 * 1136;

				function setPosition( comp, x, y ) {
					comp.y = y * scale;
					comp.x = ( x - 160 ) * scale + layout.w / 2;
					return comp;
				}

				// 头像
				var headSize = 104 * scale;
				if ( isSingle ) {
					setPosition( Component( Content.Cover( ds.image( 0 ), {w : headSize, h : headSize} ), layout ), 108, 41 );
				}
				else {
					setPosition( Component( Content.Cover( ds.image( 0 ), {w : headSize, h : headSize} ), layout ), 56, 41 );
					setPosition( Component( Content.Cover( ds.image( 1 ), {w : headSize, h : headSize} ), layout ), 161, 41 );
				}

				// 背景
				var background = Component( Content.Image( resource.background, scale ), layout );
				background.x = p.center( background, layout );

				// 横幅
				var bannerText = Component( Content.Label( ds.text( 0 ), {
						fontSize : 15 * scale << 0,
						color : "#fdf1c8"
					} ) ),
					bannerLeft = Component( Content.Image( resource.bannerLeft, scale ) ),
					banner = Component( Content.Rect( bannerText.w + 50 * scale << 0, bannerLeft.h ), layout ),
					bannerRight = Component( Content.Image( resource.bannerRight, scale ) ),
					bannerCenter = Component( Content.Image( resource.bannerCenter, {
						w : banner.w - bannerLeft.w * 2 + 8,
						h : bannerLeft.h
					} ) );

				array.foreach( [bannerLeft, bannerRight, bannerCenter, bannerText], function ( comp ) {
					comp.appendTo( banner );
				} );

				bannerRight.x = p.rightIn( bannerRight, banner, true );
				bannerCenter.x = p.center( bannerCenter, banner, true );
				bannerText.x = p.center( bannerText, banner, true );
				bannerText.y = ( 30 * scale - bannerText.h ) / 2 << 0;
				banner.x = p.center( banner, layout );
				banner.y = 153 * scale;

				// 奖杯和获奖文字
				var awardText = Component( Content.BlockText( ds.text( 1 ), {
					width : 250 * scale,
					lineHeight : 20 * scale << 0,
					fontSize : 12 * Math.max( scale, 1 ) << 0,
					color : "#fdf1c9"
				} ), layout );
				awardText.x = p.center( awardText, layout );
				awardText.y = 200 * scale;

				var cup = Component( Content.Image( resource.cup, scale ) ),
					cupFrame = setPosition( Component( Content.Rect( cup.w, cup.h ), layout ), 132 / 2, 566 / 2 ),
					cupCaption = Component( Content.Rect( 85 * scale, 37 * scale ), cupFrame );

				cup.appendTo( cupFrame );
				cupCaption.zi = 1;
				cupCaption.x = p.center( cupCaption, cupFrame, true ) - 1;
				cupCaption.y = 129 * scale;

				var awardName = ds.text( 2 ).toString().split( "\n" ),
					cupCationInfo = {
						fontSize : 15 * scale,
						color : "#40234a"
					};

				function CupCaption( i, y ) {
					var comp = Component( Content.Label( awardName[i], cupCationInfo ), cupCaption );
					comp.x = p.center( comp, cupCaption, true );
					comp.y = y === undefined ? p.middle( comp, cupCaption, true ) : y;
				}

				if ( awardName.length === 1 ) {
					CupCaption( 0 );
				}
				else {
					CupCaption( 0, 0 );
					CupCaption( 1, 20 * scale );
				}

				banner.enter = ea.fallDownAndShake;
				awardText.ea = ea.Emerge();
				awardText.ea.delay = 1;
				cupFrame.ea = ea.shrink;
				cupFrame.ea.delay = 2.3;
			}
		};
	}

	layoutFormats["razzies-single"] = Razzies( true );
	layoutFormats["razzies-double"] = Razzies( false );
} );